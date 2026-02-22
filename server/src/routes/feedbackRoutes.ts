import crypto from "crypto"
import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { cancelMollieSubscriptionForUser, isMollieConfigured, syncMollieSubscriptionForUser, syncRecentMolliePaymentsForUser } from "../billing/mollie"
import { ensureBillingUser, readBillingStatus } from "../billing/store"
import { isAdminEmail, normalizeEmail } from "../admin"
import { execute, queryMany } from "../db"
import { deleteEntraUserById } from "../entraGraph"
import { asyncHandler, sendError } from "../http"
import { deleteEncryptedUploadsByPrefix } from "../transcription/storage"

type RegisterFeedbackRoutesParams = {
  rateLimitAccount: RequestHandler
}

type AccountType = "admin" | "paid" | "test"

let ensureContactSubmissionsTablePromise: Promise<void> | null = null
let ensurePraktijkRequestsCompatibilityPromise: Promise<void> | null = null
let ensureContactSubmissionsCompatibilityPromise: Promise<void> | null = null
let ensureAdminBillingGrantsTablePromise: Promise<void> | null = null
let ensureManualPricingSchemaPromise: Promise<void> | null = null
let ensureManagedPlansPromise: Promise<void> | null = null

const managedPlanDefaults: Array<{ name: string; monthlyPrice: number; minutesPerMonth: number; description: string | null }> = [
  { name: "Plan 1", monthlyPrice: 0, minutesPerMonth: 1200, description: null },
  { name: "Plan 2", monthlyPrice: 0, minutesPerMonth: 3000, description: null },
  { name: "Plan 3", monthlyPrice: 0, minutesPerMonth: 6000, description: null },
]

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

async function ensureAdminBillingGrantsTable(): Promise<void> {
  if (!ensureAdminBillingGrantsTablePromise) {
    ensureAdminBillingGrantsTablePromise = execute(
      `
      create table if not exists public.admin_billing_grants (
        id uuid primary key,
        admin_email text not null,
        target_user_id uuid not null references public.users (id) on delete cascade,
        target_account_email text,
        granted_seconds integer not null,
        created_at timestamptz not null default now(),
        constraint admin_billing_grants_admin_email_length check (char_length(admin_email) > 0 and char_length(admin_email) <= 320),
        constraint admin_billing_grants_target_account_email_length check (target_account_email is null or char_length(target_account_email) <= 320),
        constraint admin_billing_grants_granted_seconds_positive check (granted_seconds > 0)
      );
      create index if not exists admin_billing_grants_target_user_id_idx on public.admin_billing_grants (target_user_id, created_at desc);
      `,
      [],
    ).catch((error) => {
      ensureAdminBillingGrantsTablePromise = null
      throw error
    })
  }
  await ensureAdminBillingGrantsTablePromise
}

async function ensureManualPricingSchema(): Promise<void> {
  if (!ensureManualPricingSchemaPromise) {
    ensureManualPricingSchemaPromise = execute(
      `
      create table if not exists public.plans (
        id uuid primary key,
        name text not null,
        description text,
        monthly_price numeric(10, 2) not null,
        minutes_per_month integer not null,
        is_active boolean not null default true,
        display_order integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create index if not exists plans_active_order_idx on public.plans (is_active, display_order asc, created_at asc);

      alter table public.users
        add column if not exists plan_id uuid references public.plans (id),
        add column if not exists custom_monthly_price numeric(10, 2),
        add column if not exists extra_minutes integer not null default 0,
        add column if not exists account_type text not null default 'paid',
        add column if not exists is_allowlisted boolean not null default true,
        add column if not exists can_see_pricing_page boolean not null default true,
        add column if not exists admin_notes text,
        add column if not exists pilot_flag boolean not null default false;

      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'users_extra_minutes_non_negative'
        ) then
          alter table public.users
            add constraint users_extra_minutes_non_negative check (extra_minutes >= 0);
        end if;
      end
      $$;

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

      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'users_custom_monthly_price_non_negative'
        ) then
          alter table public.users
            add constraint users_custom_monthly_price_non_negative check (custom_monthly_price is null or custom_monthly_price >= 0);
        end if;
      end
      $$;
      `,
      [],
    ).catch((error) => {
      ensureManualPricingSchemaPromise = null
      throw error
    })
  }

  await ensureManualPricingSchemaPromise
}

async function ensureManagedPlans(): Promise<void> {
  await ensureManualPricingSchema()
  if (!ensureManagedPlansPromise) {
    ensureManagedPlansPromise = (async () => {
      const existing = await queryMany<{ id: string }>(
        `
        select id
        from public.plans
        order by display_order asc, created_at asc
        `,
        [],
      )

      if (existing.length < managedPlanDefaults.length) {
        for (let index = existing.length; index < managedPlanDefaults.length; index += 1) {
          const defaults = managedPlanDefaults[index]
          await execute(
            `
            insert into public.plans (
              id,
              name,
              description,
              monthly_price,
              minutes_per_month,
              is_active,
              display_order,
              created_at,
              updated_at
            )
            values ($1, $2, $3, $4, $5, true, $6, now(), now())
            `,
            [crypto.randomUUID(), defaults.name, defaults.description, defaults.monthlyPrice, defaults.minutesPerMonth, index],
          )
        }
      }

      const rows = await queryMany<{ id: string }>(
        `
        select id
        from public.plans
        order by display_order asc, created_at asc
        `,
        [],
      )
      const managedIds = rows.slice(0, 3).map((row) => row.id)
      const extraIds = rows.slice(3).map((row) => row.id)

      for (let index = 0; index < managedIds.length; index += 1) {
        await execute(
          `
          update public.plans
          set display_order = $1,
              is_active = true,
              updated_at = now()
          where id = $2
          `,
          [index, managedIds[index]],
        )
      }

      if (extraIds.length > 0) {
        await execute(
          `
          update public.plans
          set is_active = false,
              updated_at = now()
          where id = any($1::uuid[])
          `,
          [extraIds],
        )
      }
    })().catch((error) => {
      ensureManagedPlansPromise = null
      throw error
    })
  }
  await ensureManagedPlansPromise
}

async function requireAdminUserEmail(req: Parameters<typeof requireAuthenticatedUser>[0]): Promise<string> {
  const user = await requireAuthenticatedUser(req)
  const normalizedUserEmail = normalizeEmail(user.email)
  const hasAdminRole = user.accountType === "admin"
  const isBootstrapAdmin = isAdminEmail(normalizedUserEmail)
  if (!hasAdminRole && !isBootstrapAdmin) {
    console.log("[admin] forbidden", {
      method: req.method,
      path: req.path,
      userEmail: normalizedUserEmail,
      requiredRole: "account_type=admin",
    })
    const error: any = new Error("Forbidden")
    error.status = 403
    throw error as Error
  }
  return normalizedUserEmail || `admin:${user.userId}`
}

function parseAccountType(value: unknown): AccountType | null {
  return value === "admin" || value === "paid" || value === "test" ? value : null
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function formatPrice(value: number | null): number | null {
  if (value == null) return null
  return Math.round(value * 100) / 100
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
    "/admin/plans/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const rows = await queryMany<{
        id: string
        name: string
        description: string | null
        monthly_price: string
        minutes_per_month: number
        is_active: boolean
        display_order: number
      }>(
        `
        select id, name, description, monthly_price, minutes_per_month, is_active, display_order
        from public.plans
        order by display_order asc, created_at asc
        limit 3
        `,
        [],
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          monthlyPrice: Number(row.monthly_price),
          minutesPerMonth: row.minutes_per_month,
          isActive: row.is_active,
          displayOrder: row.display_order,
        })),
      })
    }),
  )

  app.post(
    "/admin/plans/upsert",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const planIdRaw = typeof req.body?.id === "string" ? req.body.id.trim() : ""
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
      const descriptionRaw = typeof req.body?.description === "string" ? req.body.description.trim() : ""
      const monthlyPrice = toNumberOrNull(req.body?.monthlyPrice)
      const minutesPerMonthRaw = Number(req.body?.minutesPerMonth)

      if (!name) {
        sendError(res, 400, "Missing name")
        return
      }
      if (monthlyPrice == null || monthlyPrice < 0) {
        sendError(res, 400, "Invalid monthlyPrice")
        return
      }
      if (!Number.isFinite(minutesPerMonthRaw) || minutesPerMonthRaw < 0) {
        sendError(res, 400, "Invalid minutesPerMonth")
        return
      }
      const minutesPerMonth = Math.trunc(minutesPerMonthRaw)
      const description = descriptionRaw || null

      if (planIdRaw) {
        const managedPlanIds = await queryMany<{ id: string }>(
          `
          select id
          from public.plans
          order by display_order asc, created_at asc
          limit 3
          `,
          [],
        )
        if (!managedPlanIds.some((row) => row.id === planIdRaw)) {
          sendError(res, 400, "Only the 3 managed plans can be updated")
          return
        }

        await execute(
          `
          update public.plans
          set name = $1,
              description = $2,
              monthly_price = $3,
              minutes_per_month = $4,
              is_active = true,
              updated_at = now()
          where id = $5
          `,
          [
            name,
            description,
            formatPrice(monthlyPrice),
            minutesPerMonth,
            planIdRaw,
          ],
        )
      } else {
        sendError(res, 400, "Creating additional plans is disabled. Exactly 3 managed plans are supported.")
        return
      }

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/admin/plans/reorder",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }
      sendError(res, 400, "Plan reorder is disabled. Use the 3 managed plans.")
    }),
  )

  app.post(
    "/admin/plans/set-active",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }
      sendError(res, 400, "Plan activation is disabled. The 3 managed plans are always active.")
    }),
  )

  app.post(
    "/admin/users/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const allowlistedEmails = await queryMany<{ email: string }>(
        `
        select email
        from public.signup_email_allowlist
        `,
        [],
      )
      for (const item of allowlistedEmails) {
        const candidateEmail = normalizeEmail(item.email)
        if (!candidateEmail) continue
        await execute(
          `
          insert into public.users (
            id,
            email,
            entra_user_id,
            display_name,
            account_type,
            is_allowlisted,
            can_see_pricing_page,
            extra_minutes,
            pilot_flag,
            created_at,
            updated_at
          )
          select
            $1,
            $2,
            null,
            null,
            'paid',
            true,
            true,
            0,
            false,
            now(),
            now()
          where not exists (
            select 1
            from public.users
            where lower(email) = $2
          )
          `,
          [crypto.randomUUID(), candidateEmail],
        )
      }

      const rows = await queryMany<{
        id: string
        email: string | null
        display_name: string | null
        plan_id: string | null
        custom_monthly_price: string | null
        extra_minutes: number
        account_type: AccountType
        is_allowlisted: boolean
        can_see_pricing_page: boolean
        admin_notes: string | null
        pilot_flag: boolean
        plan_name: string | null
        plan_minutes_per_month: number | null
      }>(
        `
        select
          u.id,
          u.email,
          u.display_name,
          u.plan_id,
          u.custom_monthly_price,
          coalesce(u.extra_minutes, 0) as extra_minutes,
          u.account_type,
          coalesce(u.is_allowlisted, true) as is_allowlisted,
          coalesce(u.can_see_pricing_page, true) as can_see_pricing_page,
          u.admin_notes,
          coalesce(u.pilot_flag, false) as pilot_flag,
          p.name as plan_name,
          p.minutes_per_month as plan_minutes_per_month
        from public.users u
        left join public.plans p on p.id = u.plan_id
        order by lower(coalesce(u.email, '')), u.created_at desc
        `,
        [],
      )

      res.status(200).json({
        items: rows.map((row) => {
          const includedMinutes = Number(row.plan_minutes_per_month || 0)
          const extraMinutes = Number(row.extra_minutes || 0)
          return {
            userId: row.id,
            email: row.email,
            displayName: row.display_name,
            planId: row.plan_id,
            customMonthlyPrice: row.custom_monthly_price == null ? null : Number(row.custom_monthly_price),
            extraMinutes,
            accountType: row.account_type,
            isAllowlisted: row.is_allowlisted,
            canSeePricingPage: row.can_see_pricing_page,
            adminNotes: row.admin_notes,
            pilotFlag: row.pilot_flag,
            planName: row.plan_name,
            availableMinutesPerMonth: includedMinutes + extraMinutes,
          }
        }),
      })
    }),
  )

  app.post(
    "/admin/users/update-pricing-controls",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      const adminEmail = await requireAdminUserEmail(req).catch(() => null)
      if (!adminEmail) {
        sendError(res, 403, "Forbidden")
        return
      }

      const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : ""
      const planIdRaw = typeof req.body?.planId === "string" ? req.body.planId.trim() : ""
      const customMonthlyPriceRaw = req.body?.customMonthlyPrice
      const extraMinutesRaw = Number(req.body?.extraMinutes)
      const accountType = parseAccountType(req.body?.accountType)
      const isAllowlisted = Boolean(req.body?.isAllowlisted)
      const canSeePricingPage = Boolean(req.body?.canSeePricingPage)
      const pilotFlag = Boolean(req.body?.pilotFlag)
      const adminNotesRaw = typeof req.body?.adminNotes === "string" ? req.body.adminNotes.trim() : ""

      if (!userId) {
        sendError(res, 400, "Missing userId")
        return
      }
      if (!accountType) {
        sendError(res, 400, "Invalid accountType")
        return
      }
      if (!Number.isFinite(extraMinutesRaw) || extraMinutesRaw < 0) {
        sendError(res, 400, "Invalid extraMinutes")
        return
      }
      const extraMinutes = Math.trunc(extraMinutesRaw)
      const customMonthlyPrice = customMonthlyPriceRaw == null || customMonthlyPriceRaw === ""
        ? null
        : toNumberOrNull(customMonthlyPriceRaw)
      if (customMonthlyPrice != null && customMonthlyPrice < 0) {
        sendError(res, 400, "Invalid customMonthlyPrice")
        return
      }

      const targetUser = (
        await queryMany<{ id: string; email: string | null }>(
          `
          select id, email
          from public.users
          where id = $1
          limit 1
          `,
          [userId],
        )
      )[0]

      if (!targetUser?.id) {
        sendError(res, 404, "User not found")
        return
      }

      // Custom pricing and predefined plan selection are mutually exclusive.
      const planId = customMonthlyPrice != null ? null : (planIdRaw || null)
      if (planId) {
        const foundPlan = await queryMany<{ id: string }>(
          `
          select id
          from public.plans
          where id = $1
          order by display_order asc, created_at asc
          limit 3
          `,
          [planId],
        )
        if (!foundPlan[0]?.id) {
          sendError(res, 400, "Invalid planId")
          return
        }
      }

      await execute(
        `
        update public.users
        set plan_id = $1,
            custom_monthly_price = $2,
            extra_minutes = $3,
            account_type = $4,
            is_allowlisted = $5,
            can_see_pricing_page = $6,
            admin_notes = $7,
            pilot_flag = $8,
            updated_at = now()
        where id = $9
        `,
        [planId, formatPrice(customMonthlyPrice), extraMinutes, accountType, isAllowlisted, canSeePricingPage, adminNotesRaw || null, pilotFlag, userId],
      )

      const targetEmail = normalizeEmail(targetUser.email)
      if (targetEmail) {
        if (isAllowlisted) {
          await execute(
            `
            insert into public.signup_email_allowlist (id, email, added_by_email)
            values ($1, $2, $3)
            on conflict (email) do update
              set added_by_email = excluded.added_by_email
            `,
            [crypto.randomUUID(), targetEmail, adminEmail],
          )
        } else {
          await execute(
            `
            delete from public.signup_email_allowlist
            where lower(email) = $1
            `,
            [targetEmail],
          )
        }
      }

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/pricing/plans/public",
    params.rateLimitAccount,
    asyncHandler(async (_req, res) => {
      await ensureManagedPlans()
      const rows = await queryMany<{
        id: string
        name: string
        description: string | null
        monthly_price: string
        minutes_per_month: number
        display_order: number
      }>(
        `
        select id, name, description, monthly_price, minutes_per_month, display_order
        from public.plans
        order by display_order asc, created_at asc
        limit 3
        `,
        [],
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          monthlyPrice: Number(row.monthly_price),
          minutesPerMonth: row.minutes_per_month,
          displayOrder: row.display_order,
        })),
      })
    }),
  )

  app.post(
    "/pricing/me-visibility",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManagedPlans()
      const hasAuthorizationHeader = String(req.headers.authorization || "").trim().length > 0
      if (!hasAuthorizationHeader) {
        res.status(200).json({
          isAuthenticated: false,
          canSeePricingPage: true,
          accountType: null,
          planId: null,
          customMonthlyPrice: null,
          extraMinutes: 0,
          availableMinutesPerMonth: 0,
        })
        return
      }

      const user = await requireAuthenticatedUser(req).catch(() => null)
      if (!user) {
        sendError(res, 401, "Unauthorized")
        return
      }

      if (isMollieConfigured()) {
        try {
          await syncRecentMolliePaymentsForUser(user.userId)
          await syncMollieSubscriptionForUser(user.userId)
        } catch (error: any) {
          const message = String(error?.message || error || "")
          console.warn("[pricing:me-visibility] mollie sync failed; continuing with existing pricing visibility", {
            userId: user.userId,
            message,
          })
        }
      }

      const row = (
        await queryMany<{
          plan_id: string | null
          custom_monthly_price: string | null
          extra_minutes: number
          account_type: AccountType
          can_see_pricing_page: boolean
          plan_minutes_per_month: number | null
        }>(
          `
          select
            u.plan_id,
            u.custom_monthly_price,
            coalesce(u.extra_minutes, 0) as extra_minutes,
            u.account_type,
            coalesce(u.can_see_pricing_page, true) as can_see_pricing_page,
            p.minutes_per_month as plan_minutes_per_month
          from public.users u
          left join public.plans p on p.id = u.plan_id
          where u.id = $1
          limit 1
          `,
          [user.userId],
        )
      )[0]

      if (!row) {
        res.status(200).json({
          isAuthenticated: true,
          canSeePricingPage: true,
          accountType: null,
          planId: null,
          customMonthlyPrice: null,
          extraMinutes: 0,
          availableMinutesPerMonth: 0,
        })
        return
      }

      const availableMinutes = Number(row.plan_minutes_per_month || 0) + Number(row.extra_minutes || 0)
      const canSeePricingPage = row.account_type !== "test" && row.can_see_pricing_page

      res.status(200).json({
        isAuthenticated: true,
        canSeePricingPage,
        accountType: row.account_type,
        planId: row.plan_id,
        customMonthlyPrice: row.custom_monthly_price == null ? null : Number(row.custom_monthly_price),
        extraMinutes: row.extra_minutes,
        availableMinutesPerMonth: availableMinutes,
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
      await ensureManualPricingSchema()
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
      await execute(
        `
        insert into public.users (
          id,
          email,
          entra_user_id,
          display_name,
          account_type,
          is_allowlisted,
          can_see_pricing_page,
          extra_minutes,
          pilot_flag,
          created_at,
          updated_at
        )
        select
          $1,
          $2,
          null,
          null,
          'paid',
          true,
          true,
          0,
          false,
          now(),
          now()
        where not exists (
          select 1
          from public.users
          where lower(email) = $2
        )
        `,
        [crypto.randomUUID(), candidateEmail],
      )
      await execute(
        `
        update public.users
        set is_allowlisted = true,
            updated_at = now()
        where lower(email) = $1
        `,
        [candidateEmail],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/admin/account-allowlist/remove",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureManualPricingSchema()
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
      await execute(
        `
        update public.users
        set is_allowlisted = false,
            updated_at = now()
        where lower(email) = $1
        `,
        [candidateEmail],
      )

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/admin/billing/grant-minutes",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureAdminBillingGrantsTable()
      const adminEmail = await requireAdminUserEmail(req).catch(() => null)
      if (!adminEmail) {
        sendError(res, 403, "Forbidden")
        return
      }

      const userIdOrEmail = String(req.body?.userIdOrEmail || "").trim()
      if (!userIdOrEmail) {
        sendError(res, 400, "Missing userIdOrEmail")
        return
      }

      const minutesRaw = Number(req.body?.minutes)
      if (!Number.isFinite(minutesRaw) || minutesRaw <= 0) {
        sendError(res, 400, "Invalid minutes")
        return
      }

      const grantedSeconds = Math.round(minutesRaw * 60)
      if (grantedSeconds <= 0 || grantedSeconds > 31_536_000) {
        sendError(res, 400, "Invalid minutes")
        return
      }

      const normalizedLookup = normalizeEmail(userIdOrEmail)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdOrEmail)

      const targetUser = isUuid
        ? await queryMany<{ id: string; email: string | null }>(
            `
            select id, email
            from public.users
            where id = $1
            limit 1
            `,
            [userIdOrEmail],
          )
        : await queryMany<{ id: string; email: string | null }>(
            `
            select id, email
            from public.users
            where lower(email) = $1
            limit 1
            `,
            [normalizedLookup],
          )

      const resolvedUser = targetUser[0]
      if (!resolvedUser?.id) {
        sendError(res, 404, "User not found")
        return
      }

      await ensureBillingUser(resolvedUser.id)
      await execute(
        `
        update public.billing_users
        set admin_granted_seconds = admin_granted_seconds + $1,
            updated_at = now()
        where user_id = $2
        `,
        [grantedSeconds, resolvedUser.id],
      )
      await execute(
        `
        insert into public.admin_billing_grants (
          id,
          admin_email,
          target_user_id,
          target_account_email,
          granted_seconds
        )
        values ($1, $2, $3, $4, $5)
        `,
        [crypto.randomUUID(), adminEmail, resolvedUser.id, resolvedUser.email, grantedSeconds],
      )

      const billingStatus = await readBillingStatus({
        userId: resolvedUser.id,
        planKey: null,
        cycleStartMs: null,
        cycleEndMs: null,
      })

      res.status(200).json({
        ok: true,
        targetUserId: resolvedUser.id,
        targetAccountEmail: resolvedUser.email,
        grantedMinutes: grantedSeconds / 60,
        billingStatus,
      })
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
      if (!confirmTextRaw || confirmText !== "VERWIJDEREN") {
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

      if (isMollieConfigured()) {
        try {
          await cancelMollieSubscriptionForUser(user.userId)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.log("[account/delete] Mollie cancellation failed", { userId: user.userId, message })
        }
      }

      await execute(`delete from public.users where id = $1`, [user.userId])
      try {
        await deleteEncryptedUploadsByPrefix({ prefix: `${user.userId}/` })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.log("[account/delete] Blob cleanup failed", { userId: user.userId, message })
      }
      res.status(200).json({ ok: true })
    }),
  )
}
