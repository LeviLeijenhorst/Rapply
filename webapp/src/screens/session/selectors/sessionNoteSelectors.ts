import type { Note } from '../../../storage/types'

export function selectSessionNotes(notes: Note[], sessionId: string) {
  return notes
    .filter((note) => note.sessionId === sessionId)
    .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
}

