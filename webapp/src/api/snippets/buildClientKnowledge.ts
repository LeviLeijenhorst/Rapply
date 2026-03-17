import type { Snippet } from '../../types/snippet'
import { classifySnippetType } from './classifySnippetType'

export function buildClientKnowledge(snippets: Snippet[]): string {
  const approved = snippets.filter((snippet) => snippet.status === 'approved')
  const byInput = new Map<string, string[]>()

  for (const snippet of approved) {
    const sessionId = String((snippet as any).sessionId ?? (snippet as any).itemId ?? 'unknown-session')
    const fields = [
      ...((Array.isArray((snippet as any).fields) ? (snippet as any).fields : []) as string[]),
      String((snippet as any).field ?? (snippet as any).type ?? ''),
    ]
      .map((value) => String(value || '').trim())
      .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
    const label = classifySnippetType(fields[0] || 'general')
    const text = String(snippet.text || '').trim()
    if (!text) continue
    const lines = byInput.get(sessionId) ?? []
    lines.push(`- [${label}] ${text}`)
    byInput.set(sessionId, lines)
  }

  return [...byInput.entries()]
    .map(([sessionId, lines]) => `Input ${sessionId}:\n${lines.join('\n')}`)
    .join('\n\n')
}

