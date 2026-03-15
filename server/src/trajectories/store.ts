import { assertUserCanAccessClient } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Trajectory } from "../types/Trajectory"

type TrajectoryRow = {
  id: string
  client_id: string
  is_active: boolean
  name: string
  service_type: string
  uwv_contact_name: string | null
  uwv_contact_phone: string | null
  uwv_contact_email: string | null
  order_number: string | null
  start_date: string | null
  plan_of_action_json: unknown | null
  max_hours: number
  max_admin_hours: number
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapTrajectoryRow(row: TrajectoryRow): Trajectory {
  return {
    id: row.id,
    clientId: row.client_id,
    isActive: Boolean(row.is_active),
    name: row.name,
    serviceType: row.service_type,
    uwvContactName: row.uwv_contact_name,
    uwvContactPhone: row.uwv_contact_phone,
    uwvContactEmail: row.uwv_contact_email,
    orderNumber: row.order_number,
    startDate: row.start_date,
    planOfAction:
      row.plan_of_action_json && typeof row.plan_of_action_json === "object"
        ? {
            documentId: String((row.plan_of_action_json as any).documentId || ""),
          }
        : null,
    maxHours: Number(row.max_hours),
    maxAdminHours: Number(row.max_admin_hours),
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

async function readTrajectoryClientId(id: string): Promise<string | null> {
  const row = await queryOne<{ client_id: string }>(
    `
    select client_id
    from public.trajectories
    where id = $1
    limit 1
    `,
    [id],
  )
  return row?.client_id ?? null
}

export async function listTrajectories(userId: string): Promise<Trajectory[]> {
  const rows = await queryMany<TrajectoryRow>(
    `
    select
      t.id,
      t.client_id,
      t.is_active,
      t.name,
      t.service_type,
      t.uwv_contact_name,
      t.uwv_contact_phone,
      t.uwv_contact_email,
      t.order_number,
      t.start_date,
      t.plan_of_action_json,
      t.max_hours,
      t.max_admin_hours,
      t.created_at_unix_ms,
      t.updated_at_unix_ms
    from public.trajectories t
    join public.clients c on c.id = t.client_id
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
    order by t.is_active desc, t.created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapTrajectoryRow)
}

export async function createTrajectory(userId: string, trajectory: Trajectory): Promise<void> {
  await assertUserCanAccessClient(userId, trajectory.clientId)
  if (trajectory.isActive) {
    await execute(
      `
      update public.trajectories
      set is_active = false, updated_at_unix_ms = $1
      where client_id = $2
      `,
      [trajectory.updatedAtUnixMs, trajectory.clientId],
    )
  }

  await execute(
    `
    insert into public.trajectories (
      id, client_id, is_active, name, service_type, uwv_contact_name, uwv_contact_phone, uwv_contact_email, order_number, start_date, plan_of_action_json, max_hours, max_admin_hours, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)
    on conflict (id) do update
      set client_id = excluded.client_id,
          is_active = excluded.is_active,
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
    `,
    [
      trajectory.id,
      trajectory.clientId,
      trajectory.isActive,
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
    isActive?: boolean
    updatedAtUnixMs: number
  },
): Promise<void> {
  const existingClientId = await readTrajectoryClientId(params.id)
  if (!existingClientId) return
  await assertUserCanAccessClient(userId, existingClientId)
  if (params.clientId) {
    await assertUserCanAccessClient(userId, params.clientId)
  }

  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (params.clientId !== undefined) {
    updates.push(`client_id = $${index++}`)
    values.push(params.clientId)
  }
  if (params.isActive !== undefined) {
    updates.push(`is_active = $${index++}`)
    values.push(params.isActive)
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

  values.push(params.id)
  await execute(
    `
    update public.trajectories
    set ${updates.join(", ")}
    where id = $${index}
    `,
    values,
  )

  if (params.isActive) {
    await execute(
      `
      update public.trajectories
      set is_active = false, updated_at_unix_ms = $1
      where client_id = (
        select client_id
        from public.trajectories
        where id = $2
      )
        and id <> $2
      `,
      [params.updatedAtUnixMs, params.id],
    )
  }
}

export async function deleteTrajectory(userId: string, id: string): Promise<void> {
  const clientId = await readTrajectoryClientId(id)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)
  await execute(`delete from public.trajectories where id = $1`, [id])
}

export async function readActiveTrajectoryForClient(userId: string, clientId: string): Promise<Trajectory | null> {
  await assertUserCanAccessClient(userId, clientId)
  const row = await queryMany<TrajectoryRow>(
    `
    select id, client_id, is_active, name, service_type, uwv_contact_name, uwv_contact_phone, uwv_contact_email, order_number, start_date, plan_of_action_json, max_hours, max_admin_hours, created_at_unix_ms, updated_at_unix_ms
    from public.trajectories
    where client_id = $1 and is_active = true
    order by updated_at_unix_ms desc
    limit 1
    `,
    [clientId],
  )
  return row.length > 0 ? mapTrajectoryRow(row[0]) : null
}

export async function ensureActiveTrajectoryForClient(userId: string, clientId: string): Promise<Trajectory> {
  await assertUserCanAccessClient(userId, clientId)
  const existingActive = await readActiveTrajectoryForClient(userId, clientId)
  if (existingActive) return existingActive

  const existing = await queryMany<TrajectoryRow>(
    `
    select id, client_id, is_active, name, service_type, uwv_contact_name, uwv_contact_phone, uwv_contact_email, order_number, start_date, plan_of_action_json, max_hours, max_admin_hours, created_at_unix_ms, updated_at_unix_ms
    from public.trajectories
    where client_id = $1
    order by created_at_unix_ms asc
    limit 1
    `,
    [clientId],
  )

  const now = Date.now()
  if (existing.length > 0) {
    const first = existing[0]
    await updateTrajectory(userId, { id: first.id, isActive: true, updatedAtUnixMs: now })
    return { ...mapTrajectoryRow({ ...first, is_active: true }), isActive: true }
  }

  const created: Trajectory = {
    id: `trajectory-${crypto.randomUUID()}`,
    clientId,
    isActive: true,
    name: "Actief traject",
    serviceType: "werkfit",
    uwvContactName: null,
    uwvContactPhone: null,
    uwvContactEmail: null,
    orderNumber: null,
    startDate: null,
    planOfAction: null,
    maxHours: 0,
    maxAdminHours: 0,
    createdAtUnixMs: now,
    updatedAtUnixMs: now,
  }
  await createTrajectory(userId, created)
  return created
}

