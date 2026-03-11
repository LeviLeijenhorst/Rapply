import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import { ChatStateMessage } from '../types/chatState'

type QuickQuestionsChatStore = {
  sessions: Record<string, ChatStateMessage[]>
  clients: Record<string, ChatStateMessage[]>
}

const storageKey = 'coachscribe.quickQuestionsChats.v1'

function createEmptyStore(): QuickQuestionsChatStore {
  return { sessions: {}, clients: {} }
}

function normalizeStore(value: unknown): QuickQuestionsChatStore {
  if (!value || typeof value !== 'object') return createEmptyStore()
  const candidate = value as QuickQuestionsChatStore
  const sessions = candidate.sessions && typeof candidate.sessions === 'object' ? candidate.sessions : {}
  const clients =
    candidate.clients && typeof candidate.clients === 'object'
      ? candidate.clients
      : (candidate as any).coachees && typeof (candidate as any).coachees === 'object'
        ? (candidate as any).coachees
        : {}
  return { sessions, clients }
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

export function loadAssistantChatForClient(clientId: string): ChatStateMessage[] {
  if (!clientId) return []
  const store = loadStore()
  return store.clients[clientId] ?? []
}

export function saveAssistantChatForClient(clientId: string, messages: ChatStateMessage[]) {
  if (!clientId) return
  const store = loadStore()
  const nextStore: QuickQuestionsChatStore = {
    ...store,
    clients: {
      ...store.clients,
      [clientId]: messages,
    },
  }
  saveStore(nextStore)
}

export function clearAssistantChatForClient(clientId: string) {
  if (!clientId) return
  const store = loadStore()
  const { [clientId]: removed, ...rest } = store.clients
  const nextStore: QuickQuestionsChatStore = {
    ...store,
    clients: rest,
  }
  saveStore(nextStore)
}

// Backward-compatible aliases while other screens are migrated.
export const loadQuickQuestionsChatForCoachee = loadAssistantChatForClient
export const saveQuickQuestionsChatForCoachee = saveAssistantChatForClient
export const clearQuickQuestionsChatForCoachee = clearAssistantChatForClient
