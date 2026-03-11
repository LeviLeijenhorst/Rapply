export type LocalChatMessage = {
  role: 'system' | 'user' | 'assistant'
  text: string
}

export type ChatMessage = LocalChatMessage
