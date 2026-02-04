import crypto from "crypto"
import { execute, queryOne } from "./db"

export type AppUser = {
  userId: string
  entraUserId: string
  email: string | null
  displayName: string | null
}

export async function ensureUserFromEntra(params: { entraUserId: string; email: string | null; displayName: string | null }): Promise<AppUser> {
  const entraUserId = String(params.entraUserId || "").trim()
  if (!entraUserId) {
    throw new Error("Missing Entra user id")
  }

  const email = typeof params.email === "string" && params.email.trim() ? params.email.trim() : null
  const displayName = typeof params.displayName === "string" && params.displayName.trim() ? params.displayName.trim() : null

  const userId = crypto.randomUUID()

  const row = await queryOne<{
    id: string
    entra_user_id: string
    email: string | null
    display_name: string | null
  }>(
    `
    insert into public.users (id, entra_user_id, email, display_name, created_at, updated_at)
    values ($1, $2, $3, $4, now(), now())
    on conflict (entra_user_id) do update
      set email = excluded.email,
          display_name = coalesce(excluded.display_name, public.users.display_name),
          updated_at = now()
    returning id, entra_user_id, email, display_name
    `,
    [userId, entraUserId, email, displayName],
  )

  if (!row?.id) {
    throw new Error("Failed to load user")
  }

  return {
    userId: row.id,
    entraUserId: row.entra_user_id,
    email: row.email,
    displayName: row.display_name,
  }
}

export async function deleteUserById(userId: string): Promise<void> {
  await execute(`delete from public.users where id = $1`, [userId])
}

export async function updateUserDisplayName(params: { userId: string; displayName: string | null }): Promise<void> {
  const displayName = typeof params.displayName === "string" && params.displayName.trim() ? params.displayName.trim() : null
  await execute(`update public.users set display_name = $1, updated_at = now() where id = $2`, [displayName, params.userId])
}

