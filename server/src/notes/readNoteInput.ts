import type { Note } from "../types/Note"
import { readId, readOptionalId, readText, readUnixMs } from "../routes/parsers/scalars"

export function readNoteInput(value: unknown): Note {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "note.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "note.updatedAtUnixMs")
  const sourceInputId =
    payload.sourceInputId === null || payload.sessionId === null || payload.inputId === null
      ? null
      : readOptionalId(payload.sourceInputId ?? payload.sessionId ?? payload.inputId) ?? null
  const sessionId = sourceInputId ?? readOptionalId(payload.sessionId ?? payload.inputId) ?? ""
  return {
    id: readId(payload.id, "note.id"),
    clientId: payload.clientId === null ? null : readOptionalId(payload.clientId) ?? null,
    sourceInputId,
    sessionId,
    title: typeof payload.title === "string" ? payload.title.trim() : "",
    text: readText(payload.text, "note.text"),
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
