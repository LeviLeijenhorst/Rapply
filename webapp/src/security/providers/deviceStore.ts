import { fromBase64Url, toBase64Url } from '../crypto/base64'

type DeviceRecord = {
  id: 'device'
  deviceId: string
  privateKeyPkcs8Base64Url: string
  publicKeyJwk: JsonWebKey
}

const databaseName = 'coachscribe-webapp'
const databaseVersion = 2
const storeName = 'e2eeDevice'

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

export async function loadDeviceRecord(): Promise<{ deviceId: string; privateKeyPkcs8: Uint8Array; publicKeyJwk: JsonWebKey } | null> {
  const database = await openDatabase()
  const record = await runTransaction<DeviceRecord | undefined>(database, 'readonly', (store, resolve, reject) => {
    const request = store.get('device')
    request.onsuccess = () => resolve(request.result as DeviceRecord | undefined)
    request.onerror = () => reject(request.error ?? new Error('Failed to load device record.'))
  })
  database.close()

  if (!record?.deviceId || !record.privateKeyPkcs8Base64Url || !record.publicKeyJwk) return null
  return {
    deviceId: record.deviceId,
    privateKeyPkcs8: fromBase64Url(record.privateKeyPkcs8Base64Url),
    publicKeyJwk: record.publicKeyJwk,
  }
}

export async function saveDeviceRecord(values: { deviceId: string; privateKeyPkcs8: Uint8Array; publicKeyJwk: JsonWebKey }): Promise<void> {
  const database = await openDatabase()
  const record: DeviceRecord = {
    id: 'device',
    deviceId: values.deviceId,
    privateKeyPkcs8Base64Url: toBase64Url(values.privateKeyPkcs8),
    publicKeyJwk: values.publicKeyJwk,
  }

  await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to save device record.'))
  })

  database.close()
}

