import { assertUserCanAccessClient } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Snippet } from "../types/Snippet"
import { sanitizeSnippetText } from "./sanitizeSnippetText"

type SnippetRow = {
  id: string
  client_id: string
  trajectory_id: string | null
  source_input_id: string | null
  snippet_type: string
  field_id: string | null
  field_ids: string[] | null
  snippet_text: string
  snippet_date: number
  approval_status: "pending" | "approved" | "rejected"
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function normalizeLabelList(values: unknown[]): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const normalized = String(value || "").trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

function resolveSnippetLabels(snippet: Pick<Snippet, "fieldIds" | "fieldId" | "snippetType">): string[] {
  const labels = normalizeLabelList([...(Array.isArray(snippet.fieldIds) ? snippet.fieldIds : []), snippet.fieldId, snippet.snippetType])
  return labels.length > 0 ? labels : ["general"]
}

function mapSnippetRow(row: SnippetRow): Snippet {
  const fieldIds = normalizeLabelList([...(Array.isArray(row.field_ids) ? row.field_ids : []), row.field_id, row.snippet_type])
  const primaryField = fieldIds[0] || "general"
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: row.trajectory_id ?? null,
    sourceSessionId: row.source_input_id ?? "",
    sourceInputId: row.source_input_id ?? null,
    fieldIds,
    snippetType: primaryField,
    fieldId: primaryField,
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
    select s.id, s.client_id, s.trajectory_id, s.source_input_id, s.snippet_type, s.field_id, s.field_ids, s.snippet_text, s.snippet_date, s.approval_status, s.created_at_unix_ms, s.updated_at_unix_ms
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
  const fieldIds = resolveSnippetLabels(snippet)
  const primaryField = fieldIds[0]
  const text = sanitizeSnippetText(snippet.text)
  await execute(
    `
    insert into public.snippets (
      id, client_id, trajectory_id, source_input_id, created_by_user_id, snippet_type, field_id, field_ids, snippet_text, snippet_date, approval_status, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11, $12, $13)
    on conflict (id) do update
      set client_id = excluded.client_id,
          trajectory_id = excluded.trajectory_id,
          source_input_id = excluded.source_input_id,
          snippet_type = excluded.snippet_type,
          field_id = excluded.field_id,
          field_ids = excluded.field_ids,
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
      primaryField,
      primaryField,
      fieldIds,
      text,
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
    fieldIds?: string[] | null
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

  const nextFieldIds = Array.isArray(params.fieldIds) ? normalizeLabelList(params.fieldIds) : null
  const explicitPrimaryField = typeof params.fieldId === "string" ? params.fieldId.trim() : typeof params.snippetType === "string" ? params.snippetType.trim() : ""
  if (nextFieldIds && nextFieldIds.length > 0) {
    updates.push(`field_ids = $${index++}::text[]`)
    values.push(nextFieldIds)
    if (!explicitPrimaryField) {
      updates.push(`field_id = $${index++}`)
      values.push(nextFieldIds[0])
      updates.push(`snippet_type = $${index++}`)
      values.push(nextFieldIds[0])
    }
  }

  if (typeof params.snippetType === "string") {
    updates.push(`snippet_type = $${index++}`)
    values.push(params.snippetType)
  }
  if (typeof params.fieldId === "string") {
    updates.push(`field_id = $${index++}`)
    values.push(params.fieldId)
  }
  if ((!nextFieldIds || nextFieldIds.length === 0) && explicitPrimaryField) {
    updates.push(`field_ids = $${index++}::text[]`)
    values.push([explicitPrimaryField])
  }
  if (typeof params.text === "string") {
    updates.push(`snippet_text = $${index++}`)
    values.push(sanitizeSnippetText(params.text))
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

