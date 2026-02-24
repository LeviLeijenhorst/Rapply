import { execute } from "../../db"
import type { Coachee } from "../types"

// Creates or upserts one coachee row.
export async function createCoachee(userId: string, coachee: Coachee): Promise<void> {
  await execute(
    `
    insert into public.coachees (id, user_id, name, client_details, employer_details, first_sick_day, created_at_unix_ms, updated_at_unix_ms, is_archived)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    on conflict (id) do update
      set name = excluded.name,
          client_details = excluded.client_details,
          employer_details = excluded.employer_details,
          first_sick_day = excluded.first_sick_day,
          updated_at_unix_ms = excluded.updated_at_unix_ms,
          is_archived = excluded.is_archived
      where public.coachees.user_id = excluded.user_id
    `,
    [coachee.id, userId, coachee.name, coachee.clientDetails, coachee.employerDetails, coachee.firstSickDay, coachee.createdAtUnixMs, coachee.updatedAtUnixMs, coachee.isArchived],
  )
}

// Updates the mutable coachee fields that are provided in the request.
export async function updateCoachee(
  userId: string,
  params: {
    id: string
    name?: string | null
    clientDetails?: string | null
    employerDetails?: string | null
    firstSickDay?: string | null
    isArchived?: boolean
    updatedAtUnixMs: number
  },
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (typeof params.name === "string") {
    updates.push(`name = $${index++}`)
    values.push(params.name)
  }

  if (params.clientDetails !== undefined) {
    updates.push(`client_details = $${index++}`)
    values.push(params.clientDetails)
  }

  if (params.employerDetails !== undefined) {
    updates.push(`employer_details = $${index++}`)
    values.push(params.employerDetails)
  }

  if (params.firstSickDay !== undefined) {
    updates.push(`first_sick_day = $${index++}`)
    values.push(params.firstSickDay)
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

