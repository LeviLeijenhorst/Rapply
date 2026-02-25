import { execute, queryOne } from "../../db"

// Upserts the user's practice settings using current values for omitted fields.
export async function updatePracticeSettings(
  userId: string,
  params: { practiceName?: string | null; website?: string | null; tintColor?: string | null; logoDataUrl?: string | null; updatedAtUnixMs: number },
): Promise<void> {
  const current = await queryOne<{
    practice_name: string
    website: string
    tint_color: string
    logo_data_url: string | null
  }>(
    `
    select practice_name, website, tint_color, logo_data_url
    from public.practice_settings
    where user_id = $1
    `,
    [userId],
  )

  const practiceName = params.practiceName === undefined ? current?.practice_name ?? "" : params.practiceName ?? ""
  const website = params.website === undefined ? current?.website ?? "" : params.website ?? ""
  const tintColor = params.tintColor === undefined ? current?.tint_color ?? "#BE0165" : params.tintColor ?? "#BE0165"
  const logoDataUrl = params.logoDataUrl === undefined ? current?.logo_data_url ?? null : params.logoDataUrl

  await execute(
    `
    insert into public.practice_settings (user_id, practice_name, website, tint_color, logo_data_url, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (user_id) do update
      set practice_name = excluded.practice_name,
          website = excluded.website,
          tint_color = excluded.tint_color,
          logo_data_url = excluded.logo_data_url,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where excluded.updated_at_unix_ms >= public.practice_settings.updated_at_unix_ms
    `,
    [userId, practiceName, website, tintColor, logoDataUrl, params.updatedAtUnixMs],
  )
}

