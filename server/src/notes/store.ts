import { assertUserCanAccessClient } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Note } from "../types/Note"

type NoteRow = {
  id: string
  client_id: string | null
  input_id: string | null
  title: string | null
  text: string
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapNoteRow(row: NoteRow): Note {
  const sourceInputId = row.input_id ?? null
  return {
    id: row.id,
    clientId: row.client_id ?? null,
    sourceInputId,
    sessionId: sourceInputId ?? "",
    title: row.title ?? "",
    text: row.text,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

async function readNoteClientId(noteId: string): Promise<string | null> {
  const row = await queryOne<{ client_id: string | null }>(
    `
    select client_id
    from public.notes
    where id = $1
    limit 1
    `,
    [noteId],
  )
  return row?.client_id ?? null
}

export async function listNotes(userId: string): Promise<Note[]> {
  const rows = await queryMany<NoteRow>(
    `
    select n.id, n.client_id, n.input_id, coalesce(n.title, '') as title, n.text, n.created_at_unix_ms, n.updated_at_unix_ms
    from public.notes n
    join public.clients c on c.id = n.client_id
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
    order by n.updated_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapNoteRow)
}

export async function createNote(userId: string, note: Note): Promise<void> {
  const rawSourceInputId = note.sourceInputId ?? note.sessionId ?? null
  let sourceInputId: string | null =
    typeof rawSourceInputId === "string" && rawSourceInputId.trim() ? rawSourceInputId.trim() : null
  let clientId = note.clientId ?? null
  if (sourceInputId) {
    const input = await queryOne<{ id: string; client_id: string | null }>(
      `
      select id, client_id
      from public.inputs
      where id = $1
      limit 1
      `,
      [sourceInputId],
    )
    if (!input?.id) {
      sourceInputId = null
    } else if (!clientId && input.client_id) {
      clientId = input.client_id
    }
  }
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)

  await execute(
    `
    insert into public.notes (id, client_id, input_id, created_by_user_id, title, text, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    on conflict (id) do update
      set title = excluded.title,
          text = excluded.text,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [note.id, clientId, sourceInputId, userId, note.title ?? "", note.text, note.createdAtUnixMs, note.updatedAtUnixMs],
  )
}

export async function updateNote(
  userId: string,
  params: { id: string; title?: string; text: string; updatedAtUnixMs: number },
): Promise<void> {
  const clientId = await readNoteClientId(params.id)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)
  const title = params.title ?? ""
  await execute(
    `
    update public.notes
    set title = $1, text = $2, updated_at_unix_ms = $3
    where id = $4
    `,
    [title, params.text, params.updatedAtUnixMs, params.id],
  )
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  const clientId = await readNoteClientId(id)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)
  await execute(`delete from public.notes where id = $1`, [id])
}

