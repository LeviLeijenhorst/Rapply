export type ChatStateMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function createChatMessageId() {
  return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
}

export function createInitialChatMessages(initialAssistantText: string): ChatStateMessage[] {
  return [
    {
      id: createChatMessageId(),
      role: 'assistant',
      text: initialAssistantText,
    },
  ]
}
