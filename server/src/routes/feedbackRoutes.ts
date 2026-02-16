import crypto from "crypto"
import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { isAdminEmail, normalizeEmail } from "../admin"
import { execute, queryMany } from "../db"
import { deleteEntraUserById } from "../entraGraph"
import { asyncHandler, sendError } from "../http"
import { deleteEncryptedUploadsByPrefix } from "../transcription/storage"

type RegisterFeedbackRoutesParams = {
  rateLimitAccount: RequestHandler
}

async function requireAdminUserEmail(req: Parameters<typeof requireAuthenticatedUser>[0]): Promise<string> {
  const user = await requireAuthenticatedUser(req)
  const normalizedUserEmail = normalizeEmail(user.email)
  if (!isAdminEmail(normalizedUserEmail)) {
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
          id,
          user_id,
          name,
          email,
          phone,
          message,
          created_at,
          account_email
        from public.contact_submissions
        order by created_at desc
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
