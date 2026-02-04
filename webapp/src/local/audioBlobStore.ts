type AudioBlobRecord = {
  id: string
  blob: Blob
  mimeType: string
  createdAtUnixMs: number
}

const databaseName = 'coachscribe-webapp'
const databaseVersion = 1
const audioBlobStoreName = 'audioBlobs'

function createRandomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `audio-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(audioBlobStoreName)) {
        database.createObjectStore(audioBlobStoreName, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB database.'))
  })
}

function runTransaction<Result>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, resolve: (value: Result) => void, reject: (error: unknown) => void) => void
): Promise<Result> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(audioBlobStoreName, mode)
    const store = transaction.objectStore(audioBlobStoreName)
    run(store, resolve, reject)
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
  })
}

export async function saveAudioBlob(values: { blob: Blob; mimeType: string }): Promise<string> {
  const database = await openDatabase()
  const record: AudioBlobRecord = { id: createRandomId(), blob: values.blob, mimeType: values.mimeType, createdAtUnixMs: Date.now() }

  await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to save audio blob.'))
  })

  database.close()
  return record.id
}

export async function loadAudioBlob(id: string): Promise<{ blob: Blob; mimeType: string } | null> {
  const database = await openDatabase()

  const record = await runTransaction<AudioBlobRecord | undefined>(database, 'readonly', (store, resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as AudioBlobRecord | undefined)
    request.onerror = () => reject(request.error ?? new Error('Failed to load audio blob.'))
  })

  database.close()

  if (!record) return null
  return { blob: record.blob, mimeType: record.mimeType }
}

export async function deleteAudioBlob(id: string): Promise<void> {
  const database = await openDatabase()

  await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to delete audio blob.'))
  })

  database.close()
}

