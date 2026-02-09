import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import { ChatStateMessage } from '../utils/chatState'

type QuickQuestionsChatStore = {
  sessions: Record<string, ChatStateMessage[]>
  coachees: Record<string, ChatStateMessage[]>
}

const storageKey = 'coachscribe.quickQuestionsChats.v1'

function createEmptyStore(): QuickQuestionsChatStore {
  return { sessions: {}, coachees: {} }
}

function normalizeStore(value: unknown): QuickQuestionsChatStore {
  if (!value || typeof value !== 'object') return createEmptyStore()
  const candidate = value as QuickQuestionsChatStore
  const sessions = candidate.sessions && typeof candidate.sessions === 'object' ? candidate.sessions : {}
  const coachees = candidate.coachees && typeof candidate.coachees === 'object' ? candidate.coachees : {}
  return { sessions, coachees }
}

function loadStore(): QuickQuestionsChatStore {
  const stored = readJsonFromLocalStorage<QuickQuestionsChatStore>(storageKey)
  if (!stored.ok) return createEmptyStore()
  return normalizeStore(stored.value)
}

function saveStore(store: QuickQuestionsChatStore) {
  writeJsonToLocalStorage(storageKey, store)
}

export function loadQuickQuestionsChatForSession(sessionId: string): ChatStateMessage[] {
  if (!sessionId) return []
  const store = loadStore()
  return store.sessions[sessionId] ?? []
}

export function saveQuickQuestionsChatForSession(sessionId: string, messages: ChatStateMessage[]) {
  if (!sessionId) return
  const store = loadStore()
  const nextStore: QuickQuestionsChatStore = {
    ...store,
    sessions: {
      ...store.sessions,
      [sessionId]: messages,
    },
  }
  saveStore(nextStore)
}

export function clearQuickQuestionsChatForSession(sessionId: string) {
  if (!sessionId) return
  const store = loadStore()
  const { [sessionId]: removed, ...rest } = store.sessions
  const nextStore: QuickQuestionsChatStore = {
    ...store,
    sessions: rest,
  }
  saveStore(nextStore)
}

export function loadQuickQuestionsChatForCoachee(coacheeId: string): ChatStateMessage[] {
  if (!coacheeId) return []
  const store = loadStore()
  return store.coachees[coacheeId] ?? []
}

export function saveQuickQuestionsChatForCoachee(coacheeId: string, messages: ChatStateMessage[]) {
  if (!coacheeId) return
  const store = loadStore()
  const nextStore: QuickQuestionsChatStore = {
    ...store,
    coachees: {
      ...store.coachees,
      [coacheeId]: messages,
    },
  }
  saveStore(nextStore)
}

export function clearQuickQuestionsChatForCoachee(coacheeId: string) {
  if (!coacheeId) return
  const store = loadStore()
  const { [coacheeId]: removed, ...rest } = store.coachees
  const nextStore: QuickQuestionsChatStore = {
    ...store,
    coachees: rest,
  }
  saveStore(nextStore)
}
