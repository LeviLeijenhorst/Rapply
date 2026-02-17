import crypto from "crypto"
import { execute, queryOne } from "./db"
import { isAdminEmail, normalizeEmail } from "./admin"

export type AppUser = {
  userId: string
  entraUserId: string
  email: string | null
  displayName: string | null
  accountType: "admin" | "paid" | "test"
}

let ensureUsersAllowlistColumnPromise: Promise<void> | null = null
let ensureUsersAccountTypeColumnPromise: Promise<void> | null = null

async function ensureUsersAllowlistColumn(): Promise<void> {
  if (!ensureUsersAllowlistColumnPromise) {
    ensureUsersAllowlistColumnPromise = execute(
      `
      alter table public.users
      add column if not exists is_allowlisted boolean not null default true;
      `,
      [],
    ).catch((error) => {
      ensureUsersAllowlistColumnPromise = null
      throw error
    })
  }

  await ensureUsersAllowlistColumnPromise
}

async function ensureUsersAccountTypeColumn(): Promise<void> {
  if (!ensureUsersAccountTypeColumnPromise) {
    ensureUsersAccountTypeColumnPromise = execute(
      `
      alter table public.users
      add column if not exists account_type text not null default 'paid';

      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'users_account_type_allowed_values'
        ) then
          alter table public.users
            add constraint users_account_type_allowed_values check (account_type in ('admin', 'paid', 'test'));
        end if;
      end
      $$;
      `,
      [],
    ).catch((error) => {
      ensureUsersAccountTypeColumnPromise = null
      throw error
    })
  }

  await ensureUsersAccountTypeColumnPromise
}

function createSignupNotAllowedError(): Error {
  const error: any = new Error("Dit e-mailadres staat niet op de allowlist. Vraag toegang aan de beheerder.")
  error.status = 403
  return error as Error
}

// Intent: ensureUserFromEntra
export async function ensureUserFromEntra(params: { entraUserId: string; email: string | null; displayName: string | null }): Promise<AppUser> {
  await ensureUsersAllowlistColumn()
  await ensureUsersAccountTypeColumn()

  const entraUserId = String(params.entraUserId || "").trim()
  if (!entraUserId) {
    throw new Error("Missing Entra user id")
  }

  const email = typeof params.email === "string" && params.email.trim() ? params.email.trim() : null
  const displayName = typeof params.displayName === "string" && params.displayName.trim() ? params.displayName.trim() : null
  const normalizedEmail = normalizeEmail(email)

  const existingUser = await queryOne<{
    id: string
    entra_user_id: string
    email: string | null
    display_name: string | null
    is_allowlisted: boolean
    account_type: "admin" | "paid" | "test"
  }>(
    `
    select id, entra_user_id, email, display_name, is_allowlisted, account_type
    from public.users
    where entra_user_id = $1
    limit 1
    `,
    [entraUserId],
  )

  if (existingUser?.id) {
    if (!isAdminEmail(normalizedEmail) && !existingUser.is_allowlisted) {
      throw createSignupNotAllowedError()
    }

    const updatedExistingUser = await queryOne<{
      id: string
      entra_user_id: string
      email: string | null
      display_name: string | null
      account_type: "admin" | "paid" | "test"
    }>(
      `
      update public.users
      set email = $1,
          display_name = coalesce($2, public.users.display_name),
          updated_at = now()
      where id = $3
      returning id, entra_user_id, email, display_name, account_type
      `,
      [email, displayName, existingUser.id],
    )

    if (!updatedExistingUser?.id) {
      throw new Error("Failed to load user")
    }

    return {
      userId: updatedExistingUser.id,
      entraUserId: updatedExistingUser.entra_user_id,
      email: updatedExistingUser.email,
      displayName: updatedExistingUser.display_name,
      accountType: updatedExistingUser.account_type,
    }
  }

  if (normalizedEmail) {
    const existingUserByEmail = await queryOne<{
      id: string
      entra_user_id: string | null
      email: string | null
      display_name: string | null
      is_allowlisted: boolean
      account_type: "admin" | "paid" | "test"
    }>(
      `
      select id, entra_user_id, email, display_name, is_allowlisted, account_type
      from public.users
      where lower(email) = $1
      limit 1
      `,
      [normalizedEmail],
    )

    if (existingUserByEmail?.id) {
      if (!isAdminEmail(normalizedEmail) && !existingUserByEmail.is_allowlisted) {
        throw createSignupNotAllowedError()
      }

      const updatedUserByEmail = await queryOne<{
        id: string
        entra_user_id: string
        email: string | null
        display_name: string | null
        account_type: "admin" | "paid" | "test"
      }>(
        `
        update public.users
        set entra_user_id = $1,
            email = $2,
            display_name = coalesce($3, public.users.display_name),
            updated_at = now()
        where id = $4
        returning id, entra_user_id, email, display_name, account_type
        `,
        [entraUserId, email, displayName, existingUserByEmail.id],
      )

      if (!updatedUserByEmail?.id) {
        throw new Error("Failed to load user")
      }

      return {
        userId: updatedUserByEmail.id,
        entraUserId: updatedUserByEmail.entra_user_id,
        email: updatedUserByEmail.email,
        displayName: updatedUserByEmail.display_name,
        accountType: updatedUserByEmail.account_type,
      }
    }
  }

  if (!normalizedEmail) {
    throw createSignupNotAllowedError()
  }

  if (!isAdminEmail(normalizedEmail)) {
    const allowlistEntry = await queryOne<{ email: string }>(
      `
      select email
      from public.signup_email_allowlist
      where lower(email) = $1
      limit 1
      `,
      [normalizedEmail],
    )

    if (!allowlistEntry?.email) {
      throw createSignupNotAllowedError()
    }
  }

  const userId = crypto.randomUUID()

  const row = await queryOne<{
    id: string
    entra_user_id: string
    email: string | null
    display_name: string | null
    account_type: "admin" | "paid" | "test"
  }>(
    `
    insert into public.users (id, entra_user_id, email, display_name, created_at, updated_at)
    values ($1, $2, $3, $4, now(), now())
    on conflict (entra_user_id) do update
      set email = excluded.email,
          display_name = coalesce(excluded.display_name, public.users.display_name),
          updated_at = now()
    returning id, entra_user_id, email, display_name, account_type
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
    accountType: row.account_type,
  }
}

// Intent: deleteUserById
export async function deleteUserById(userId: string): Promise<void> {
  await execute(`delete from public.users where id = $1`, [userId])
}

// Intent: updateUserDisplayName
export async function updateUserDisplayName(params: { userId: string; displayName: string | null }): Promise<void> {
  const displayName = typeof params.displayName === "string" && params.displayName.trim() ? params.displayName.trim() : null
  await execute(`update public.users set display_name = $1, updated_at = now() where id = $2`, [displayName, params.userId])
}

