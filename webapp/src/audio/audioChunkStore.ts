type AudioRecordingRecord = {
  audioStreamId: string
  mimeType: string
  totalDurationMilliseconds: number
  chunkCount: number
  uploadedChunkCount: number
  uploadCompleted: boolean
  createdAtUnixMs: number
}

type AudioChunkRecord = {
  id: string
  audioStreamId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  encryptedBytes: Uint8Array
  uploaded: boolean
}

const databaseName = 'coachscribe-audio'
const databaseVersion = 1
const recordingsStoreName = 'audioRecordings'
const chunksStoreName = 'audioChunks'

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(recordingsStoreName)) {
        database.createObjectStore(recordingsStoreName, { keyPath: 'audioStreamId' })
      }
      if (!database.objectStoreNames.contains(chunksStoreName)) {
        const store = database.createObjectStore(chunksStoreName, { keyPath: 'id' })
        store.createIndex('audioStreamId', 'audioStreamId', { unique: false })
        store.createIndex('uploaded', 'uploaded', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB database.'))
  })
}

function runTransaction<Result>(
  database: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: Result) => void, reject: (error: unknown) => void) => void,
): Promise<Result> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    run(store, resolve, reject)
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
  })
}

export async function saveAudioRecording(record: AudioRecordingRecord): Promise<void> {
  const database = await openDatabase()
  await runTransaction<void>(database, recordingsStoreName, 'readwrite', (store, resolve, reject) => {
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to save audio recording.'))
  })
  database.close()
}

export async function saveAudioRecordingIfMissing(record: AudioRecordingRecord): Promise<void> {
  const existing = await loadAudioRecording(record.audioStreamId)
  if (existing) return
  await saveAudioRecording(record)
}

export async function updateAudioRecording(
  audioStreamId: string,
  update: (record: AudioRecordingRecord) => AudioRecordingRecord,
): Promise<void> {
  const database = await openDatabase()
  await runTransaction<void>(database, recordingsStoreName, 'readwrite', (store, resolve, reject) => {
    const getRequest = store.get(audioStreamId)
    getRequest.onsuccess = () => {
      const record = getRequest.result as AudioRecordingRecord | undefined
      if (!record) {
        resolve()
        return
      }
      const nextRecord = update(record)
      const putRequest = store.put(nextRecord)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error ?? new Error('Failed to update audio recording.'))
    }
    getRequest.onerror = () => reject(getRequest.error ?? new Error('Failed to load audio recording.'))
  })
  database.close()
}

export async function loadAudioRecording(audioStreamId: string): Promise<AudioRecordingRecord | null> {
  const database = await openDatabase()
  const record = await runTransaction<AudioRecordingRecord | undefined>(database, recordingsStoreName, 'readonly', (store, resolve, reject) => {
    const request = store.get(audioStreamId)
    request.onsuccess = () => resolve(request.result as AudioRecordingRecord | undefined)
    request.onerror = () => reject(request.error ?? new Error('Failed to load audio recording.'))
  })
  database.close()
  return record ?? null
}

export async function saveAudioChunk(record: AudioChunkRecord): Promise<void> {
  const database = await openDatabase()
  await runTransaction<void>(database, chunksStoreName, 'readwrite', (store, resolve, reject) => {
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to save audio chunk.'))
  })
  database.close()
}

export async function saveAudioChunkAndUpdateRecording(params: {
  audioStreamId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  encryptedBytes: Uint8Array
}): Promise<void> {
  await saveAudioChunk({
    id: `${params.audioStreamId}:${params.chunkIndex}`,
    audioStreamId: params.audioStreamId,
    chunkIndex: params.chunkIndex,
    startMilliseconds: params.startMilliseconds,
    durationMilliseconds: params.durationMilliseconds,
    encryptedBytes: params.encryptedBytes,
    uploaded: false,
  })
  await updateAudioRecording(params.audioStreamId, (record) => {
    const chunkCount = Math.max(record.chunkCount, params.chunkIndex + 1)
    const totalDurationMilliseconds = Math.max(
      record.totalDurationMilliseconds,
      params.startMilliseconds + params.durationMilliseconds,
    )
    return { ...record, chunkCount, totalDurationMilliseconds }
  })
}

export async function finalizeAudioRecording(params: {
  audioStreamId: string
  totalDurationMilliseconds: number
  chunkCount: number
}): Promise<void> {
  await updateAudioRecording(params.audioStreamId, (record) => ({
    ...record,
    totalDurationMilliseconds: params.totalDurationMilliseconds,
    chunkCount: params.chunkCount,
  }))
}

export async function saveAudioChunks(chunks: AudioChunkRecord[]): Promise<void> {
  if (!chunks.length) return
  const database = await openDatabase()
  await runTransaction<void>(database, chunksStoreName, 'readwrite', (store, resolve, reject) => {
    let remaining = chunks.length
    for (const chunk of chunks) {
      const request = store.put(chunk)
      request.onsuccess = () => {
        remaining -= 1
        if (remaining === 0) resolve()
      }
      request.onerror = () => reject(request.error ?? new Error('Failed to save audio chunk.'))
    }
  })
  database.close()
}

export async function loadAudioChunkByIndex(audioStreamId: string, chunkIndex: number): Promise<AudioChunkRecord | null> {
  const database = await openDatabase()
  const id = `${audioStreamId}:${chunkIndex}`
  const record = await runTransaction<AudioChunkRecord | undefined>(database, chunksStoreName, 'readonly', (store, resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as AudioChunkRecord | undefined)
    request.onerror = () => reject(request.error ?? new Error('Failed to load audio chunk.'))
  })
  database.close()
  return record ?? null
}

export async function loadAudioChunksByStreamId(audioStreamId: string): Promise<AudioChunkRecord[]> {
  const database = await openDatabase()
  const records = await runTransaction<AudioChunkRecord[]>(database, chunksStoreName, 'readonly', (store, resolve, reject) => {
    const index = store.index('audioStreamId')
    const request = index.getAll(audioStreamId)
    request.onsuccess = () => resolve((request.result as AudioChunkRecord[]) ?? [])
    request.onerror = () => reject(request.error ?? new Error('Failed to load audio chunks.'))
  })
  database.close()
  return records
}

export async function markAudioChunkUploaded(audioStreamId: string, chunkIndex: number): Promise<void> {
  const database = await openDatabase()
  const id = `${audioStreamId}:${chunkIndex}`
  await runTransaction<void>(database, chunksStoreName, 'readwrite', (store, resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => {
      const record = request.result as AudioChunkRecord | undefined
      if (!record || record.uploaded) {
        resolve()
        return
      }
      const updated = { ...record, uploaded: true }
      const putRequest = store.put(updated)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error ?? new Error('Failed to update audio chunk.'))
    }
    request.onerror = () => reject(request.error ?? new Error('Failed to load audio chunk.'))
  })
  database.close()
  await updateAudioRecording(audioStreamId, (record) => ({
    ...record,
    uploadedChunkCount: Math.min(record.chunkCount, record.uploadedChunkCount + 1),
  }))
}

export async function loadPendingAudioChunks(limit: number): Promise<AudioChunkRecord[]> {
  const database = await openDatabase()
  const records = await runTransaction<AudioChunkRecord[]>(database, chunksStoreName, 'readonly', (store, resolve, reject) => {
    const index = store.index('uploaded')
    const request = index.openCursor()
    const results: AudioChunkRecord[] = []
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor || results.length >= limit) {
        resolve(results)
        return
      }
      const value = cursor.value as AudioChunkRecord
      if (!value.uploaded) {
        results.push(value)
      }
      cursor.continue()
    }
    request.onerror = () => reject(request.error ?? new Error('Failed to load pending audio chunks.'))
  })
  database.close()
  return records
}

export async function loadRecordingsNeedingFinalize(): Promise<AudioRecordingRecord[]> {
  const database = await openDatabase()
  const records = await runTransaction<AudioRecordingRecord[]>(database, recordingsStoreName, 'readonly', (store, resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const items = (request.result as AudioRecordingRecord[]) ?? []
      resolve(items.filter((record) => record.chunkCount > 0 && record.uploadedChunkCount >= record.chunkCount && !record.uploadCompleted))
    }
    request.onerror = () => reject(request.error ?? new Error('Failed to load audio recordings.'))
  })
  database.close()
  return records
}

export async function markRecordingUploadCompleted(audioStreamId: string): Promise<void> {
  await updateAudioRecording(audioStreamId, (record) => ({ ...record, uploadCompleted: true }))
}

export async function hasPendingAudioUploads(): Promise<boolean> {
  const pending = await loadPendingAudioChunks(1)
  return pending.length > 0
}

export async function loadLocalAudioStreamManifest(audioStreamId: string): Promise<{
  audioStreamId: string
  mimeType: string
  totalDurationMilliseconds: number
  chunkCount: number
  chunks: { index: number; startMilliseconds: number; durationMilliseconds: number }[]
} | null> {
  const recording = await loadAudioRecording(audioStreamId)
  if (!recording) return null
  const chunks = await loadAudioChunksByStreamId(audioStreamId)
  if (!chunks.length) return null
  const chunkEntries = chunks
    .map((chunk) => ({
      index: chunk.chunkIndex,
      startMilliseconds: chunk.startMilliseconds,
      durationMilliseconds: chunk.durationMilliseconds,
    }))
    .sort((left, right) => left.index - right.index)
  return {
    audioStreamId,
    mimeType: recording.mimeType,
    totalDurationMilliseconds: recording.totalDurationMilliseconds,
    chunkCount: recording.chunkCount,
    chunks: chunkEntries,
  }
}
