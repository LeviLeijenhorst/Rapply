import { sendSessionChatMessage as sendSessionChatMessageTransport } from '../../api/chat/sendSessionChatMessage'
import type { ChatMessage } from './chatTypes'
import type { LocalChatMessage } from '../../api/chat/types'
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
