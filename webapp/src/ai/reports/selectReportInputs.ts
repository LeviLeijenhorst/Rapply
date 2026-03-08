import type { Snippet } from '../../types/snippet'

export function selectReportInputs(snippets: Snippet[], selectedSessionIds: string[]) {
  const selected = new Set(selectedSessionIds)
  return snippets.filter((snippet) => snippet.status === 'approved' && selected.has(snippet.sessionId))
}
