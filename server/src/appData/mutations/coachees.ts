import { execute } from "../../db"
import type { Coachee } from "../types"

// Creates or upserts one coachee row.
export async function createCoachee(userId: string, coachee: Coachee): Promise<void> {
  await execute(
    `
    insert into public.coachees (id, user_id, name, created_at_unix_ms, updated_at_unix_ms, is_archived)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (id) do update
      set name = excluded.name,
          updated_at_unix_ms = excluded.updated_at_unix_ms,
          is_archived = excluded.is_archived
      where public.coachees.user_id = excluded.user_id
    `,
    [coachee.id, userId, coachee.name, coachee.createdAtUnixMs, coachee.updatedAtUnixMs, coachee.isArchived],
  )
}

// Updates the mutable coachee fields that are provided in the request.
export async function updateCoachee(userId: string, params: { id: string; name?: string | null; isArchived?: boolean; updatedAtUnixMs: number }): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (typeof params.name === "string") {
    updates.push(`name = $${index++}`)
    values.push(params.name)
  }

  if (typeof params.isArchived === "boolean") {
    updates.push(`is_archived = $${index++}`)
    values.push(params.isArchived)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.coachees
    set ${updates.join(", ")}
    where user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

// Permanently deletes one coachee owned by the user.
export async function deleteCoachee(userId: string, id: string): Promise<void> {
  await execute(`delete from public.coachees where user_id = $1 and id = $2`, [userId, id])
}

