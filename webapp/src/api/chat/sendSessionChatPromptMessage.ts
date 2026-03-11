import { sendInputChatMessage as sendInputChatMessageTransport } from './sendInputChatMessage'
import type { ChatMessage, LocalChatMessage } from './types'
import { buildInputChatPrompt } from './buildInputChatPrompt'

export async function sendInputChatMessage(messages: ChatMessage[], sessionId: string, contextMessages: LocalChatMessage[] = []): Promise<string> {
  return sendInputChatMessageTransport({
    sessionId,
    messages: buildInputChatPrompt({
      contextMessages,
      chatHistory: messages,
    }),
  })
}

