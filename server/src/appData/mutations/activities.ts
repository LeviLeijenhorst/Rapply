import { execute } from "../../db"
import type { Activity } from "../types"

export async function createActivity(userId: string, activity: Activity): Promise<void> {
  await execute(
    `
    insert into public.activities (
      id, user_id, trajectory_id, session_id, template_id, name, category, status, planned_hours, actual_hours, source, is_admin, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    on conflict (id) do update
      set trajectory_id = excluded.trajectory_id,
          session_id = excluded.session_id,
          template_id = excluded.template_id,
          name = excluded.name,
          category = excluded.category,
          status = excluded.status,
          planned_hours = excluded.planned_hours,
          actual_hours = excluded.actual_hours,
          source = excluded.source,
          is_admin = excluded.is_admin,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.activities.user_id = excluded.user_id
    `,
    [
      activity.id,
      userId,
      activity.trajectoryId,
      activity.sessionId,
      activity.templateId,
      activity.name,
      activity.category,
      activity.status,
      activity.plannedHours,
      activity.actualHours,
      activity.source,
      activity.isAdmin,
      activity.createdAtUnixMs,
      activity.updatedAtUnixMs,
    ],
  )
}

export async function updateActivity(
  userId: string,
  params: {
    id: string
    trajectoryId?: string
    sessionId?: string | null
    templateId?: string | null
    name?: string | null
    category?: string | null
    status?: Activity["status"]
    plannedHours?: number | null
    actualHours?: number | null
    source?: Activity["source"]
    isAdmin?: boolean
    updatedAtUnixMs: number
  },
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (params.trajectoryId !== undefined) {
    updates.push(`trajectory_id = $${index++}`)
    values.push(params.trajectoryId)
  }

  if (params.sessionId !== undefined) {
    updates.push(`session_id = $${index++}`)
    values.push(params.sessionId)
  }

  if (params.templateId !== undefined) {
    updates.push(`template_id = $${index++}`)
    values.push(params.templateId)
  }

  if (typeof params.name === "string") {
    updates.push(`name = $${index++}`)
    values.push(params.name)
  }

  if (typeof params.category === "string") {
    updates.push(`category = $${index++}`)
    values.push(params.category)
  }

  if (params.status !== undefined) {
    updates.push(`status = $${index++}`)
    values.push(params.status)
  }

  if (params.plannedHours !== undefined) {
    updates.push(`planned_hours = $${index++}`)
    values.push(params.plannedHours)
  }

  if (params.actualHours !== undefined) {
    updates.push(`actual_hours = $${index++}`)
    values.push(params.actualHours)
  }

  if (params.source !== undefined) {
    updates.push(`source = $${index++}`)
    values.push(params.source)
  }

  if (typeof params.isAdmin === "boolean") {
    updates.push(`is_admin = $${index++}`)
    values.push(params.isAdmin)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.activities
    set ${updates.join(", ")}
    where user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteActivity(userId: string, id: string): Promise<void> {
  await execute(`delete from public.activities where user_id = $1 and id = $2`, [userId, id])
}
