import type { LocalChatMessage } from './types'

// Keep this in sync with prompts/sessionChatPrompt.md until the app loads prompt files directly.
const sessionChatInstructions = [
  'You are the Coachscribe session chat assistant.',
  'Use only the supplied session context and the user messages.',
  'Answer professionally and concretely.',
  'Do not invent action items or facts.',
].join('\n')

export function buildSessionChatPrompt(params: {
  contextMessages: LocalChatMessage[]
  chatHistory: LocalChatMessage[]
}): LocalChatMessage[] {
  return [
    { role: 'system', text: sessionChatInstructions },
    ...params.contextMessages,
    ...params.chatHistory,
  ]
}
