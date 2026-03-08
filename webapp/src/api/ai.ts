import { completeChat, type LocalChatMessage } from '../api/chat'

export type ApiChatMessage = LocalChatMessage

export async function sendAiChat(messages: ApiChatMessage[], scope?: 'session', sessionId?: string) {
  return completeChat({ messages, scope, sessionId })
}
