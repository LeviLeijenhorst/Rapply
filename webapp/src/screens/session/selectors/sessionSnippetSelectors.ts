import type { Snippet } from '../../../storage/types'

function normalizeSessionLikeId(id: string): string {
  const raw = String(id || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw.startsWith('session-')) return raw.slice('session-'.length)
  if (raw.startsWith('item-')) return raw.slice('item-'.length)
  return raw
}

export function selectSessionSnippets(snippets: Snippet[], sessionId: string) {
  const targetRaw = String(sessionId || '').trim()
  const targetNormalized = normalizeSessionLikeId(targetRaw)
  const targetCompact = targetNormalized.replace(/[^a-z0-9]/g, '')
  if (!targetRaw) return []

  return snippets.filter((snippet) => {
    const snippetRaw = String(snippet.itemId || '').trim()
    if (!snippetRaw) return false
    if (snippetRaw === targetRaw) return true
    const normalized = normalizeSessionLikeId(snippetRaw)
    if (normalized === targetNormalized) return true
    const compact = normalized.replace(/[^a-z0-9]/g, '')
    return compact.length > 0 && compact === targetCompact
  })
}
