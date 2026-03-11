import { execute, queryMany, queryOne } from "../db"
import type { Client } from "../types/Client"

type ClientRow = {
  id: string
  name: string
  client_details: string
  employer_details: string
  trajectory_start_date: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
  is_archived: boolean
}

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    clientDetails: row.client_details ?? "",
    employerDetails: row.employer_details ?? "",
    firstSickDay: row.trajectory_start_date ?? "",
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
    isArchived: row.is_archived,
  }
}

export async function listClients(userId: string): Promise<Client[]> {
  const rows = await queryMany<ClientRow>(
    `
    select c.id, c.name, coalesce(c.client_details, '') as client_details, coalesce(c.employer_details, '') as employer_details, c.trajectory_start_date, c.created_at_unix_ms, c.updated_at_unix_ms, c.is_archived
    from public.clients c
    join public.client_owners co on co.client_id = c.id
    where co.user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapClientRow)
}

export async function createClient(userId: string, client: Client): Promise<void> {
  const organization = await queryOne<{ organization_id: string }>(
    `
    select organization_id
    from public.organization_users
    where user_id = $1
    order by created_at_unix_ms asc
    limit 1
    `,
    [userId],
  )

  await execute(
    `
    insert into public.clients (id, name, client_details, employer_details, trajectory_start_date, trajectory_end_date, created_at_unix_ms, updated_at_unix_ms, is_archived)
    values ($1, $2, $3, $4, $5, null, $6, $7, $8)
    on conflict (id) do update
      set name = excluded.name,
          client_details = excluded.client_details,
          employer_details = excluded.employer_details,
          trajectory_start_date = excluded.trajectory_start_date,
          updated_at_unix_ms = excluded.updated_at_unix_ms,
          is_archived = excluded.is_archived
    `,
    [client.id, client.name, client.clientDetails, client.employerDetails, client.firstSickDay, client.createdAtUnixMs, client.updatedAtUnixMs, client.isArchived],
  )

  await execute(
    `
    insert into public.client_owners (client_id, user_id, created_at_unix_ms)
    values ($1, $2, $3)
    on conflict (client_id, user_id) do nothing
    `,
    [client.id, userId, client.createdAtUnixMs],
  )

  if (organization?.organization_id) {
    await execute(
      `
      insert into public.client_organizations (client_id, organization_id, created_at_unix_ms)
      values ($1, $2, $3)
      on conflict (client_id, organization_id) do nothing
      `,
      [client.id, organization.organization_id, client.createdAtUnixMs],
    )
  }
}

function buildClientOwnershipWhereClause(indexStart: number): { sql: string; userIndex: number; clientIndex: number } {
  const userIndex = indexStart
  const clientIndex = indexStart + 1
  return {
    sql: `
      id = $${clientIndex}
      and exists (
        select 1
        from public.client_owners co
        where co.client_id = public.clients.id
          and co.user_id = $${userIndex}
      )
    `,
    userIndex,
    clientIndex,
  }
}

export async function updateClient(
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
    updates.push(`trajectory_start_date = $${index++}`)
    values.push(params.firstSickDay)
  }

  if (typeof params.isArchived === "boolean") {
    updates.push(`is_archived = $${index++}`)
    values.push(params.isArchived)
  }

  const where = buildClientOwnershipWhereClause(index)
  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.clients
    set ${updates.join(", ")}
    where ${where.sql}
    `,
    values,
  )
}

export async function deleteClient(userId: string, id: string): Promise<void> {
  await execute(
    `
    delete from public.clients
    where id = $2
      and exists (
        select 1
        from public.client_owners co
        where co.client_id = public.clients.id
          and co.user_id = $1
      )
    `,
    [userId, id],
  )
}
