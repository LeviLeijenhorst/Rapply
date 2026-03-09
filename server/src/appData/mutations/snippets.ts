import { execute } from "../../db"
import type { Snippet } from "../types"

export async function createSnippet(userId: string, snippet: Snippet): Promise<void> {
  await execute(
    `
    insert into public.snippets (
      id, owner_user_id, client_id, trajectory_id, source_session_id, snippet_type, text, snippet_date, approval_status, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    on conflict (id) do update
      set client_id = excluded.client_id,
          trajectory_id = excluded.trajectory_id,
          source_session_id = excluded.source_session_id,
          snippet_type = excluded.snippet_type,
          text = excluded.text,
          snippet_date = excluded.snippet_date,
          approval_status = excluded.approval_status,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.snippets.owner_user_id = excluded.owner_user_id
    `,
    [
      snippet.id,
      userId,
      snippet.clientId,
      snippet.trajectoryId,
      snippet.sourceSessionId,
      snippet.snippetType,
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
    updates.push(`text = $${index++}`)
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

export async function deleteSnippet(userId: string, id: string): Promise<void> {
  await execute(`delete from public.snippets where owner_user_id = $1 and id = $2`, [userId, id])
}
