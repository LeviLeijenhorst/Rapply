type PendingPreviewRecord = {
  sessionId: string
  blob: Blob
  mimeType: string
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
  createdAtMs: number
  updatedAtMs: number
}

export type PendingPreviewTask = {
  sessionId: string
  blob: Blob
  mimeType: string
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
}

const databaseName = 'coachscribe-pending-audio'
const databaseVersion = 1
const storeName = 'pendingPreviews'
const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'sessionId' })
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

function isExpired(record: PendingPreviewRecord, nowMs: number): boolean {
  return nowMs - record.updatedAtMs > PREVIEW_TTL_MS
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

export async function setPendingPreviewAudio(task: PendingPreviewTask): Promise<void> {
  if (!task.sessionId) return
  const nowMs = Date.now()
  await writeRecord({
    sessionId: task.sessionId,
    blob: task.blob,
    mimeType: task.mimeType || 'application/octet-stream',
    summaryTemplate: task.summaryTemplate,
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  })
}

export async function getPendingPreviewAudio(sessionId: string): Promise<Blob | null> {
  if (!sessionId) return null
  const record = await readRecord(sessionId)
  if (!record) return null
  if (isExpired(record, Date.now())) {
    await clearPendingPreviewAudio(sessionId)
    return null
  }
  return record.blob
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
    const expiredSessionIds = records.filter((record) => isExpired(record, nowMs)).map((record) => record.sessionId)
    if (expiredSessionIds.length > 0) {
      await Promise.all(expiredSessionIds.map((sessionId) => clearPendingPreviewAudio(sessionId)))
    }

    return records
      .filter((record) => !isExpired(record, nowMs))
      .map((record) => ({
        sessionId: record.sessionId,
        blob: record.blob,
        mimeType: record.mimeType,
        summaryTemplate: record.summaryTemplate,
      }))
  } finally {
    database.close()
  }
}

export async function clearPendingPreviewAudio(sessionId: string): Promise<void> {
  if (!sessionId) return
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
