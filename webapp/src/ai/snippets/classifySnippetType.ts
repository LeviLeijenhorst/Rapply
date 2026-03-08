import type { SnippetType } from '../../types/snippet'

export function classifySnippetType(field: string): SnippetType {
  const normalized = String(field || '').toLowerCase()
  if (normalized.includes('uwv') || normalized.includes('report') || normalized.includes('rapport')) return 'report'
  return 'knowledge'
}
