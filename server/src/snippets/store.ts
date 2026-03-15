import { assertUserCanAccessClient } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Snippet } from "../types/Snippet"

type SnippetRow = {
  id: string
  client_id: string
  trajectory_id: string | null
  source_input_id: string | null
  snippet_type: string
  field_id: string | null
  snippet_text: string
  snippet_date: number
  approval_status: "pending" | "approved" | "rejected"
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapSnippetRow(row: SnippetRow): Snippet {
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: row.trajectory_id ?? null,
    sourceSessionId: row.source_input_id ?? "",
    sourceInputId: row.source_input_id ?? null,
    snippetType: row.snippet_type,
    fieldId: row.field_id ?? row.snippet_type,
    text: row.snippet_text,
    snippetDate: Number(row.snippet_date),
    approvalStatus: row.approval_status,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

async function readSnippetClientId(id: string): Promise<string | null> {
  const row = await queryOne<{ client_id: string }>(
    `
    select client_id
    from public.snippets
    where id = $1
    limit 1
    `,
    [id],
  )
  return row?.client_id ?? null
}

export async function listSnippets(userId: string): Promise<Snippet[]> {
  const rows = await queryMany<SnippetRow>(
    `
    select s.id, s.client_id, s.trajectory_id, s.source_input_id, s.snippet_type, s.field_id, s.snippet_text, s.snippet_date, s.approval_status, s.created_at_unix_ms, s.updated_at_unix_ms
    from public.snippets s
    join public.clients c on c.id = s.client_id
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
    order by s.snippet_date desc, s.created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapSnippetRow)
}

export async function createSnippet(userId: string, snippet: Snippet): Promise<void> {
  await assertUserCanAccessClient(userId, snippet.clientId)
  await execute(
    `
    insert into public.snippets (
      id, client_id, trajectory_id, source_input_id, created_by_user_id, snippet_type, field_id, snippet_text, snippet_date, approval_status, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    on conflict (id) do update
      set client_id = excluded.client_id,
          trajectory_id = excluded.trajectory_id,
          source_input_id = excluded.source_input_id,
          snippet_type = excluded.snippet_type,
          field_id = excluded.field_id,
          snippet_text = excluded.snippet_text,
          snippet_date = excluded.snippet_date,
          approval_status = excluded.approval_status,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      snippet.id,
      snippet.clientId,
      snippet.trajectoryId,
      snippet.sourceInputId ?? snippet.sourceSessionId ?? null,
      userId,
      snippet.snippetType,
      snippet.fieldId,
      snippet.text,
      snippet.snippetDate,
      snippet.approvalStatus,
      snippet.createdAtUnixMs,
      snippet.updatedAtUnixMs,
    ],
  )
}

export async function updateSnippet(
  userId: string,
  params: {
    id: string
    snippetType?: string | null
    fieldId?: string | null
    text?: string | null
    approvalStatus?: Snippet["approvalStatus"]
    updatedAtUnixMs: number
  },
): Promise<void> {
  const clientId = await readSnippetClientId(params.id)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)

  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (typeof params.snippetType === "string") {
    updates.push(`snippet_type = $${index++}`)
    values.push(params.snippetType)
  }
  if (typeof params.fieldId === "string") {
    updates.push(`field_id = $${index++}`)
    values.push(params.fieldId)
  }
  if (typeof params.text === "string") {
    updates.push(`snippet_text = $${index++}`)
    values.push(params.text)
  }
  if (params.approvalStatus !== undefined) {
    updates.push(`approval_status = $${index++}`)
    values.push(params.approvalStatus)
  }

  values.push(params.id)
  await execute(
    `
    update public.snippets
    set ${updates.join(", ")}
    where id = $${index}
    `,
    values,
  )
}

export async function deleteSnippet(userId: string, id: string): Promise<void> {
  const clientId = await readSnippetClientId(id)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)
  await execute(`delete from public.snippets where id = $1`, [id])
}

