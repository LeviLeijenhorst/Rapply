// Keep this in sync with prompts/sessionSnippetPrompt.md until the app loads prompt files directly.
const snippetInstructions = [
  'Extract reusable coaching snippets from the session transcript.',
  'Prefer factual observations, constraints, progress, goals, and agreements.',
  'Keep snippet wording close to the original wording when possible.',
  'Do not invent details that are not supported by the transcript.',
].join('\n')

export function buildInputSnippetPrompt(params: {
  transcript: string
  sessionId: string
  clientId: string
  sessionDate: number
}): string {
  return [
    '[SESSION_SNIPPET_PROMPT]',
    snippetInstructions,
    `Input ID: ${params.sessionId}`,
    `Client ID: ${params.clientId}`,
    `Input date: ${params.sessionDate}`,
    '',
    'Transcript:',
    String(params.transcript || '').trim(),
    '[/SESSION_SNIPPET_PROMPT]',
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}

