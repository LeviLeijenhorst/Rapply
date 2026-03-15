import { assertUserCanAccessClient, assertUserCanManageClientAssignments, requireUserDefaultOrganizationId } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Client } from "../types/Client"

type ClientRow = {
  id: string
  organization_id: string
  name: string
  client_details: string
  employer_details: string
  trajectory_start_date: string | null
  trajectory_end_date: string | null
  created_by_user_id: string | null
  primary_coach_user_id: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
  is_archived: boolean
}

type AssignedCoachRow = {
  client_id: string
  user_id: string
  role: string
  display_name: string | null
  email: string | null
}

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    clientDetails: row.client_details ?? "",
    employerDetails: row.employer_details ?? "",
    trajectoryStartDate: row.trajectory_start_date,
    trajectoryEndDate: row.trajectory_end_date,
    createdByUserId: row.created_by_user_id,
    primaryCoachUserId: row.primary_coach_user_id,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
    isArchived: row.is_archived,
  }
}

async function readAssignedCoachesForClientIds(clientIds: string[]): Promise<Map<string, Client["assignedCoaches"]>> {
  if (clientIds.length === 0) return new Map()
  const rows = await queryMany<AssignedCoachRow>(
    `
    select
      ca.client_id,
      ca.user_id,
      ca.role,
      u.display_name,
      u.email
    from public.client_assignments ca
    join public.users u on u.id = ca.user_id
    where ca.client_id = any($1::text[])
    order by ca.created_at_unix_ms asc
    `,
    [clientIds],
  )

  const map = new Map<string, Client["assignedCoaches"]>()
  for (const row of rows) {
    const current = map.get(row.client_id) || []
    current.push({
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
      role: row.role,
    })
    map.set(row.client_id, current)
  }
  return map
}

async function assertUserInClientOrganization(userId: string, clientId: string): Promise<void> {
  const row = await queryOne<{ id: string }>(
    `
    select c.id
    from public.clients c
    join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    where c.id = $2
    limit 1
    `,
    [userId, clientId],
  )
  if (!row?.id) {
    const error: any = new Error("User is not in the client's organization")
    error.status = 403
    throw error as Error
  }
}

export async function listClients(userId: string): Promise<Client[]> {
  const rows = await queryMany<ClientRow>(
    `
    select
      c.id,
      c.organization_id,
      c.name,
      coalesce(c.client_details, '') as client_details,
      coalesce(c.employer_details, '') as employer_details,
      c.trajectory_start_date,
      c.trajectory_end_date,
      c.created_by_user_id,
      c.primary_coach_user_id,
      c.created_at_unix_ms,
      c.updated_at_unix_ms,
      c.is_archived
    from public.clients c
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
    order by c.created_at_unix_ms desc
    `,
    [userId],
  )

  const clients = rows.map(mapClientRow)
  const assignedCoachMap = await readAssignedCoachesForClientIds(clients.map((client) => client.id))
  return clients.map((client) => {
    const assignedCoaches = assignedCoachMap.get(client.id) || []
    return {
      ...client,
      assignedCoaches,
      assignedCoachUserIds: assignedCoaches.map((coach) => coach.userId),
    }
  })
}

export async function createClient(userId: string, client: Client): Promise<void> {
  const organizationId = await requireUserDefaultOrganizationId(userId)

  await execute(
    `
    insert into public.clients (
      id,
      organization_id,
      name,
      client_details,
      employer_details,
      trajectory_start_date,
      trajectory_end_date,
      created_by_user_id,
      primary_coach_user_id,
      created_at_unix_ms,
      updated_at_unix_ms,
      is_archived
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11)
    on conflict (id) do update
      set name = excluded.name,
          client_details = excluded.client_details,
          employer_details = excluded.employer_details,
          trajectory_start_date = excluded.trajectory_start_date,
          trajectory_end_date = excluded.trajectory_end_date,
          primary_coach_user_id = excluded.primary_coach_user_id,
          updated_at_unix_ms = excluded.updated_at_unix_ms,
          is_archived = excluded.is_archived
    `,
    [
      client.id,
      organizationId,
      client.name,
      client.clientDetails,
      client.employerDetails,
      client.trajectoryStartDate ?? null,
      client.trajectoryEndDate ?? null,
      userId,
      client.createdAtUnixMs,
      client.updatedAtUnixMs,
      client.isArchived,
    ],
  )

  await execute(
    `
    insert into public.client_assignments (client_id, user_id, role, created_at_unix_ms)
    values ($1, $2, 'coach', $3)
    on conflict (client_id, user_id) do nothing
    `,
    [client.id, userId, client.createdAtUnixMs],
  )
}

export async function updateClient(
  userId: string,
  params: {
    id: string
    name?: string | null
    clientDetails?: string | null
    employerDetails?: string | null
    trajectoryStartDate?: string | null
    trajectoryEndDate?: string | null
    isArchived?: boolean
    updatedAtUnixMs: number
  },
): Promise<void> {
  await assertUserCanAccessClient(userId, params.id)

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
  if (params.trajectoryStartDate !== undefined) {
    updates.push(`trajectory_start_date = $${index++}`)
    values.push(params.trajectoryStartDate)
  }
  if (params.trajectoryEndDate !== undefined) {
    updates.push(`trajectory_end_date = $${index++}`)
    values.push(params.trajectoryEndDate)
  }
  if (typeof params.isArchived === "boolean") {
    updates.push(`is_archived = $${index++}`)
    values.push(params.isArchived)
  }

  values.push(params.id)
  await execute(
    `
    update public.clients
    set ${updates.join(", ")}
    where id = $${index}
    `,
    values,
  )
}

export async function deleteClient(userId: string, id: string): Promise<void> {
  await assertUserCanAccessClient(userId, id)
  await execute(`delete from public.clients where id = $1`, [id])
}

export async function listAssignedCoachesForClient(userId: string, clientId: string): Promise<Client["assignedCoaches"]> {
  await assertUserCanAccessClient(userId, clientId)
  const map = await readAssignedCoachesForClientIds([clientId])
  return map.get(clientId) || []
}

export async function assignCoachToClient(userId: string, params: { clientId: string; coachUserId: string; role?: string; createdAtUnixMs: number }): Promise<void> {
  await assertUserCanManageClientAssignments(userId, params.clientId)
  await assertUserInClientOrganization(params.coachUserId, params.clientId)

  await execute(
    `
    insert into public.client_assignments (client_id, user_id, role, created_at_unix_ms)
    values ($1, $2, $3, $4)
    on conflict (client_id, user_id) do update
      set role = excluded.role
    `,
    [params.clientId, params.coachUserId, params.role ?? "coach", params.createdAtUnixMs],
  )
}

export async function unassignCoachFromClient(userId: string, params: { clientId: string; coachUserId: string }): Promise<void> {
  await assertUserCanManageClientAssignments(userId, params.clientId)
  await execute(
    `
    delete from public.client_assignments
    where client_id = $1 and user_id = $2
    `,
    [params.clientId, params.coachUserId],
  )

  await execute(
    `
    update public.clients
    set primary_coach_user_id = (
      select ca.user_id
      from public.client_assignments ca
      where ca.client_id = $1
      order by ca.created_at_unix_ms asc
      limit 1
    )
    where id = $1
      and primary_coach_user_id = $2
    `,
    [params.clientId, params.coachUserId],
  )
}

export async function updateClientPrimaryCoach(userId: string, params: { clientId: string; coachUserId: string }): Promise<void> {
  await assertUserCanManageClientAssignments(userId, params.clientId)
  const assignment = await queryOne<{ user_id: string }>(
    `
    select user_id
    from public.client_assignments
    where client_id = $1 and user_id = $2
    limit 1
    `,
    [params.clientId, params.coachUserId],
  )
  if (!assignment?.user_id) {
    const error: any = new Error("Primary coach must be assigned to the client")
    error.status = 400
    throw error as Error
  }
  await execute(
    `
    update public.clients
    set primary_coach_user_id = $1
    where id = $2
    `,
    [params.coachUserId, params.clientId],
  )
}

export async function listOrganizationCoachesForClient(userId: string, clientId: string): Promise<Array<{ userId: string; displayName: string | null; email: string | null; role: "admin" | "regular" }>> {
  await assertUserCanAccessClient(userId, clientId)
  const rows = await queryMany<{ user_id: string; display_name: string | null; email: string | null; role: "admin" | "regular" }>(
    `
    select
      ou.user_id,
      u.display_name,
      u.email,
      ou.role
    from public.clients c
    join public.organization_users ou on ou.organization_id = c.organization_id
    join public.users u on u.id = ou.user_id
    where c.id = $1
    order by ou.role asc, u.display_name asc nulls last, u.email asc nulls last
    `,
    [clientId],
  )
  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
  }))
}

