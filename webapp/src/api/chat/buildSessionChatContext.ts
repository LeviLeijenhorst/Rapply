import type { Snippet } from '../../types/snippet'
import type { Note } from '../../types/note'

export function buildSessionChatContext(params: {
  transcript: string
  summary: string
  snippets: Snippet[]
  notes: Note[]
}): string {
  const snippetText = params.snippets.map((snippet) => `- ${snippet.text}`).join('\n')
  const noteText = params.notes.map((note) => `- ${note.title}: ${note.text}`).join('\n')
  return `Transcript:\n${params.transcript}\n\nSummary:\n${params.summary}\n\nSnippets:\n${snippetText}\n\nNotes:\n${noteText}`
}
