import { execute } from "../../db"
import type { Note } from "../types"

// Creates or upserts one note row.
export async function createNote(userId: string, note: Note): Promise<void> {
  await execute(
    `
    insert into public.session_notes (id, user_id, session_id, text, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (id) do update
      set text = excluded.text,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [note.id, userId, note.sessionId, note.text, note.createdAtUnixMs, note.updatedAtUnixMs],
  )
}

// Updates note text and timestamp for one note.
export async function updateNote(userId: string, params: { id: string; text: string; updatedAtUnixMs: number }): Promise<void> {
  await execute(
    `
    update public.session_notes
    set text = $1, updated_at_unix_ms = $2
    where user_id = $3 and id = $4
    `,
    [params.text, params.updatedAtUnixMs, userId, params.id],
  )
}

// Permanently deletes one note owned by the user.
export async function deleteNote(userId: string, id: string): Promise<void> {
  await execute(`delete from public.session_notes where user_id = $1 and id = $2`, [userId, id])
}

