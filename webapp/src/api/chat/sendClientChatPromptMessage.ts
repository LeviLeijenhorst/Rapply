import { sendClientChatMessage as sendClientChatMessageTransport } from './sendClientChatMessage'
import type { ChatMessage, LocalChatMessage } from './types'
import { buildClientChatPrompt } from './buildClientChatPrompt'

export async function sendClientChatMessage(messages: ChatMessage[], contextMessages: LocalChatMessage[] = []): Promise<string> {
  return sendClientChatMessageTransport({
    messages: buildClientChatPrompt({
      contextMessages,
      chatHistory: messages,
    }),
  })
}
