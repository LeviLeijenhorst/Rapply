import crypto from "crypto"
import type { Express, Request, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { isAdminEmail, normalizeEmail } from "../admin"
import { execute, queryMany } from "../db"
import { asyncHandler, sendError } from "../http"

type RegisterAnalyticsRoutesParams = {
  rateLimitAccount: RequestHandler
  rateLimitPublic: RequestHandler
}

type AnalyticsApp = "website" | "webapp"
type AnalyticsEventType = "visit" | "click" | "ai_message_sent" | "error" | "custom"

type AnalyticsEventInput = {
  type: AnalyticsEventType
  action: string | null
  path: string | null
  anonymousId: string | null
  sessionId: string | null
  metadata: Record<string, unknown>
  occurredAt: string | null
}

let ensureAnalyticsSchemaPromise: Promise<void> | null = null

async function ensureAnalyticsSchema(): Promise<void> {
  if (!ensureAnalyticsSchemaPromise) {
    ensureAnalyticsSchemaPromise = execute(
      `
      create table if not exists public.analytics_events (
        id uuid primary key,
        app text not null,
        event_type text not null,
        action text,
        path text,
        user_id uuid references public.users (id) on delete set null,
        account_email text,
        anonymous_id text,
        session_id text,
        metadata jsonb not null default '{}'::jsonb,
        ip_address text,
        user_agent text,
        occurred_at timestamptz not null default now(),
        created_at timestamptz not null default now(),
        constraint analytics_events_app_allowed check (app in ('website', 'webapp')),
        constraint analytics_events_type_allowed check (event_type in ('visit', 'click', 'ai_message_sent', 'error', 'custom')),
        constraint analytics_events_account_email_length check (account_email is null or char_length(account_email) <= 320)
      );

      create index if not exists analytics_events_occurred_at_idx on public.analytics_events (occurred_at desc);
      create index if not exists analytics_events_app_type_occurred_idx on public.analytics_events (app, event_type, occurred_at desc);
      create index if not exists analytics_events_user_occurred_idx on public.analytics_events (user_id, occurred_at desc);
      `,
      [],
    ).catch((error) => {
      ensureAnalyticsSchemaPromise = null
      throw error
    })
  }
  await ensureAnalyticsSchemaPromise
}

// Startup-safe entrypoint: warm analytics schema once so request paths do not need
// to trigger initial DDL side effects.
export async function prepareAnalyticsRuntimeSchema(): Promise<void> {
  await ensureAnalyticsSchema()
}

async function requireAdminUserEmail(req: Parameters<typeof requireAuthenticatedUser>[0]): Promise<string> {
  const user = await requireAuthenticatedUser(req)
  const normalizedUserEmail = normalizeEmail(user.email)
  const hasAdminRole = user.accountType === "admin"
  const isBootstrapAdmin = isAdminEmail(normalizedUserEmail)
  if (!hasAdminRole && !isBootstrapAdmin) {
    const error: any = new Error("Forbidden")
    error.status = 403
    throw error as Error
  }
  return normalizedUserEmail || `admin:${user.userId}`
}

function parseApp(value: unknown): AnalyticsApp | null {
  return value === "website" || value === "webapp" ? value : null
}

function normalizeOptionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function sanitizeScalar(value: unknown): string | number | boolean | null {
  if (value == null) return null
  if (typeof value === "string") return value.slice(0, 500)
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "boolean") return value
  return null
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const output: Record<string, unknown> = {}
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 30)
  for (const [rawKey, rawValue] of entries) {
    const key = String(rawKey || "").trim().slice(0, 80)
    if (!key) continue

    if (Array.isArray(rawValue)) {
      output[key] = rawValue.slice(0, 12).map((item) => sanitizeScalar(item))
      continue
    }

    const scalar = sanitizeScalar(rawValue)
    if (scalar !== null || rawValue === null) {
      output[key] = scalar
      continue
    }

    if (rawValue && typeof rawValue === "object") {
      output[key] = JSON.stringify(rawValue).slice(0, 500)
      continue
    }
  }
  return output
}

function parseOccurredAt(value: unknown): string | null {
  if (typeof value !== "string") return null
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  return parsed.toISOString()
}

function parseEventInput(value: unknown): AnalyticsEventInput | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>

  const type = raw.type
  if (type !== "visit" && type !== "click" && type !== "ai_message_sent" && type !== "error" && type !== "custom") {
    return null
  }

  return {
    type,
    action: normalizeOptionalString(raw.action, 200),
    path: normalizeOptionalString(raw.path, 500),
    anonymousId: normalizeOptionalString(raw.anonymousId, 120),
    sessionId: normalizeOptionalString(raw.sessionId, 120),
    metadata: sanitizeMetadata(raw.metadata),
    occurredAt: parseOccurredAt(raw.occurredAt),
  }
}

function parseEventInputList(value: unknown): AnalyticsEventInput[] {
  const items = Array.isArray(value) ? value : []
  const parsed = items.map(parseEventInput).filter((item): item is AnalyticsEventInput => !!item)
  return parsed.slice(0, 50)
}

async function insertAnalyticsEvents(params: {
  app: AnalyticsApp
  events: AnalyticsEventInput[]
  userId: string | null
  accountEmail: string | null
  ipAddress: string | null
  userAgent: string | null
}): Promise<void> {
  if (params.events.length === 0) return
  await ensureAnalyticsSchema()

  const nowIso = new Date().toISOString()
  await Promise.all(
    params.events.map((event) =>
      execute(
        `
        insert into public.analytics_events (
          id,
          app,
          event_type,
          action,
          path,
          user_id,
          account_email,
          anonymous_id,
          session_id,
          metadata,
          ip_address,
          user_agent,
          occurred_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13)
        `,
        [
          crypto.randomUUID(),
          params.app,
          event.type,
          event.action,
          event.path,
          params.userId,
          params.accountEmail,
          event.anonymousId,
          event.sessionId,
          JSON.stringify(event.metadata || {}),
          params.ipAddress,
          params.userAgent,
          event.occurredAt || nowIso,
        ],
      ),
    ),
  )
}

function readRequesterContext(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const ipAddress = normalizeOptionalString(req.ip, 120)
  const userAgent = normalizeOptionalString(req.headers["user-agent"], 500)
  return { ipAddress, userAgent }
}

export function registerAnalyticsRoutes(app: Express, params: RegisterAnalyticsRoutesParams): void {
  void prepareAnalyticsRuntimeSchema().catch((error: any) => {
    const message = String(error?.message || error || "")
    console.warn("[analytics] runtime schema warmup failed", { message })
  })

  app.post(
    "/analytics/public/events",
    params.rateLimitPublic,
    asyncHandler(async (req, res) => {
      const analyticsApp = parseApp(req.body?.app)
      if (!analyticsApp) {
        sendError(res, 400, "Invalid app")
        return
      }

      const events = parseEventInputList(req.body?.events)
      if (events.length === 0) {
        sendError(res, 400, "Missing events")
        return
      }

      const requesterContext = readRequesterContext(req)
      await insertAnalyticsEvents({
        app: analyticsApp,
        events,
        userId: null,
        accountEmail: null,
        ipAddress: requesterContext.ipAddress,
        userAgent: requesterContext.userAgent,
      })

      res.status(200).json({ ok: true, accepted: events.length })
    }),
  )

  app.post(
    "/analytics/events",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req).catch(() => null)
      if (!user) {
        sendError(res, 401, "Unauthorized")
        return
      }

      const analyticsApp = parseApp(req.body?.app)
      if (!analyticsApp) {
        sendError(res, 400, "Invalid app")
        return
      }

      const events = parseEventInputList(req.body?.events)
      if (events.length === 0) {
        sendError(res, 400, "Missing events")
        return
      }

      const requesterContext = readRequesterContext(req)
      await insertAnalyticsEvents({
        app: analyticsApp,
        events,
        userId: user.userId,
        accountEmail: normalizeEmail(user.email) || null,
        ipAddress: requesterContext.ipAddress,
        userAgent: requesterContext.userAgent,
      })

      res.status(200).json({ ok: true, accepted: events.length })
    }),
  )

  app.post(
    "/admin/analytics/overview",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureAnalyticsSchema()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const requestedDaysRaw = Number(req.body?.days)
      const windowDays = Number.isFinite(requestedDaysRaw) ? Math.min(365, Math.max(1, Math.trunc(requestedDaysRaw))) : 30
      const sinceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

      const counterRow = (
        await queryMany<{
          website_visits: string
          website_clicks: string
          webapp_visits: string
          webapp_clicks: string
          webapp_ai_messages: string
          webapp_errors: string
        }>(
          `
          select
            count(*) filter (where app = 'website' and event_type = 'visit')::text as website_visits,
            count(*) filter (where app = 'website' and event_type = 'click')::text as website_clicks,
            count(*) filter (where app = 'webapp' and event_type = 'visit')::text as webapp_visits,
            count(*) filter (where app = 'webapp' and event_type = 'click')::text as webapp_clicks,
            count(*) filter (where app = 'webapp' and event_type = 'ai_message_sent')::text as webapp_ai_messages,
            count(*) filter (where app = 'webapp' and event_type = 'error')::text as webapp_errors
          from public.analytics_events
          where occurred_at >= $1
          `,
          [sinceDate],
        )
      )[0]

      const minuteRows = await queryMany<{
        id: string
        email: string | null
        display_name: string | null
        total_audio_seconds: string
      }>(
        `
        select
          u.id,
          u.email,
          u.display_name,
          coalesce(sum(coalesce(s.audio_duration_seconds, 0)), 0)::text as total_audio_seconds
        from public.users u
        left join public.sessions s on s.owner_user_id = u.id
        group by u.id, u.email, u.display_name
        order by coalesce(sum(coalesce(s.audio_duration_seconds, 0)), 0) desc, lower(coalesce(u.email, '')) asc
        `,
        [],
      )

      const recentEventRows = await queryMany<{
        id: string
        app: AnalyticsApp
        event_type: AnalyticsEventType
        action: string | null
        path: string | null
        user_id: string | null
        account_email: string | null
        anonymous_id: string | null
        session_id: string | null
        metadata: Record<string, unknown> | null
        occurred_at: string
      }>(
        `
        select
          id,
          app,
          event_type,
          action,
          path,
          user_id,
          account_email,
          anonymous_id,
          session_id,
          metadata,
          occurred_at
        from public.analytics_events
        where occurred_at >= $1
        order by occurred_at desc
        limit 200
        `,
        [sinceDate],
      )

      res.status(200).json({
        windowDays,
        counters: {
          websiteVisits: Number(counterRow?.website_visits || 0),
          websiteClicks: Number(counterRow?.website_clicks || 0),
          webappVisits: Number(counterRow?.webapp_visits || 0),
          webappClicks: Number(counterRow?.webapp_clicks || 0),
          webappAiMessages: Number(counterRow?.webapp_ai_messages || 0),
          webappErrors: Number(counterRow?.webapp_errors || 0),
        },
        perUserMinutes: minuteRows.map((row) => ({
          userId: row.id,
          email: row.email,
          displayName: row.display_name,
          totalMinutes: Math.round(Number(row.total_audio_seconds || 0) / 60),
        })),
        recentEvents: recentEventRows.map((row) => ({
          id: row.id,
          app: row.app,
          type: row.event_type,
          action: row.action,
          path: row.path,
          userId: row.user_id,
          accountEmail: row.account_email,
          anonymousId: row.anonymous_id,
          sessionId: row.session_id,
          metadata: row.metadata || {},
          occurredAt: row.occurred_at,
        })),
      })
    }),
  )

  app.post(
    "/admin/analytics/events/list",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      await ensureAnalyticsSchema()
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const limitRaw = Number(req.body?.limit)
      const limit = Number.isFinite(limitRaw) ? Math.min(500, Math.max(1, Math.trunc(limitRaw))) : 200
      const filterApp = parseApp(req.body?.app)
      const filterType = normalizeOptionalString(req.body?.type, 40)
      const filterUserId = normalizeOptionalString(req.body?.userId, 120)

      const whereClauses: string[] = []
      const values: unknown[] = []

      if (filterApp) {
        values.push(filterApp)
        whereClauses.push(`app = $${values.length}`)
      }
      if (filterType === "visit" || filterType === "click" || filterType === "ai_message_sent" || filterType === "error" || filterType === "custom") {
        values.push(filterType)
        whereClauses.push(`event_type = $${values.length}`)
      }
      if (filterUserId) {
        values.push(filterUserId)
        whereClauses.push(`user_id = $${values.length}`)
      }

      values.push(limit)

      const rows = await queryMany<{
        id: string
        app: AnalyticsApp
        event_type: AnalyticsEventType
        action: string | null
        path: string | null
        user_id: string | null
        account_email: string | null
        anonymous_id: string | null
        session_id: string | null
        metadata: Record<string, unknown> | null
        occurred_at: string
      }>(
        `
        select
          id,
          app,
          event_type,
          action,
          path,
          user_id,
          account_email,
          anonymous_id,
          session_id,
          metadata,
          occurred_at
        from public.analytics_events
        ${whereClauses.length ? `where ${whereClauses.join(" and ")}` : ""}
        order by occurred_at desc
        limit $${values.length}
        `,
        values,
      )

      res.status(200).json({
        items: rows.map((row) => ({
          id: row.id,
          app: row.app,
          type: row.event_type,
          action: row.action,
          path: row.path,
          userId: row.user_id,
          accountEmail: row.account_email,
          anonymousId: row.anonymous_id,
          sessionId: row.session_id,
          metadata: row.metadata || {},
          occurredAt: row.occurred_at,
        })),
      })
    }),
  )
}
