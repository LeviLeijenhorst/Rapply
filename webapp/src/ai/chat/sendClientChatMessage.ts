import { sendClientChatMessage as sendClientChatMessageTransport } from '../../api/chat/sendClientChatMessage'
import type { ChatMessage } from './chatTypes'
import type { LocalChatMessage } from '../../api/chat/types'
import { buildClientChatPrompt } from './buildClientChatPrompt'

export async function sendClientChatMessage(messages: ChatMessage[], contextMessages: LocalChatMessage[] = []): Promise<string> {
  return sendClientChatMessageTransport({
    messages: buildClientChatPrompt({
      contextMessages,
      chatHistory: messages,
    }),
  })
}
