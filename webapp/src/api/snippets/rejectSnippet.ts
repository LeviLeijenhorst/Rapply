import type { Snippet } from '../../types/snippet'

export function rejectSnippet(snippet: Snippet): Snippet {
  return { ...snippet, status: 'rejected', updatedAt: Date.now() }
}
