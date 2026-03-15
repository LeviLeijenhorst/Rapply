import { execute, queryOne } from "../db"
import { findPrimaryOrganizationIdForUser } from "../organizationSettings/store"
import { requireUserDefaultOrganizationId } from "../access/clientAccess"
import type { UserSettings } from "../types/UserSettings"

type OrganizationContactRow = {
  id: string
  contact_name: string
  contact_role: string
  contact_phone: string
  contact_email: string
  updated_at_unix_ms: number
}

function mapOrganizationContactRow(row: OrganizationContactRow | null | undefined): UserSettings {
  return {
    contactName: row?.contact_name ?? "",
    contactRole: row?.contact_role ?? "",
    contactPhone: row?.contact_phone ?? "",
    contactEmail: row?.contact_email ?? "",
    updatedAtUnixMs: Number(row?.updated_at_unix_ms ?? 0),
  }
}

async function readOrganizationContactRow(organizationId: string): Promise<OrganizationContactRow | null> {
  return queryOne<OrganizationContactRow>(
    `
    select id, contact_name, contact_role, contact_phone, contact_email, updated_at_unix_ms
    from public.organizations
    where id = $1
    `,
    [organizationId],
  )
}

export async function readUserSettings(userId: string): Promise<UserSettings> {
  const organizationId = await findPrimaryOrganizationIdForUser(userId)
  if (!organizationId) return mapOrganizationContactRow(null)

  const row = await readOrganizationContactRow(organizationId)
  return mapOrganizationContactRow(row)
}

export async function updateUserSettings(
  userId: string,
  params: {
    contactName?: string | null
    contactRole?: string | null
    contactPhone?: string | null
    contactEmail?: string | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const organizationId = await requireUserDefaultOrganizationId(userId)
  const current = await readOrganizationContactRow(organizationId)

  await execute(
    `
    update public.organizations
    set contact_name = $1,
        contact_role = $2,
        contact_phone = $3,
        contact_email = $4,
        updated_at_unix_ms = $5
    where id = $6
      and ($5 >= updated_at_unix_ms)
    `,
    [
      params.contactName ?? current?.contact_name ?? "",
      params.contactRole ?? current?.contact_role ?? "",
      params.contactPhone ?? current?.contact_phone ?? "",
      params.contactEmail ?? current?.contact_email ?? "",
      params.updatedAtUnixMs,
      organizationId,
    ],
  )
}
