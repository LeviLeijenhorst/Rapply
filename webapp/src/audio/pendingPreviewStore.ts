export type PendingPreviewProcessingState = 'queued' | 'encrypting' | 'uploading' | 'uploaded' | 'failed'

type PendingPreviewRecord = {
  sessionId: string
  blob: Blob
  mimeType: string
  shouldSaveAudio: boolean
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
  processingState: PendingPreviewProcessingState
  audioBlobId: string | null
  lastError: string | null
  retryCount: number
  createdAtMs: number
  updatedAtMs: number
}

export type PendingPreviewTask = {
  sessionId: string
  blob: Blob
  mimeType: string
  shouldSaveAudio: boolean
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
  processingState: PendingPreviewProcessingState
  audioBlobId: string | null
}

const databaseName = 'coachscribe-pending-audio'
const databaseVersion = 2
const storeName = 'pendingPreviews'
const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000

const retainedPreviewCounts = new Map<string, number>()

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      let store: IDBObjectStore
      if (!database.objectStoreNames.contains(storeName)) {
        store = database.createObjectStore(storeName, { keyPath: 'sessionId' })
      } else {
        store = request.transaction!.objectStore(storeName)
      }

      const migrateRequest = store.getAll()
      migrateRequest.onsuccess = () => {
        const records = (migrateRequest.result as any[]) ?? []
        const nowMs = Date.now()
        for (const raw of records) {
          const record: PendingPreviewRecord = {
            sessionId: String(raw?.sessionId || ''),
            blob: raw?.blob,
            mimeType: String(raw?.mimeType || 'application/octet-stream'),
            shouldSaveAudio: raw?.shouldSaveAudio !== false,
            summaryTemplate: raw?.summaryTemplate,
            processingState: (raw?.processingState as PendingPreviewProcessingState) || 'queued',
            audioBlobId: typeof raw?.audioBlobId === 'string' && raw.audioBlobId.trim() ? raw.audioBlobId.trim() : null,
            lastError: typeof raw?.lastError === 'string' && raw.lastError.trim() ? raw.lastError.trim() : null,
            retryCount: Number.isFinite(raw?.retryCount) ? Number(raw.retryCount) : 0,
            createdAtMs: Number.isFinite(raw?.createdAtMs) ? Number(raw.createdAtMs) : nowMs,
            updatedAtMs: Number.isFinite(raw?.updatedAtMs) ? Number(raw.updatedAtMs) : nowMs,
          }
          if (!record.sessionId || !(record.blob instanceof Blob)) continue
          if (record.audioBlobId && record.processingState !== 'uploaded') {
            record.processingState = 'uploaded'
          }
          if (!record.shouldSaveAudio && record.processingState === 'uploaded') {
            record.processingState = 'queued'
          }
          store.put(record)
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB database.'))
  })
}

function runTransaction<Result>(
  database: IDBDatabase,
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

function isRetained(sessionId: string): boolean {
  return (retainedPreviewCounts.get(sessionId) ?? 0) > 0
}

function isExpired(record: PendingPreviewRecord, nowMs: number): boolean {
  return nowMs - record.updatedAtMs > PREVIEW_TTL_MS
}

function canDeleteExpired(record: PendingPreviewRecord, nowMs: number): boolean {
  if (isRetained(record.sessionId)) return false
  if (!isExpired(record, nowMs)) return false
  return true
}

function canDeleteCompleted(record: PendingPreviewRecord): boolean {
  if (isRetained(record.sessionId)) return false
  return Boolean(record.audioBlobId)
}

async function readRecord(sessionId: string): Promise<PendingPreviewRecord | null> {
  const database = await openDatabase()
  try {
    const record = await runTransaction<PendingPreviewRecord | undefined>(database, 'readonly', (store, resolve, reject) => {
      const request = store.get(sessionId)
      request.onsuccess = () => resolve(request.result as PendingPreviewRecord | undefined)
      request.onerror = () => reject(request.error ?? new Error('Failed to read pending preview record.'))
    })
    return record ?? null
  } finally {
    database.close()
  }
}

async function writeRecord(record: PendingPreviewRecord): Promise<void> {
  const database = await openDatabase()
  try {
    await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to write pending preview record.'))
    })
  } finally {
    database.close()
  }
}

async function deleteRecord(sessionId: string): Promise<void> {
  const database = await openDatabase()
  try {
    await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
      const request = store.delete(sessionId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to clear pending preview record.'))
    })
  } finally {
    database.close()
  }
}

async function mutateRecord(sessionId: string, mutate: (record: PendingPreviewRecord) => PendingPreviewRecord | null): Promise<PendingPreviewRecord | null> {
  const record = await readRecord(sessionId)
  if (!record) return null
  const next = mutate(record)
  if (!next) {
    await deleteRecord(sessionId)
    return null
  }
  await writeRecord(next)
  return next
}

export function retainPendingPreviewAudio(sessionId: string): () => void {
  if (!sessionId) return () => undefined
  retainedPreviewCounts.set(sessionId, (retainedPreviewCounts.get(sessionId) ?? 0) + 1)
  return () => {
    const current = retainedPreviewCounts.get(sessionId) ?? 0
    if (current <= 1) {
      retainedPreviewCounts.delete(sessionId)
      void clearPendingPreviewAudioIfEligible(sessionId)
      return
    }
    retainedPreviewCounts.set(sessionId, current - 1)
  }
}

export function isPendingPreviewAudioRetained(sessionId: string): boolean {
  return isRetained(sessionId)
}

export async function setPendingPreviewAudio(task: {
  sessionId: string
  blob: Blob
  mimeType: string
  shouldSaveAudio: boolean
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
}): Promise<void> {
  if (!task.sessionId) return
  const nowMs = Date.now()
  await writeRecord({
    sessionId: task.sessionId,
    blob: task.blob,
    mimeType: task.mimeType || 'application/octet-stream',
    shouldSaveAudio: task.shouldSaveAudio,
    summaryTemplate: task.summaryTemplate,
    processingState: 'queued',
    audioBlobId: null,
    lastError: null,
    retryCount: 0,
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  })
}

export async function getPendingPreviewAudio(sessionId: string): Promise<Blob | null> {
  if (!sessionId) return null
  const record = await readRecord(sessionId)
  if (!record) return null
  const nowMs = Date.now()
  if (canDeleteCompleted(record)) {
    await deleteRecord(sessionId)
    return null
  }
  if (canDeleteExpired(record, nowMs)) {
    await deleteRecord(sessionId)
    return null
  }
  if (!isRetained(sessionId)) {
    await writeRecord({
      ...record,
      updatedAtMs: nowMs,
    })
  }
  return record.blob
}

export async function setPendingPreviewProcessingState(params: {
  sessionId: string
  processingState: PendingPreviewProcessingState
  errorMessage?: string | null
}): Promise<void> {
  const { sessionId, processingState, errorMessage } = params
  if (!sessionId) return
  const nowMs = Date.now()
  await mutateRecord(sessionId, (record) => ({
    ...record,
    processingState,
    lastError: errorMessage === undefined ? record.lastError : errorMessage,
    retryCount: processingState === 'failed' ? record.retryCount + 1 : record.retryCount,
    updatedAtMs: nowMs,
  }))
}

export async function markPendingPreviewAudioUploaded(params: { sessionId: string; audioBlobId: string }): Promise<void> {
  const { sessionId, audioBlobId } = params
  if (!sessionId) return
  const normalizedAudioBlobId = String(audioBlobId || '').trim()
  if (!normalizedAudioBlobId) return
  await mutateRecord(sessionId, (record) => ({
    ...record,
    audioBlobId: normalizedAudioBlobId,
    processingState: 'uploaded',
    lastError: null,
    updatedAtMs: Date.now(),
  }))
}

export async function listPendingPreviewAudioTasks(): Promise<PendingPreviewTask[]> {
  const database = await openDatabase()
  try {
    const records = await runTransaction<PendingPreviewRecord[]>(database, 'readonly', (store, resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve((request.result as PendingPreviewRecord[]) ?? [])
      request.onerror = () => reject(request.error ?? new Error('Failed to list pending preview records.'))
    })

    const nowMs = Date.now()
    const deleteSessionIds: string[] = []
    for (const record of records) {
      if (canDeleteExpired(record, nowMs) || canDeleteCompleted(record)) {
        deleteSessionIds.push(record.sessionId)
      }
    }
    if (deleteSessionIds.length > 0) {
      await Promise.all(deleteSessionIds.map((sessionId) => deleteRecord(sessionId)))
    }

    return records
      .filter((record) => !deleteSessionIds.includes(record.sessionId))
      .filter((record) => !record.audioBlobId)
      .filter((record) => record.processingState !== 'uploaded')
      .map((record) => ({
        sessionId: record.sessionId,
        blob: record.blob,
        mimeType: record.mimeType,
        shouldSaveAudio: record.shouldSaveAudio !== false,
        summaryTemplate: record.summaryTemplate,
        processingState: record.processingState,
        audioBlobId: record.audioBlobId,
      }))
  } finally {
    database.close()
  }
}

export async function clearPendingPreviewAudioIfEligible(sessionId: string): Promise<boolean> {
  if (!sessionId) return false
  const record = await readRecord(sessionId)
  if (!record) return false
  if (!canDeleteCompleted(record)) return false
  await deleteRecord(sessionId)
  return true
}

export async function clearPendingPreviewAudio(sessionId: string): Promise<void> {
  if (!sessionId) return
  await deleteRecord(sessionId)
}
