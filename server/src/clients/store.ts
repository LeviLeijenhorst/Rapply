import { execute, queryMany } from "../db"
import type { Client } from "../types/Client"

type ClientRow = {
  id: string
  name: string
  client_details: string
  employer_details: string
  first_sick_day: string
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
    firstSickDay: row.first_sick_day ?? "",
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
    isArchived: row.is_archived,
  }
}

export async function listClients(userId: string): Promise<Client[]> {
  const rows = await queryMany<ClientRow>(
    `
    select id, name, coalesce(client_details, '') as client_details, coalesce(employer_details, '') as employer_details, coalesce(first_sick_day, '') as first_sick_day, created_at_unix_ms, updated_at_unix_ms, is_archived
    from public.clients
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapClientRow)
}

export async function createClient(userId: string, client: Client): Promise<void> {
  await execute(
    `
    insert into public.clients (id, owner_user_id, name, client_details, employer_details, first_sick_day, created_at_unix_ms, updated_at_unix_ms, is_archived)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    on conflict (id) do update
      set name = excluded.name,
          client_details = excluded.client_details,
          employer_details = excluded.employer_details,
          first_sick_day = excluded.first_sick_day,
          updated_at_unix_ms = excluded.updated_at_unix_ms,
          is_archived = excluded.is_archived
      where public.clients.owner_user_id = excluded.owner_user_id
    `,
    [client.id, userId, client.name, client.clientDetails, client.employerDetails, client.firstSickDay, client.createdAtUnixMs, client.updatedAtUnixMs, client.isArchived],
  )
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
    update public.clients
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteClient(userId: string, id: string): Promise<void> {
  await execute(`delete from public.clients where owner_user_id = $1 and id = $2`, [userId, id])
}
