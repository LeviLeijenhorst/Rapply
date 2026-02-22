import { execute } from "../../db"
import type { Note } from "../types"

// Creates or upserts one note row.
export async function createNote(userId: string, note: Note): Promise<void> {
  await execute(
    `
    insert into public.session_notes (id, user_id, session_id, title, text, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6, $7)
    on conflict (id) do update
      set title = excluded.title,
          text = excluded.text,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.session_notes.user_id = excluded.user_id
    `,
    [note.id, userId, note.sessionId, note.title ?? "", note.text, note.createdAtUnixMs, note.updatedAtUnixMs],
  )
}

// Updates note title, text and timestamp for one note.
export async function updateNote(
  userId: string,
  params: { id: string; title?: string; text: string; updatedAtUnixMs: number },
): Promise<void> {
  const title = params.title ?? ""
  await execute(
    `
    update public.session_notes
    set title = $1, text = $2, updated_at_unix_ms = $3
    where user_id = $4 and id = $5
    `,
    [title, params.text, params.updatedAtUnixMs, userId, params.id],
  )
}

// Permanently deletes one note owned by the user.
export async function deleteNote(userId: string, id: string): Promise<void> {
  await execute(`delete from public.session_notes where user_id = $1 and id = $2`, [userId, id])
}
