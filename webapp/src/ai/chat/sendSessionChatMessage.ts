import { completeChat } from '../../api/chat/chatApi'
import type { ChatMessage } from './chatTypes'

export async function sendSessionChatMessage(messages: ChatMessage[], sessionId: string): Promise<string> {
  return completeChat({ messages, scope: 'session', sessionId })
}
