import { completeChat } from '../../api/chat/chatApi'
import type { ChatMessage } from './chatTypes'

export async function sendClientChatMessage(messages: ChatMessage[]): Promise<string> {
  return completeChat({ messages, scope: 'coachee' })
}
