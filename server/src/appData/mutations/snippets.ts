import { execute } from "../../db"
import type { Snippet } from "../types"

export async function createSnippet(userId: string, snippet: Snippet): Promise<void> {
  await execute(
    `
    insert into public.snippets (
      id, user_id, trajectory_id, item_id, field, text, date, status, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    on conflict (id) do update
      set trajectory_id = excluded.trajectory_id,
          item_id = excluded.item_id,
          field = excluded.field,
          text = excluded.text,
          date = excluded.date,
          status = excluded.status,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.snippets.user_id = excluded.user_id
    `,
    [
      snippet.id,
      userId,
      snippet.trajectoryId,
      snippet.itemId,
      snippet.field,
      snippet.text,
      snippet.date,
      snippet.status,
      snippet.createdAtUnixMs,
      snippet.updatedAtUnixMs,
    ],
  )
}

export async function updateSnippet(
  userId: string,
  params: {
    id: string
    field?: string | null
    text?: string | null
    status?: Snippet["status"]
    updatedAtUnixMs: number
  },
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (typeof params.field === "string") {
    updates.push(`field = $${index++}`)
    values.push(params.field)
  }

  if (typeof params.text === "string") {
    updates.push(`text = $${index++}`)
    values.push(params.text)
  }

  if (params.status !== undefined) {
    updates.push(`status = $${index++}`)
    values.push(params.status)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.snippets
    set ${updates.join(", ")}
    where user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteSnippet(userId: string, id: string): Promise<void> {
  await execute(`delete from public.snippets where user_id = $1 and id = $2`, [userId, id])
}
