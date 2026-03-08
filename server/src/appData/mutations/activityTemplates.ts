import { execute } from "../../db"
import type { ActivityTemplate } from "../types"

export async function createActivityTemplate(userId: string, template: ActivityTemplate): Promise<void> {
  await execute(
    `
    insert into public.activity_templates (
      id, user_id, name, description, category, default_hours, is_admin, organization_id, is_active, created_at_unix_ms, updated_at_unix_ms
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
      where public.activity_templates.user_id = excluded.user_id
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
    where user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteActivityTemplate(userId: string, id: string): Promise<void> {
  await execute(`delete from public.activity_templates where user_id = $1 and id = $2`, [userId, id])
}
