import type { Snippet } from '../../types/snippet'

export function buildClientKnowledge(snippets: Snippet[]): string {
  return snippets
    .filter((snippet) => snippet.status === 'approved')
    .map((snippet) => `- ${snippet.text}`)
    .join('\n')
}
