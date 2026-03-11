import { trackWebappEvent } from '../analytics/webappAnalytics'
import { callSecureApi } from '../secureApi'
import type { LocalChatMessage } from './types'

type ChatResponse = {
  text?: string
}

export async function sendInputChatMessage(params: {
  messages: LocalChatMessage[]
  sessionId: string
  temperature?: number
}): Promise<string> {
  trackWebappEvent(
    {
      type: 'ai_message_sent',
      action: 'chat_request',
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      metadata: {
        scope: 'session',
        sessionId: params.sessionId,
        messageCount: params.messages.length,
        totalCharacters: params.messages.reduce((count, message) => count + String(message.text || '').length, 0),
      },
    },
    { authenticated: true },
  )

  const response = await callSecureApi<ChatResponse>('/chat', {
    messages: params.messages.map((message) => ({ role: message.role, content: message.text })),
    temperature: params.temperature,
    scope: 'session',
    sessionId: params.sessionId,
  })

  const text = String(response?.text || '').trim()
  if (!text) {
    throw new Error('No chat response returned')
  }

  return text
}

