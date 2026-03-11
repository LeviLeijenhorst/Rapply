import type { LocalChatMessage } from './types'

// Keep this in sync with prompts/sessionChatPrompt.md until the app loads prompt files directly.
const sessionChatInstructions = [
  'You are the session chat assistant in a software product for re-integration coaches.',
  'Use only the supplied session context and the user messages.',
  'Answer professionally and concretely.',
  'Do not invent action items or facts.',
].join('\n')

export function buildInputChatPrompt(params: {
  contextMessages: LocalChatMessage[]
  chatHistory: LocalChatMessage[]
}): LocalChatMessage[] {
  return [
    { role: 'system', text: sessionChatInstructions },
    ...params.contextMessages,
    ...params.chatHistory,
  ]
}

