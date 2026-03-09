import { execute } from "../../db"
import type { Trajectory } from "../types"

export async function createTrajectory(userId: string, trajectory: Trajectory): Promise<void> {
  await execute(
    `
    insert into public.trajectories (
      id, owner_user_id, client_id, name, service_type, uwv_contact_name, uwv_contact_phone, uwv_contact_email, order_number, start_date, plan_of_action_json, max_hours, max_admin_hours, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)
    on conflict (id) do update
      set client_id = excluded.client_id,
          name = excluded.name,
          service_type = excluded.service_type,
          uwv_contact_name = excluded.uwv_contact_name,
          uwv_contact_phone = excluded.uwv_contact_phone,
          uwv_contact_email = excluded.uwv_contact_email,
          order_number = excluded.order_number,
          start_date = excluded.start_date,
          plan_of_action_json = excluded.plan_of_action_json,
          max_hours = excluded.max_hours,
          max_admin_hours = excluded.max_admin_hours,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.trajectories.owner_user_id = excluded.owner_user_id
    `,
    [
      trajectory.id,
      userId,
      trajectory.clientId,
      trajectory.name,
      trajectory.serviceType,
      trajectory.uwvContactName,
      trajectory.uwvContactPhone,
      trajectory.uwvContactEmail,
      trajectory.orderNumber,
      trajectory.startDate,
      trajectory.planOfAction ? JSON.stringify(trajectory.planOfAction) : null,
      trajectory.maxHours,
      trajectory.maxAdminHours,
      trajectory.createdAtUnixMs,
      trajectory.updatedAtUnixMs,
    ],
  )
}

export async function updateTrajectory(
  userId: string,
  params: {
    id: string
    clientId?: string
    name?: string | null
    serviceType?: string | null
    uwvContactName?: string | null
    uwvContactPhone?: string | null
    uwvContactEmail?: string | null
    orderNumber?: string | null
    startDate?: string | null
    planOfAction?: Trajectory["planOfAction"]
    maxHours?: number | null
    maxAdminHours?: number | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (params.clientId !== undefined) {
    updates.push(`client_id = $${index++}`)
    values.push(params.clientId)
  }

  if (typeof params.name === "string") {
    updates.push(`name = $${index++}`)
    values.push(params.name)
  }

  if (params.serviceType !== undefined) {
    updates.push(`service_type = $${index++}`)
    values.push(params.serviceType)
  }

  if (params.uwvContactName !== undefined) {
    updates.push(`uwv_contact_name = $${index++}`)
    values.push(params.uwvContactName)
  }

  if (params.uwvContactPhone !== undefined) {
    updates.push(`uwv_contact_phone = $${index++}`)
    values.push(params.uwvContactPhone)
  }

  if (params.uwvContactEmail !== undefined) {
    updates.push(`uwv_contact_email = $${index++}`)
    values.push(params.uwvContactEmail)
  }

  if (params.orderNumber !== undefined) {
    updates.push(`order_number = $${index++}`)
    values.push(params.orderNumber)
  }

  if (params.startDate !== undefined) {
    updates.push(`start_date = $${index++}`)
    values.push(params.startDate)
  }

  if (params.planOfAction !== undefined) {
    updates.push(`plan_of_action_json = $${index++}::jsonb`)
    values.push(params.planOfAction ? JSON.stringify(params.planOfAction) : null)
  }

  if (params.maxHours !== undefined) {
    updates.push(`max_hours = $${index++}`)
    values.push(params.maxHours)
  }

  if (params.maxAdminHours !== undefined) {
    updates.push(`max_admin_hours = $${index++}`)
    values.push(params.maxAdminHours)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.trajectories
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteTrajectory(userId: string, id: string): Promise<void> {
  await execute(`delete from public.trajectories where owner_user_id = $1 and id = $2`, [userId, id])
}

