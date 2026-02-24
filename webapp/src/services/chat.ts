import { callSecureApi } from './secureApi'
import { trackWebappEvent } from './analytics'

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
  trackWebappEvent(
    {
      type: 'ai_message_sent',
      action: 'chat_request',
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      metadata: {
        scope: params.scope || null,
        sessionId: params.sessionId || null,
        messageCount: params.messages.length,
        totalCharacters: params.messages.reduce((count, message) => count + String(message.text || '').length, 0),
      },
    },
    { authenticated: true },
  )

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
