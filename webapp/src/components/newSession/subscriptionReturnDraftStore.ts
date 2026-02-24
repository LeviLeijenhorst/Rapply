import { readJsonFromLocalStorage, writeJsonToLocalStorage } from '../../local/localStorageJson'

type DraftOptionKey = 'gesprek' | 'verslag' | 'upload'

type StoredSubscriptionReturnDraft = {
  id: string
  selectedOption: DraftOptionKey
  selectedCoacheeId: string | null
  selectedTemplateId: string | null
  sessionTitle: string
  shouldSaveAudio: boolean
  audioDurationSeconds: number | null
  mimeType: string
  blob: Blob
  createdAtMs: number
}

export type SubscriptionReturnDraft = Omit<StoredSubscriptionReturnDraft, 'id'>

const databaseName = 'coachscribe-new-session-drafts'
const databaseVersion = 1
const storeName = 'drafts'
const subscriptionReturnDraftId = 'subscription-return'
const resumeRequestStorageKey = 'coachscribe.newSession.subscriptionReturnResumeRequest'
const draftMetaStorageKey = 'coachscribe.newSession.subscriptionReturnDraftMeta'
const draftTtlMs = 24 * 60 * 60 * 1000

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
    request.onerror = () => reject(request.error ?? new Error('Failed to open new-session draft database.'))
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

async function writeDraft(record: StoredSubscriptionReturnDraft): Promise<void> {
  const database = await openDatabase()
  try {
    await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to write subscription return draft.'))
    })
  } finally {
    database.close()
  }
}

async function readDraft(): Promise<StoredSubscriptionReturnDraft | null> {
  const database = await openDatabase()
  try {
    const record = await runTransaction<StoredSubscriptionReturnDraft | undefined>(database, 'readonly', (store, resolve, reject) => {
      const request = store.get(subscriptionReturnDraftId)
      request.onsuccess = () => resolve(request.result as StoredSubscriptionReturnDraft | undefined)
      request.onerror = () => reject(request.error ?? new Error('Failed to read subscription return draft.'))
    })
    return record ?? null
  } finally {
    database.close()
  }
}

async function deleteDraft(): Promise<void> {
  const database = await openDatabase()
  try {
    await runTransaction<void>(database, 'readwrite', (store, resolve, reject) => {
      const request = store.delete(subscriptionReturnDraftId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to delete subscription return draft.'))
    })
  } finally {
    database.close()
  }
}

function markResumeRequest() {
  writeJsonToLocalStorage(resumeRequestStorageKey, { requestedAtMs: Date.now() })
}

function clearResumeRequest() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(resumeRequestStorageKey)
  } catch {}
}

function writeDraftMeta(createdAtMs: number) {
  writeJsonToLocalStorage(draftMetaStorageKey, { createdAtMs })
}

function readDraftMetaCreatedAtMs(): number | null {
  const parsed = readJsonFromLocalStorage<{ createdAtMs?: number }>(draftMetaStorageKey)
  if (!parsed.ok) return null
  const createdAtMs = Number(parsed.value?.createdAtMs ?? 0)
  if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) return null
  return createdAtMs
}

function clearDraftMeta() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(draftMetaStorageKey)
  } catch {}
}

export function consumeSubscriptionReturnResumeRequest(): boolean {
  const parsed = readJsonFromLocalStorage<{ requestedAtMs?: number }>(resumeRequestStorageKey)
  if (!parsed.ok) return false
  clearResumeRequest()
  const requestedAtMs = Number(parsed.value?.requestedAtMs ?? 0)
  if (!Number.isFinite(requestedAtMs) || requestedAtMs <= 0) return false
  if (Date.now() - requestedAtMs > draftTtlMs) return false
  return true
}

export function requestSubscriptionReturnResumeIfDraftAvailable(): boolean {
  const createdAtMs = readDraftMetaCreatedAtMs()
  if (!createdAtMs) return false
  if (Date.now() - createdAtMs > draftTtlMs) return false
  markResumeRequest()
  return true
}

export async function saveSubscriptionReturnDraft(draft: Omit<SubscriptionReturnDraft, 'createdAtMs'>): Promise<void> {
  const createdAtMs = Date.now()
  await writeDraft({
    id: subscriptionReturnDraftId,
    createdAtMs,
    selectedOption: draft.selectedOption,
    selectedCoacheeId: draft.selectedCoacheeId ?? null,
    selectedTemplateId: draft.selectedTemplateId ?? null,
    sessionTitle: String(draft.sessionTitle || ''),
    shouldSaveAudio: draft.shouldSaveAudio !== false,
    audioDurationSeconds: Number.isFinite(Number(draft.audioDurationSeconds)) ? Math.max(0, Number(draft.audioDurationSeconds)) : null,
    mimeType: String(draft.mimeType || 'application/octet-stream'),
    blob: draft.blob,
  })
  writeDraftMeta(createdAtMs)
}

export async function readAndClearSubscriptionReturnDraft(): Promise<SubscriptionReturnDraft | null> {
  const record = await readDraft()
  await deleteDraft().catch(() => undefined)
  clearDraftMeta()
  clearResumeRequest()
  if (!record) return null
  if (!(record.blob instanceof Blob)) return null
  if (Date.now() - Number(record.createdAtMs || 0) > draftTtlMs) return null
  return {
    selectedOption: record.selectedOption,
    selectedCoacheeId: record.selectedCoacheeId,
    selectedTemplateId: record.selectedTemplateId,
    sessionTitle: record.sessionTitle,
    shouldSaveAudio: record.shouldSaveAudio !== false,
    audioDurationSeconds: Number.isFinite(Number(record.audioDurationSeconds)) ? Math.max(0, Number(record.audioDurationSeconds)) : null,
    mimeType: record.mimeType || 'application/octet-stream',
    blob: record.blob,
    createdAtMs: Number(record.createdAtMs || Date.now()),
  }
}

export async function clearSubscriptionReturnDraft(): Promise<void> {
  await deleteDraft().catch(() => undefined)
  clearDraftMeta()
  clearResumeRequest()
}
