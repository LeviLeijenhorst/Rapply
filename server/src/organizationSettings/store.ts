import { execute, queryOne } from "../db"
import type { OrganizationSettings } from "../types/OrganizationSettings"

type OrganizationRow = {
  id: string
  name: string
  visit_street: string
  visit_house_number: string
  visit_city: string
  visit_postal_code: string
  postal_street: string
  postal_house_number: string
  postal_city: string
  postal_code: string
  updated_at_unix_ms: number
}

function formatAddress(street: string, houseNumber: string, city: string, postalCode: string): string {
  const line1 = [street.trim(), houseNumber.trim()].filter(Boolean).join(" ").trim()
  const line2 = [postalCode.trim(), city.trim()].filter(Boolean).join(" ").trim()
  return [line1, line2].filter(Boolean).join(", ")
}

function mapOrganizationRow(row: OrganizationRow | null | undefined): OrganizationSettings {
  return {
    practiceName: row?.name ?? "",
    website: "",
    visitAddress: row ? formatAddress(row.visit_street, row.visit_house_number, row.visit_city, row.visit_postal_code) : "",
    postalAddress: row ? formatAddress(row.postal_street, row.postal_house_number, row.postal_city, row.postal_code) : "",
    postalCodeCity: row ? [row.postal_code, row.postal_city].filter(Boolean).join(" ").trim() : "",
    tintColor: "#BE0165",
    logoDataUrl: null,
    updatedAtUnixMs: Number(row?.updated_at_unix_ms ?? 0),
  }
}

export async function findPrimaryOrganizationIdForUser(userId: string): Promise<string | null> {
  const membership = await queryOne<{ organization_id: string }>(
    `
    select organization_id
    from public.organization_users
    where user_id = $1
    order by created_at_unix_ms asc
    limit 1
    `,
    [userId],
  )
  return membership?.organization_id ?? null
}

export async function ensurePrimaryOrganizationForUser(userId: string, nowUnixMs: number): Promise<string> {
  const existingOrganizationId = await findPrimaryOrganizationIdForUser(userId)
  if (existingOrganizationId) return existingOrganizationId

  const organizationId = `organization-${userId}`
  await execute(
    `
    insert into public.organizations (id, name, created_at_unix_ms, updated_at_unix_ms)
    values ($1, '', $2, $2)
    on conflict (id) do nothing
    `,
    [organizationId, nowUnixMs],
  )

  await execute(
    `
    insert into public.organization_users (organization_id, user_id, role, created_at_unix_ms)
    values ($1, $2, 'admin', $3)
    on conflict (organization_id, user_id) do nothing
    `,
    [organizationId, userId, nowUnixMs],
  )

  return organizationId
}

async function readOrganizationRow(organizationId: string): Promise<OrganizationRow | null> {
  return queryOne<OrganizationRow>(
    `
    select id, name, visit_street, visit_house_number, visit_city, visit_postal_code, postal_street, postal_house_number, postal_city, postal_code, updated_at_unix_ms
    from public.organizations
    where id = $1
    `,
    [organizationId],
  )
}

function splitAddress(value: string): { street: string; houseNumber: string; city: string; postalCode: string } {
  const text = String(value || "").trim()
  if (!text) return { street: "", houseNumber: "", city: "", postalCode: "" }
  return { street: text, houseNumber: "", city: "", postalCode: "" }
}

export async function readOrganizationSettings(userId: string): Promise<OrganizationSettings> {
  const organizationId = await findPrimaryOrganizationIdForUser(userId)
  if (!organizationId) return mapOrganizationRow(null)

  const row = await readOrganizationRow(organizationId)
  return mapOrganizationRow(row)
}

export async function updateOrganizationSettings(
  userId: string,
  params: {
    practiceName?: string | null
    website?: string | null
    visitAddress?: string | null
    postalAddress?: string | null
    postalCodeCity?: string | null
    tintColor?: string | null
    logoDataUrl?: string | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const organizationId = await ensurePrimaryOrganizationForUser(userId, params.updatedAtUnixMs)
  const current = await readOrganizationRow(organizationId)

  const visitAddress =
    params.visitAddress === undefined
      ? formatAddress(current?.visit_street ?? "", current?.visit_house_number ?? "", current?.visit_city ?? "", current?.visit_postal_code ?? "")
      : params.visitAddress ?? ""
  const postalAddress =
    params.postalAddress === undefined
      ? formatAddress(current?.postal_street ?? "", current?.postal_house_number ?? "", current?.postal_city ?? "", current?.postal_code ?? "")
      : params.postalAddress ?? ""

  const visit = splitAddress(visitAddress)
  const postal = splitAddress(postalAddress)

  await execute(
    `
    update public.organizations
    set name = $1,
        visit_street = $2,
        visit_house_number = $3,
        visit_city = $4,
        visit_postal_code = $5,
        postal_street = $6,
        postal_house_number = $7,
        postal_city = $8,
        postal_code = $9,
        updated_at_unix_ms = $10
    where id = $11
      and ($10 >= updated_at_unix_ms)
    `,
    [
      params.practiceName ?? current?.name ?? "",
      visit.street,
      visit.houseNumber,
      visit.city,
      visit.postalCode,
      postal.street,
      postal.houseNumber,
      postal.city,
      postal.postalCode,
      params.updatedAtUnixMs,
      organizationId,
    ],
  )
}
