import type { Snippet } from '../../types/snippet'

export function approveSnippet(snippet: Snippet): Snippet {
  return { ...snippet, status: 'approved', updatedAt: Date.now() }
}
