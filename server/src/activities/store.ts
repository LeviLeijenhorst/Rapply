import { execute, queryMany } from "../db"
import type { Activity } from "../types/Activity"
import type { ActivityTemplate } from "../types/ActivityTemplate"

type ActivityRow = {
  id: string
  trajectory_id: string
  session_id: string | null
  template_id: string | null
  name: string
  category: string
  status: "planned" | "executed"
  planned_hours: number | null
  actual_hours: number | null
  source: "manual" | "ai_detected"
  is_admin: boolean
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

type ActivityTemplateRow = {
  id: string
  name: string
  description: string
  category: string
  default_hours: number
  is_admin: boolean
  organization_id: string | null
  is_active: boolean
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapActivityRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    trajectoryId: row.trajectory_id,
    sessionId: row.session_id,
    templateId: row.template_id,
    name: row.name,
    category: row.category,
    status: row.status,
    plannedHours: row.planned_hours !== null ? Number(row.planned_hours) : null,
    actualHours: row.actual_hours !== null ? Number(row.actual_hours) : null,
    source: row.source,
    isAdmin: row.is_admin,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

function mapActivityTemplateRow(row: ActivityTemplateRow): ActivityTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category,
    defaultHours: Number(row.default_hours),
    isAdmin: row.is_admin,
    organizationId: row.organization_id,
    isActive: row.is_active,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

export async function listActivities(userId: string): Promise<Activity[]> {
  const rows = await queryMany<ActivityRow>(
    `
    select id, trajectory_id, session_id, template_id, name, category, status, planned_hours, actual_hours, source, is_admin, created_at_unix_ms, updated_at_unix_ms
    from public.activities
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapActivityRow)
}

export async function listActivityTemplates(userId: string): Promise<ActivityTemplate[]> {
  const rows = await queryMany<ActivityTemplateRow>(
    `
    select id, name, coalesce(description, '') as description, category, default_hours, is_admin, organization_id, is_active, created_at_unix_ms, updated_at_unix_ms
    from public.activity_templates
    where owner_user_id = $1 or owner_user_id is null
    order by created_at_unix_ms asc
    `,
    [userId],
  )
  return rows.map(mapActivityTemplateRow)
}

export async function createActivity(userId: string, activity: Activity): Promise<void> {
  await execute(
    `
    insert into public.activities (
      id, owner_user_id, trajectory_id, session_id, template_id, name, category, status, planned_hours, actual_hours, source, is_admin, created_at_unix_ms, updated_at_unix_ms
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
      where public.activities.owner_user_id = excluded.owner_user_id
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
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteActivity(userId: string, id: string): Promise<void> {
  await execute(`delete from public.activities where owner_user_id = $1 and id = $2`, [userId, id])
}

export async function createActivityTemplate(userId: string, template: ActivityTemplate): Promise<void> {
  await execute(
    `
    insert into public.activity_templates (
      id, owner_user_id, name, description, category, default_hours, is_admin, organization_id, is_active, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    on conflict (id) do update
      set name = excluded.name,
          description = excluded.description,
          category = excluded.category,
          default_hours = excluded.default_hours,
          is_admin = excluded.is_admin,
          organization_id = excluded.organization_id,
          is_active = excluded.is_active,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.activity_templates.owner_user_id = excluded.owner_user_id
    `,
    [
      template.id,
      userId,
      template.name,
      template.description,
      template.category,
      template.defaultHours,
      template.isAdmin,
      template.organizationId,
      template.isActive,
      template.createdAtUnixMs,
      template.updatedAtUnixMs,
    ],
  )
}

export async function updateActivityTemplate(
  userId: string,
  params: {
    id: string
    name?: string | null
    description?: string | null
    category?: string | null
    defaultHours?: number | null
    isAdmin?: boolean
    organizationId?: string | null
    isActive?: boolean
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

  if (typeof params.description === "string") {
    updates.push(`description = $${index++}`)
    values.push(params.description)
  }

  if (typeof params.category === "string") {
    updates.push(`category = $${index++}`)
    values.push(params.category)
  }

  if (params.defaultHours !== undefined) {
    updates.push(`default_hours = $${index++}`)
    values.push(params.defaultHours)
  }

  if (typeof params.isAdmin === "boolean") {
    updates.push(`is_admin = $${index++}`)
    values.push(params.isAdmin)
  }

  if (params.organizationId !== undefined) {
    updates.push(`organization_id = $${index++}`)
    values.push(params.organizationId)
  }

  if (typeof params.isActive === "boolean") {
    updates.push(`is_active = $${index++}`)
    values.push(params.isActive)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.activity_templates
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteActivityTemplate(userId: string, id: string): Promise<void> {
  await execute(`delete from public.activity_templates where owner_user_id = $1 and id = $2`, [userId, id])
}
