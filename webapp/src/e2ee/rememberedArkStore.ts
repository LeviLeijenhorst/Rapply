import { fromBase64Url, toBase64Url } from './base64'

type RememberedArkRecord = {
  id: 'remembered_ark'
  keyVersion: number
  arkBase64Url: string
  updatedAtUnixMs: number
}

const databaseName = 'coachscribe-webapp'
const databaseVersion = 3
const storeName = 'e2eeRememberedArk'

// Opens the IndexedDB database and ensures the remembered ARK store exists.
function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB database.'))
  })
}

// Runs a transaction helper against the remembered ARK object store.
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

// Loads a remembered ARK from local IndexedDB storage.
export async function loadRememberedArk(): Promise<{ keyVersion: number; arkBytes: Uint8Array } | null> {
  const database = await openDatabase()
  const record = await runTransaction<RememberedArkRecord | undefined>(database, 'readonly', (store, resolve, reject) => {
    const request = store.get('remembered_ark')
    request.onsuccess = () => resolve(request.result as RememberedArkRecord | undefined)
    request.onerror = () => reject(request.error ?? new Error('Failed to load remembered ARK.'))
  })
  database.close()

  if (!record?.arkBase64Url || !Number.isFinite(record.keyVersion)) return null
  return {
    keyVersion: record.keyVersion,
    arkBytes: fromBase64Url(record.arkBase64Url),
  }
}

// Persists the remembered ARK and key version in local IndexedDB storage.
export async function saveRememberedArk(values: { keyVersion: number; arkBytes: Uint8Array }): Promise<void> {
  const database = await openDatabase()
  const record: RememberedArkRecord = {
    id: 'remembered_ark',
    keyVersion: values.keyVersion,
    arkBase64Url: toBase64Url(values.arkBytes),
    updatedAtUnixMs: Date.now(),
  }

  await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to save remembered ARK.'))
  })
  database.close()
}

// Removes any remembered ARK from local IndexedDB storage.
export async function clearRememberedArk(): Promise<void> {
  const database = await openDatabase()
  await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
    const request = store.delete('remembered_ark')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to clear remembered ARK.'))
  })
  database.close()
}
