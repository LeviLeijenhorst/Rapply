import { callSecureApi } from './secureApi'

export type LocalChatMessage = {
  role: 'system' | 'user' | 'assistant'
  text: string
}

type ChatResponse = {
  text?: string
}

export async function completeChat(params: {
  messages: LocalChatMessage[]
  temperature?: number
  scope?: 'session' | 'coachee'
  sessionId?: string
}): Promise<string> {
  const payload = {
    messages: params.messages.map((message) => ({ role: message.role, content: message.text })),
    temperature: params.temperature,
    scope: params.scope,
    sessionId: params.sessionId,
  }
  const response = await callSecureApi<ChatResponse>('/chat', payload)
  const text = String(response.text || '')
  if (!text.trim()) {
    throw new Error('No chat response returned')
  }
  return text
}
