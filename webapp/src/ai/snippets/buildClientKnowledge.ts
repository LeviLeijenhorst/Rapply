import type { Snippet } from '../../types/snippet'
import { classifySnippetType } from './classifySnippetType'

export function buildClientKnowledge(snippets: Snippet[]): string {
  const approved = snippets.filter((snippet) => snippet.status === 'approved')
  const bySession = new Map<string, string[]>()

  for (const snippet of approved) {
    const sessionId = String((snippet as any).sessionId ?? (snippet as any).itemId ?? 'unknown-session')
    const field = String((snippet as any).field ?? (snippet as any).type ?? '')
    const label = classifySnippetType(field)
    const text = String(snippet.text || '').trim()
    if (!text) continue
    const lines = bySession.get(sessionId) ?? []
    lines.push(`- [${label}] ${text}`)
    bySession.set(sessionId, lines)
  }

  return [...bySession.entries()]
    .map(([sessionId, lines]) => `Session ${sessionId}:\n${lines.join('\n')}`)
    .join('\n\n')
}
