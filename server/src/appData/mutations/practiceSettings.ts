import { execute, queryOne } from "../../db"

// Upserts the user's practice settings using current values for omitted fields.
export async function updatePracticeSettings(
  userId: string,
  params: {
    practiceName?: string | null
    website?: string | null
    visitAddress?: string | null
    postalAddress?: string | null
    postalCodeCity?: string | null
    contactName?: string | null
    contactRole?: string | null
    contactPhone?: string | null
    contactEmail?: string | null
    tintColor?: string | null
    logoDataUrl?: string | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const current = await queryOne<{
    practice_name: string
    website: string
    visit_address: string
    postal_address: string
    postal_code_city: string
    contact_name: string
    contact_role: string
    contact_phone: string
    contact_email: string
    tint_color: string
    logo_data_url: string | null
  }>(
    `
    select practice_name, website, visit_address, postal_address, postal_code_city, contact_name, contact_role, contact_phone, contact_email, tint_color, logo_data_url
    from public.practice_settings
    where user_id = $1
    `,
    [userId],
  )

  const practiceName = params.practiceName === undefined ? current?.practice_name ?? "" : params.practiceName ?? ""
  const website = params.website === undefined ? current?.website ?? "" : params.website ?? ""
  const visitAddress = params.visitAddress === undefined ? current?.visit_address ?? "" : params.visitAddress ?? ""
  const postalAddress = params.postalAddress === undefined ? current?.postal_address ?? "" : params.postalAddress ?? ""
  const postalCodeCity = params.postalCodeCity === undefined ? current?.postal_code_city ?? "" : params.postalCodeCity ?? ""
  const contactName = params.contactName === undefined ? current?.contact_name ?? "" : params.contactName ?? ""
  const contactRole = params.contactRole === undefined ? current?.contact_role ?? "" : params.contactRole ?? ""
  const contactPhone = params.contactPhone === undefined ? current?.contact_phone ?? "" : params.contactPhone ?? ""
  const contactEmail = params.contactEmail === undefined ? current?.contact_email ?? "" : params.contactEmail ?? ""
  const tintColor = params.tintColor === undefined ? current?.tint_color ?? "#BE0165" : params.tintColor ?? "#BE0165"
  const logoDataUrl = params.logoDataUrl === undefined ? current?.logo_data_url ?? null : params.logoDataUrl

  await execute(
    `
    insert into public.practice_settings (user_id, practice_name, website, visit_address, postal_address, postal_code_city, contact_name, contact_role, contact_phone, contact_email, tint_color, logo_data_url, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    on conflict (user_id) do update
      set practice_name = excluded.practice_name,
          website = excluded.website,
          visit_address = excluded.visit_address,
          postal_address = excluded.postal_address,
          postal_code_city = excluded.postal_code_city,
          contact_name = excluded.contact_name,
          contact_role = excluded.contact_role,
          contact_phone = excluded.contact_phone,
          contact_email = excluded.contact_email,
          tint_color = excluded.tint_color,
          logo_data_url = excluded.logo_data_url,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where excluded.updated_at_unix_ms >= public.practice_settings.updated_at_unix_ms
    `,
    [userId, practiceName, website, visitAddress, postalAddress, postalCodeCity, contactName, contactRole, contactPhone, contactEmail, tintColor, logoDataUrl, params.updatedAtUnixMs],
  )
}

