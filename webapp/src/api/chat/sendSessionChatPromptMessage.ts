import { sendSessionChatMessage as sendSessionChatMessageTransport } from './sendSessionChatMessage'
import type { ChatMessage } from './chatTypes'
import type { LocalChatMessage } from './types'
import { buildSessionChatPrompt } from './buildSessionChatPrompt'

export async function sendSessionChatMessage(messages: ChatMessage[], sessionId: string, contextMessages: LocalChatMessage[] = []): Promise<string> {
  return sendSessionChatMessageTransport({
    sessionId,
    messages: buildSessionChatPrompt({
      contextMessages,
      chatHistory: messages,
    }),
  })
}
