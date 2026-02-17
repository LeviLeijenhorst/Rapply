import crypto from "crypto"
import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { adminAccountEmail, isAdminEmail, normalizeEmail } from "../admin"
import { execute, queryMany } from "../db"
import { deleteEntraUserById } from "../entraGraph"
import { asyncHandler, sendError } from "../http"
import { deleteEncryptedUploadsByPrefix } from "../transcription/storage"

type RegisterFeedbackRoutesParams = {
  rateLimitAccount: RequestHandler
}

let ensureContactSubmissionsTablePromise: Promise<void> | null = null
let ensurePraktijkRequestsCompatibilityPromise: Promise<void> | null = null
let ensureContactSubmissionsCompatibilityPromise: Promise<void> | null = null

async function ensureContactSubmissionsTable(): Promise<void> {
  if (!ensureContactSubmissionsTablePromise) {
    ensureContactSubmissionsTablePromise = execute(
      `
      create table if not exists public.contact_submissions (
        id uuid primary key,
        user_id uuid not null references public.users (id) on delete cascade,
        name text not null,
        email text not null,
        phone text,
        message text not null,
        created_at timestamptz not null default now(),
        constraint contact_submissions_name_length check (char_length(name) > 0 and char_length(name) <= 200),
        constraint contact_submissions_email_length check (char_length(email) > 0 and char_length(email) <= 320),
        constraint contact_submissions_phone_length check (phone is null or char_length(phone) <= 50),
        constraint contact_submissions_message_length check (char_length(message) > 0 and char_length(message) <= 5000)
      );
      create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
      `,
      [],
    ).catch((error) => {
      ensureContactSubmissionsTablePromise = null
      throw error
    })
  }
  await ensureContactSubmissionsTablePromise
}

async function ensurePraktijkRequestsCompatibility(): Promise<void> {
  if (!ensurePraktijkRequestsCompatibilityPromise) {
    ensurePraktijkRequestsCompatibilityPromise = execute(
      `
      alter table public.praktijk_requests
      alter column user_id drop not null;
      `,
      [],
    ).catch((error) => {
      ensurePraktijkRequestsCompatibilityPromise = null
      throw error
    })
  }
  await ensurePraktijkRequestsCompatibilityPromise
}

async function ensureContactSubmissionsCompatibility(): Promise<void> {
  if (!ensureContactSubmissionsCompatibilityPromise) {
    ensureContactSubmissionsCompatibilityPromise = execute(
      `
      alter table public.contact_submissions
      alter column user_id drop not null;

      alter table public.contact_submissions
      add column if not exists account_email text;

      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'contact_submissions_account_email_length'
        ) then
          alter table public.contact_submissions
          add constraint contact_submissions_account_email_length
          check (account_email is null or char_length(account_email) <= 320);
        end if;
      end
      $$;
      `,
      [],
    ).catch((error) => {
      ensureContactSubmissionsCompatibilityPromise = null
      throw error
    })
  }
  await ensureContactSubmissionsCompatibilityPromise
}

async function requireAdminUserEmail(req: Parameters<typeof requireAuthenticatedUser>[0]): Promise<string> {
  const user = await requireAuthenticatedUser(req)
  const normalizedUserEmail = normalizeEmail(user.email)
  if (!isAdminEmail(normalizedUserEmail)) {
    console.log("[admin] forbidden", {
      method: req.method,
      path: req.path,
      userEmail: normalizedUserEmail,
      requiredAdminEmail: adminAccountEmail,
    })
    const error: any = new Error("Forbidden")
    error.status = 403
    throw error as Error
  }
  return normalizedUserEmail
}

// Registers feedback collection, admin listing, and account deletion routes.
export function registerFeedbackRoutes(app: Express, params: RegisterFeedbackRoutesParams): void {
  app.post(
    "/subscriptionCancel/feedback",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      const selectedPlan = typeof req.body?.selectedPlan === "string" ? req.body.selectedPlan.trim() : ""
      const selectedReason = typeof req.body?.selectedReason === "string" ? req.body.selectedReason.trim() : ""
      const otherReasonText = typeof req.body?.otherReasonText === "string" ? req.body.otherReasonText.trim() : ""
      const tipsText = typeof req.body?.tipsText === "string" ? req.body.tipsText.trim() : ""

      if (!selectedPlan || !selectedReason) {
        sendError(res, 400, "Missing selectedPlan or selectedReason")
        return
      }

      await execute(
        `
        insert into public.subscription_cancel_feedback (
          id, user_id, selected_plan, selected_reason, other_reason_text, tips_text, account_email
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [crypto.randomUUID(), user.userId, selectedPlan, selectedReason, otherReasonText || null, tipsText || null, user.email],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/feedback",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""

      if (!message) {
        sendError(res, 400, "Missing message")
        return
      }

      await execute(
        `
        insert into public.feedback (id, user_id, name, email, message)
        values ($1, $2, $3, $4, $5)
        `,
        [crypto.randomUUID(), user.userId, name || null, email || null, message],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/contact/submission",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      await ensureContactSubmissionsTable()
      await ensureContactSubmissionsCompatibility()

      const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
      const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : ""
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""

      if (!name || !email || !message) {
        sendError(res, 400, "Missing name, email, or message")
        return
      }

      await execute(
        `
        insert into public.contact_submissions (id, user_id, name, email, phone, message, account_email)
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [crypto.randomUUID(), user.userId, name, email, phone || null, message, user.email],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/contact/request",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureContactSubmissionsTable()
      await ensureContactSubmissionsCompatibility()

      const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
      const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : ""
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""

      if (!name || !email || !message) {
        sendError(res, 400, "Missing name, email, or message")
        return
      }

      await execute(
        `
        insert into public.contact_submissions (id, user_id, name, email, phone, message, account_email)
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [crypto.randomUUID(), null, name, email, phone || null, message, null],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/wachtlijst/request",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensurePraktijkRequestsCompatibility()

      const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : ""
      const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : ""
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
      const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : ""
      const coachType = typeof req.body?.coachType === "string" ? req.body.coachType.trim() : ""
      const userMessage = typeof req.body?.message === "string" ? req.body.message.trim() : ""

      if (!firstName || !lastName || !email) {
        sendError(res, 400, "Missing firstName, lastName, or email")
        return
      }

      const messageParts = [
        `Naam: ${firstName} ${lastName}`,
        phone ? `Telefoon: ${phone}` : "",
        coachType ? `Type coach: ${coachType}` : "",
        userMessage ? `Bericht: ${userMessage}` : "",
      ].filter(Boolean)
      const message = messageParts.join("\n")

      await execute(
        `
        insert into public.praktijk_requests (id, user_id, email, account_email, message)
        values ($1, $2, $3, $4, $5)
        `,
        [crypto.randomUUID(), null, email, null, message],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/admin/feedback/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const requestedLimitRaw = Number(req.body?.limit)
      const requestedLimit = Number.isFinite(requestedLimitRaw) ? Math.trunc(requestedLimitRaw) : 200
      const limit = Math.min(500, Math.max(1, requestedLimit))

      const rows = await queryMany<{
        id: string
        user_id: string
        name: string | null
        email: string | null
        message: string
        created_at: string
        account_email: string | null
      }>(
        `
        select
          f.id,
          f.user_id,
          f.name,
          f.email,
          f.message,
          f.created_at,
          u.email as account_email
        from public.feedback f
        left join public.users u on u.id = f.user_id
        order by f.created_at desc
        limit $1
        `,
        [limit],
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          accountEmail: row.account_email,
          message: row.message,
          createdAt: row.created_at,
        })),
      })
    }),
  )

  app.post(
    "/admin/contact-submissions/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureContactSubmissionsTable()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const requestedLimitRaw = Number(req.body?.limit)
      const requestedLimit = Number.isFinite(requestedLimitRaw) ? Math.trunc(requestedLimitRaw) : 200
      const limit = Math.min(500, Math.max(1, requestedLimit))

      const rows = await queryMany<{
        id: string
        user_id: string
        name: string
        email: string
        phone: string | null
        message: string
        created_at: string
        account_email: string | null
      }>(
        `
        select
          c.id,
          c.user_id,
          c.name,
          c.email,
          c.phone,
          c.message,
          c.created_at,
          u.email as account_email
        from public.contact_submissions c
        left join public.users u on u.id = c.user_id
        order by c.created_at desc
        limit $1
        `,
        [limit],
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          message: row.message,
          createdAt: row.created_at,
          accountEmail: row.account_email,
        })),
      })
    }),
  )

  app.post(
    "/admin/wachtlijst/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const requestedLimitRaw = Number(req.body?.limit)
      const requestedLimit = Number.isFinite(requestedLimitRaw) ? Math.trunc(requestedLimitRaw) : 200
      const limit = Math.min(500, Math.max(1, requestedLimit))

      const rows = await queryMany<{
        id: string
        user_id: string
        email: string
        account_email: string | null
        message: string
        created_at: string
      }>(
        `
        select
          pr.id,
          pr.user_id,
          pr.email,
          pr.account_email,
          pr.message,
          pr.created_at
        from public.praktijk_requests pr
        order by pr.created_at desc
        limit $1
        `,
        [limit],
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          email: row.email,
          accountEmail: row.account_email,
          message: row.message,
          createdAt: row.created_at,
        })),
      })
    }),
  )

  app.post(
    "/admin/account-allowlist/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const rows = await queryMany<{
        id: string
        email: string
        created_at: string
      }>(
        `
        select id, email, created_at
        from public.signup_email_allowlist
        order by lower(email) asc
        `,
        [],
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          email: row.email,
          createdAt: row.created_at,
        })),
      })
    }),
  )

  app.post(
    "/admin/account-allowlist/add",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const adminEmail = await requireAdminUserEmail(req).catch(() => null)
      if (!adminEmail) {
        sendError(res, 403, "Forbidden")
        return
      }

      const candidateEmail = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "")
      if (!candidateEmail) {
        sendError(res, 400, "Missing email")
        return
      }

      await execute(
        `
        insert into public.signup_email_allowlist (id, email, added_by_email)
        values ($1, $2, $3)
        on conflict (email) do update
          set added_by_email = excluded.added_by_email
        `,
        [crypto.randomUUID(), candidateEmail, adminEmail],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/admin/account-allowlist/remove",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const candidateEmail = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "")
      if (!candidateEmail) {
        sendError(res, 400, "Missing email")
        return
      }

      await execute(
        `
        delete from public.signup_email_allowlist
        where lower(email) = $1
        `,
        [candidateEmail],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/praktijk/request",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""

      if (!email || !message) {
        sendError(res, 400, "Missing email or message")
        return
      }

      await execute(
        `
        insert into public.praktijk_requests (id, user_id, email, account_email, message)
        values ($1, $2, $3, $4, $5)
        `,
        [crypto.randomUUID(), user.userId, email, user.email, message],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/account/delete",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const confirmTextRaw = typeof req.body?.confirmText === "string" ? req.body.confirmText.trim() : ""
      const confirmText = confirmTextRaw.toUpperCase()
      if (confirmTextRaw && confirmText !== "VERWIJDEREN") {
        sendError(res, 400, "Bevestigingstekst ongeldig")
        return
      }

      try {
        await deleteEntraUserById(user.entraUserId)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.log("[account/delete] Entra deletion failed", { userId: user.userId, entraUserId: user.entraUserId, message })
        const hasPermissionError =
          message.includes("Authorization_RequestDenied") ||
          message.includes("Insufficient privileges") ||
          message.includes("Permission") ||
          message.includes("permissions")
        sendError(
          res,
          502,
          hasPermissionError
            ? "Kon Entra account niet verwijderen. Controleer Microsoft Graph permissies (User.ReadWrite.All) en admin consent voor de backend app-registratie."
            : "Kon Entra account niet verwijderen. Controleer de Entra Graph configuratie op de server.",
        )
        return
      }

      await deleteEncryptedUploadsByPrefix({ prefix: `${user.userId}/` })
      await execute(`delete from public.users where id = $1`, [user.userId])
      res.status(200).json({ ok: true })
    }),
  )
}
