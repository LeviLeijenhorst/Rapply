import { execute, queryOne } from "../db"
import type { OrganizationSettings } from "../types/OrganizationSettings"
import { requireUserDefaultOrganizationId } from "../access/clientAccess"

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
  contact_name: string
  contact_role: string
  contact_phone: string
  contact_email: string
  updated_at_unix_ms: number
}

function combineStreetAndHouseNumber(street: string, houseNumber: string): string {
  return [street.trim(), houseNumber.trim()].filter(Boolean).join(" ").trim()
}

function combinePostalCodeAndCity(postalCode: string, city: string): string {
  return [postalCode.trim(), city.trim()].filter(Boolean).join(" ").trim()
}

function splitStreetAndHouseNumber(value: string): { street: string; houseNumber: string } {
  const raw = String(value || "").trim()
  if (!raw) return { street: "", houseNumber: "" }
  const match = raw.match(/^(.*?)(\d+[a-zA-Z0-9\-\/]*)$/)
  if (!match) return { street: raw, houseNumber: "" }
  return {
    street: String(match[1] || "").trim().replace(/,\s*$/, ""),
    houseNumber: String(match[2] || "").trim(),
  }
}

function splitPostalCodeAndCity(value: string): { postalCode: string; city: string } {
  const raw = String(value || "").trim()
  if (!raw) return { postalCode: "", city: "" }
  const match = raw.match(/\b\d{4}\s?[a-z]{2}\b/i)
  if (!match || match.index === undefined) return { postalCode: "", city: raw }
  return {
    postalCode: String(match[0] || "")
      .toUpperCase()
      .replace(/\s+/g, ""),
    city: raw
      .slice(match.index + match[0].length)
      .replace(/^[,\s-]+/, "")
      .trim(),
  }
}

function mapOrganizationRow(row: OrganizationRow | null | undefined): OrganizationSettings {
  return {
    practiceName: row?.name ?? "",
    website: "",
    visitAddress: row ? combineStreetAndHouseNumber(row.visit_street, row.visit_house_number) : "",
    postalAddress: row ? combineStreetAndHouseNumber(row.postal_street, row.postal_house_number) : "",
    postalCodeCity: row ? combinePostalCodeAndCity(row.postal_code, row.postal_city) : "",
    visitPostalCodeCity: row ? combinePostalCodeAndCity(row.visit_postal_code, row.visit_city) : "",
    contactName: row?.contact_name ?? "",
    contactRole: row?.contact_role ?? "",
    contactPhone: row?.contact_phone ?? "",
    contactEmail: row?.contact_email ?? "",
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

async function readOrganizationRow(organizationId: string): Promise<OrganizationRow | null> {
  return queryOne<OrganizationRow>(
    `
    select id, name, visit_street, visit_house_number, visit_city, visit_postal_code, postal_street, postal_house_number, postal_city, postal_code, contact_name, contact_role, contact_phone, contact_email, updated_at_unix_ms
    from public.organizations
    where id = $1
    `,
    [organizationId],
  )
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
    visitPostalCodeCity?: string | null
    contactName?: string | null
    contactRole?: string | null
    contactPhone?: string | null
    contactEmail?: string | null
    tintColor?: string | null
    logoDataUrl?: string | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const organizationId = await requireUserDefaultOrganizationId(userId)
  const current = await readOrganizationRow(organizationId)

  const visitAddress =
    params.visitAddress === undefined
      ? combineStreetAndHouseNumber(current?.visit_street ?? "", current?.visit_house_number ?? "")
      : params.visitAddress ?? ""
  const postalAddress =
    params.postalAddress === undefined
      ? combineStreetAndHouseNumber(current?.postal_street ?? "", current?.postal_house_number ?? "")
      : params.postalAddress ?? ""

  const postalCodeCity =
    params.postalCodeCity === undefined ? combinePostalCodeAndCity(current?.postal_code ?? "", current?.postal_city ?? "") : params.postalCodeCity ?? ""
  const visitPostalCodeCity =
    params.visitPostalCodeCity === undefined
      ? combinePostalCodeAndCity(current?.visit_postal_code ?? "", current?.visit_city ?? "")
      : params.visitPostalCodeCity ?? ""

  const visitAddressParts = splitStreetAndHouseNumber(visitAddress)
  const postalAddressParts = splitStreetAndHouseNumber(postalAddress)
  const postalParts = splitPostalCodeAndCity(postalCodeCity)
  const visitParts = splitPostalCodeAndCity(visitPostalCodeCity)

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
        contact_name = $10,
        contact_role = $11,
        contact_phone = $12,
        contact_email = $13,
        updated_at_unix_ms = $14
    where id = $15
      and ($14 >= updated_at_unix_ms)
    `,
    [
      params.practiceName ?? current?.name ?? "",
      visitAddressParts.street,
      visitAddressParts.houseNumber,
      visitParts.city,
      visitParts.postalCode,
      postalAddressParts.street,
      postalAddressParts.houseNumber,
      postalParts.city,
      postalParts.postalCode,
      params.contactName ?? current?.contact_name ?? "",
      params.contactRole ?? current?.contact_role ?? "",
      params.contactPhone ?? current?.contact_phone ?? "",
      params.contactEmail ?? current?.contact_email ?? "",
      params.updatedAtUnixMs,
      organizationId,
    ],
  )
}
