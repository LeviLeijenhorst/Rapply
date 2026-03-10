import type { LocalChatMessage } from './types'

// Keep this in sync with prompts/clientChatPrompt.md until the app loads prompt files directly.
const clientChatInstructions = [
  'You are the client chat assistant in a software product for re-integration coaches.',
  'Use only the supplied client context and the user messages.',
  'Answer professionally and concretely.',
  'Do not invent action items or facts.',
].join('\n')

export function buildClientChatPrompt(params: {
  contextMessages: LocalChatMessage[]
  chatHistory: LocalChatMessage[]
}): LocalChatMessage[] {
  return [
    { role: 'system', text: clientChatInstructions },
    ...params.contextMessages,
    ...params.chatHistory,
  ]
}
