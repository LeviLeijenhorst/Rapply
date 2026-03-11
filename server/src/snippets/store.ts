import { execute, queryMany } from "../db"
import type { Snippet } from "../types/Snippet"

type SnippetRow = {
  id: string
  client_id: string
  source_input_id: string | null
  snippet_type: string
  snippet_text: string
  snippet_date: number
  approval_status: "pending" | "approved" | "rejected"
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

// Maps a database snippet row to the application snippet model.
function mapSnippetRow(row: SnippetRow): Snippet {
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: "",
    sourceSessionId: row.source_input_id ?? "",
    snippetType: row.snippet_type,
    text: row.snippet_text,
    snippetDate: Number(row.snippet_date),
    approvalStatus: row.approval_status,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

// Lists all snippets for one user ordered by snippet date and creation time.
export async function listSnippets(userId: string): Promise<Snippet[]> {
  const rows = await queryMany<SnippetRow>(
    `
    select id, client_id, source_input_id, snippet_type, snippet_text, snippet_date, approval_status, created_at_unix_ms, updated_at_unix_ms
    from public.snippets
    where owner_user_id = $1
    order by snippet_date desc, created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapSnippetRow)
}

// Creates a snippet or updates it when the same snippet id already exists.
export async function createSnippet(userId: string, snippet: Snippet): Promise<void> {
  await execute(
    `
    insert into public.snippets (
      id, owner_user_id, client_id, source_input_id, snippet_type, snippet_text, snippet_date, approval_status, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    on conflict (id) do update
      set client_id = excluded.client_id,
          source_input_id = excluded.source_input_id,
          snippet_type = excluded.snippet_type,
          snippet_text = excluded.snippet_text,
          snippet_date = excluded.snippet_date,
          approval_status = excluded.approval_status,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.snippets.owner_user_id = excluded.owner_user_id
    `,
    [
      snippet.id,
      userId,
      snippet.clientId,
      snippet.sourceSessionId || null,
      snippet.snippetType,
      snippet.text,
      snippet.snippetDate,
      snippet.approvalStatus,
      snippet.createdAtUnixMs,
      snippet.updatedAtUnixMs,
    ],
  )
}

// Updates selected snippet fields and always writes an updated timestamp.
export async function updateSnippet(
  userId: string,
  params: {
    id: string
    snippetType?: string | null
    text?: string | null
    approvalStatus?: Snippet["approvalStatus"]
    updatedAtUnixMs: number
  },
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (typeof params.snippetType === "string") {
    updates.push(`snippet_type = $${index++}`)
    values.push(params.snippetType)
  }

  if (typeof params.text === "string") {
    updates.push(`snippet_text = $${index++}`)
    values.push(params.text)
  }

  if (params.approvalStatus !== undefined) {
    updates.push(`approval_status = $${index++}`)
    values.push(params.approvalStatus)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.snippets
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

// Deletes a snippet owned by the given user.
export async function deleteSnippet(userId: string, id: string): Promise<void> {
  await execute(`delete from public.snippets where owner_user_id = $1 and id = $2`, [userId, id])
}
