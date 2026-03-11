import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import { ChatStateMessage } from '../types/chatState'

type ChatBotStoreData = {
  inputs: Record<string, ChatStateMessage[]>
  clients: Record<string, ChatStateMessage[]>
}

const storageKey = 'coachscribe.chatBotChats.v1'

function createEmptyStore(): ChatBotStoreData {
  return { inputs: {}, clients: {} }
}

function normalizeStore(value: unknown): ChatBotStoreData {
  if (!value || typeof value !== 'object') return createEmptyStore()
  const candidate = value as ChatBotStoreData
  const inputs = candidate.inputs && typeof candidate.inputs === 'object' ? candidate.inputs : {}
  const clients =
    candidate.clients && typeof candidate.clients === 'object'
      ? candidate.clients
      : (candidate as any).clients && typeof (candidate as any).clients === 'object'
        ? (candidate as any).clients
        : {}
  return { inputs, clients }
}

function loadStore(): ChatBotStoreData {
  const stored = readJsonFromLocalStorage<ChatBotStoreData>(storageKey)
  if (stored.ok) return normalizeStore(stored.value)
  return createEmptyStore()
}

function saveStore(store: ChatBotStoreData) {
  writeJsonToLocalStorage(storageKey, store)
}

export function loadChatBotForInput(sessionId: string): ChatStateMessage[] {
  if (!sessionId) return []
  const store = loadStore()
  return store.inputs[sessionId] ?? []
}

export function saveChatBotForInput(sessionId: string, messages: ChatStateMessage[]) {
  if (!sessionId) return
  const store = loadStore()
  const nextStore: ChatBotStoreData = {
    ...store,
    inputs: {
      ...store.inputs,
      [sessionId]: messages,
    },
  }
  saveStore(nextStore)
}

export function clearChatBotForInput(sessionId: string) {
  if (!sessionId) return
  const store = loadStore()
  const { [sessionId]: removed, ...rest } = store.inputs
  const nextStore: ChatBotStoreData = {
    ...store,
    inputs: rest,
  }
  saveStore(nextStore)
}

export function loadChatBotForClient(clientId: string): ChatStateMessage[] {
  if (!clientId) return []
  const store = loadStore()
  return store.clients[clientId] ?? []
}

export function saveChatBotForClient(clientId: string, messages: ChatStateMessage[]) {
  if (!clientId) return
  const store = loadStore()
  const nextStore: ChatBotStoreData = {
    ...store,
    clients: {
      ...store.clients,
      [clientId]: messages,
    },
  }
  saveStore(nextStore)
}

export function clearChatBotForClient(clientId: string) {
  if (!clientId) return
  const store = loadStore()
  const { [clientId]: removed, ...rest } = store.clients
  const nextStore: ChatBotStoreData = {
    ...store,
    clients: rest,
  }
  saveStore(nextStore)
}

