import type { Snippet } from '../../types/snippet'
import { classifySnippetType } from '../snippets/classifySnippetType'

export function selectReportInputs(snippets: Snippet[], selectedSessionIds: string[]) {
  const selected = new Set(selectedSessionIds)
  return snippets.filter((snippet) => {
    const sessionId = (snippet as any).sessionId ?? (snippet as any).itemId
    const field = (snippet as any).field ?? (snippet as any).type
    return snippet.status === 'approved' && selected.has(String(sessionId || '')) && classifySnippetType(String(field || '')) === 'report'
  })
}
