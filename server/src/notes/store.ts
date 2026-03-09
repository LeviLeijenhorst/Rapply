import { execute, queryMany } from "../db"
import type { Note } from "../types/Note"

type NoteRow = {
  id: string
  session_id: string
  title: string | null
  text: string
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title ?? "",
    text: row.text,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

export async function listNotes(userId: string): Promise<Note[]> {
  const rows = await queryMany<NoteRow>(
    `
    select id, session_id, coalesce(title, '') as title, text, created_at_unix_ms, updated_at_unix_ms
    from public.session_notes
    where owner_user_id = $1
    order by updated_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapNoteRow)
}

export async function createNote(userId: string, note: Note): Promise<void> {
  await execute(
    `
    insert into public.session_notes (id, owner_user_id, session_id, title, text, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6, $7)
    on conflict (id) do update
      set title = excluded.title,
          text = excluded.text,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.session_notes.owner_user_id = excluded.owner_user_id
    `,
    [note.id, userId, note.sessionId, note.title ?? "", note.text, note.createdAtUnixMs, note.updatedAtUnixMs],
  )
}

export async function updateNote(
  userId: string,
  params: { id: string; title?: string; text: string; updatedAtUnixMs: number },
): Promise<void> {
  const title = params.title ?? ""
  await execute(
    `
    update public.session_notes
    set title = $1, text = $2, updated_at_unix_ms = $3
    where owner_user_id = $4 and id = $5
    `,
    [title, params.text, params.updatedAtUnixMs, userId, params.id],
  )
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await execute(`delete from public.session_notes where owner_user_id = $1 and id = $2`, [userId, id])
}
