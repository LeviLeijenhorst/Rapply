import type { Note } from "../types/Note"
import { readId, readText, readUnixMs } from "../routes/parsers/scalars"

export function readNoteInput(value: unknown): Note {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "note.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "note.updatedAtUnixMs")
  return {
    id: readId(payload.id, "note.id"),
    sessionId: readId(payload.sessionId, "note.sessionId"),
    title: typeof payload.title === "string" ? payload.title.trim() : "",
    text: readText(payload.text, "note.text"),
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
