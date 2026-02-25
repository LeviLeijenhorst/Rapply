import crypto from "crypto"
import { execute, queryMany, queryOne } from "../db"
import { env } from "../env"
import { extraTranscriptionSecondsPerPurchase } from "./constants"

type MollieAmount = {
  currency: string
  value: string
}

type MolliePayment = {
  id: string
  status: string
  sequenceType?: string | null
  customerId?: string | null
  subscriptionId?: string | null
  amount?: MollieAmount | null
  description?: string | null
  paidAt?: string | null
  _links?: {
    checkout?: { href?: string }
  }
  metadata?: Record<string, unknown> | null
}

type MollieSubscription = {
  id: string
  status: string
  nextPaymentDate?: string | null
}

let ensureMollieSchemaPromise: Promise<void> | null = null

function optionalTrimmed(value: string | null | undefined): string | null {
  const trimmed = String(value || "").trim()
  return trimmed || null
}

function requireMollieApiKey(): string {
  const apiKey = optionalTrimmed(env.mollieApiKey)
  if (!apiKey) {
    throw new Error("Mollie is not configured (missing MOLLIE_API_KEY)")
  }
  return apiKey
}

function requireMollieWebhookUrl(): string {
  const webhookUrl = optionalTrimmed(env.mollieWebhookUrl)
  if (!webhookUrl) {
    throw new Error("Mollie is not configured (missing MOLLIE_WEBHOOK_URL)")
  }
  return webhookUrl
}

function normalizeAmountValue(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount")
  }
  return (Math.round(amount * 100) / 100).toFixed(2)
}

async function mollieApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = requireMollieApiKey()
  const response = await fetch(`https://api.mollie.com/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const json: any = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = String(json?.detail || json?.title || json?.error || "Mollie API request failed")
    throw new Error(detail)
  }
  return json as T
}

async function ensureMollieSchema(): Promise<void> {
  if (!ensureMollieSchemaPromise) {
    ensureMollieSchemaPromise = execute(
      `
      create table if not exists public.mollie_customers (
        user_id uuid primary key references public.users (id) on delete cascade,
        mollie_customer_id text not null unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint mollie_customers_customer_id_length check (char_length(mollie_customer_id) > 0 and char_length(mollie_customer_id) <= 100)
      );

      create table if not exists public.mollie_subscriptions (
        user_id uuid primary key references public.users (id) on delete cascade,
        mollie_customer_id text not null,
        mollie_subscription_id text not null,
        plan_id uuid references public.plans (id) on delete set null,
        status text not null,
        next_payment_date date,
        canceled_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint mollie_subscriptions_customer_id_length check (char_length(mollie_customer_id) > 0 and char_length(mollie_customer_id) <= 100),
        constraint mollie_subscriptions_subscription_id_length check (char_length(mollie_subscription_id) > 0 and char_length(mollie_subscription_id) <= 100),
        constraint mollie_subscriptions_status_length check (char_length(status) > 0 and char_length(status) <= 50)
      );

      create unique index if not exists mollie_subscriptions_unique_remote_idx
      on public.mollie_subscriptions (mollie_customer_id, mollie_subscription_id);

      create table if not exists public.mollie_payments (
        id uuid primary key,
        user_id uuid references public.users (id) on delete set null,
        plan_id uuid references public.plans (id) on delete set null,
        mollie_payment_id text not null unique,
        status text not null,
        sequence_type text,
        amount_value numeric(10, 2),
        currency text,
        checkout_url text,
        metadata jsonb,
        paid_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint mollie_payments_payment_id_length check (char_length(mollie_payment_id) > 0 and char_length(mollie_payment_id) <= 100),
        constraint mollie_payments_status_length check (char_length(status) > 0 and char_length(status) <= 50),
        constraint mollie_payments_amount_non_negative check (amount_value is null or amount_value >= 0)
      );
      `,
      [],
    ).catch((error) => {
      ensureMollieSchemaPromise = null
      throw error
    })
  }
  await ensureMollieSchemaPromise
}

async function readPlanSummary(planId: string): Promise<{ id: string; name: string; monthlyPrice: number } | null> {
  const row = await queryOne<{ id: string; name: string; monthly_price: string }>(
    `
    select id, name, monthly_price
    from public.plans
    where id = $1 and is_active = true
    limit 1
    `,
    [planId],
  )
  if (!row?.id) return null
  return {
    id: row.id,
    name: row.name,
    monthlyPrice: Number(row.monthly_price),
  }
}

async function readFallbackExtraTranscriptionOneTimePriceEur(): Promise<number | null> {
  const row = await queryOne<{ monthly_price: string; minutes_per_month: number }>(
    `
    select monthly_price, minutes_per_month
    from public.plans
    where is_active = true
      and monthly_price > 0
      and minutes_per_month > 0
    order by monthly_price asc
    limit 1
    `,
    [],
  )

  const monthlyPrice = Number(row?.monthly_price ?? NaN)
  const monthlyMinutes = Number(row?.minutes_per_month ?? NaN)
  if (!Number.isFinite(monthlyPrice) || !Number.isFinite(monthlyMinutes) || monthlyPrice <= 0 || monthlyMinutes <= 0) {
    return null
  }

  const oneTimeMinutes = extraTranscriptionSecondsPerPurchase / 60
  const perMinutePrice = monthlyPrice / monthlyMinutes
  const amount = Math.round(perMinutePrice * oneTimeMinutes * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}

async function getExtraTranscriptionOneTimePriceEur(): Promise<number> {
  const configured = Number(env.extraTranscriptionOneTimePriceEur ?? NaN)
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }

  const derived = await readFallbackExtraTranscriptionOneTimePriceEur()
  if (derived && derived > 0) {
    return derived
  }

  throw new Error("Cannot determine one-time transcription price; set EXTRA_TRANSCRIPTION_ONE_TIME_PRICE_EUR")
}

async function ensureCustomerForUser(params: {
  userId: string
  email: string | null
  displayName: string | null
}): Promise<string> {
  await ensureMollieSchema()

  const existing = await queryOne<{ mollie_customer_id: string }>(
    `
    select mollie_customer_id
    from public.mollie_customers
    where user_id = $1
    limit 1
    `,
    [params.userId],
  )
  if (existing?.mollie_customer_id) {
    return existing.mollie_customer_id
  }

  const customer = await mollieApiRequest<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      email: optionalTrimmed(params.email) || undefined,
      name: optionalTrimmed(params.displayName) || optionalTrimmed(params.email) || undefined,
      metadata: { userId: params.userId },
    }),
  })

  await execute(
    `
    insert into public.mollie_customers (user_id, mollie_customer_id, created_at, updated_at)
    values ($1, $2, now(), now())
    on conflict (user_id) do update
      set mollie_customer_id = excluded.mollie_customer_id,
          updated_at = now()
    `,
    [params.userId, customer.id],
  )

  return customer.id
}

export function isMollieConfigured(): boolean {
  return Boolean(optionalTrimmed(env.mollieApiKey))
}

export async function createMolliePlanCheckout(params: {
  userId: string
  email: string | null
  displayName: string | null
  planId: string
}): Promise<{ checkoutUrl: string; paymentId: string; requiresRedirect: boolean }> {
  await ensureMollieSchema()

  const redirectUrl = optionalTrimmed(env.mollieRedirectUrl)
  if (!redirectUrl) {
    throw new Error("Missing MOLLIE_REDIRECT_URL")
  }

  const webhookUrl = requireMollieWebhookUrl()
  const plan = await readPlanSummary(params.planId)
  if (!plan) {
    throw new Error("Invalid plan")
  }
  if (!(plan.monthlyPrice > 0)) {
    throw new Error("Selected plan has no payable amount")
  }

  const customerId = await ensureCustomerForUser({
    userId: params.userId,
    email: params.email,
    displayName: params.displayName,
  })

  const existingSubscription = await readSubscriptionContextForUser(params.userId)
  const canTreatAsUpgrade =
    existingSubscription &&
    isSubscriptionActiveStatus(existingSubscription.status) &&
    optionalTrimmed(existingSubscription.planId) != null &&
    optionalTrimmed(existingSubscription.planId) !== params.planId &&
    Number.isFinite(existingSubscription.currentPlanMonthlyPrice) &&
    Number(existingSubscription.currentPlanMonthlyPrice) >= 0 &&
    plan.monthlyPrice > Number(existingSubscription.currentPlanMonthlyPrice)
  const checkoutAmount = canTreatAsUpgrade
    ? Math.max(0, plan.monthlyPrice - Number(existingSubscription.currentPlanMonthlyPrice || 0))
    : plan.monthlyPrice
  if (checkoutAmount <= 0) {
    throw new Error("Selected plan change does not require checkout")
  }
  const metadata: Record<string, unknown> = canTreatAsUpgrade
    ? {
        userId: params.userId,
        planId: params.planId,
        kind: "subscription_upgrade_difference",
        previousPlanId: existingSubscription?.planId ?? null,
        previousCustomerId: existingSubscription?.customerId ?? null,
        previousSubscriptionId: existingSubscription?.subscriptionId ?? null,
        nextPaymentDate: existingSubscription?.nextPaymentDate ?? null,
      }
    : {
        userId: params.userId,
        planId: params.planId,
        kind: "subscription_first_payment",
      }

  const payment = await mollieApiRequest<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: normalizeAmountValue(checkoutAmount),
      },
      sequenceType: "first",
      customerId,
      locale: "nl_NL",
      description: `Coachscribe ${plan.name}`,
      redirectUrl,
      webhookUrl,
      metadata,
    }),
  })

  const checkoutUrl = String(payment?._links?.checkout?.href || "").trim()
  if (!checkoutUrl) {
    throw new Error("Mollie checkout URL ontbreekt")
  }

  await execute(
    `
    insert into public.mollie_payments (
      id,
      user_id,
      plan_id,
      mollie_payment_id,
      status,
      sequence_type,
      amount_value,
      currency,
      checkout_url,
      metadata,
      created_at,
      updated_at
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, now(), now())
    on conflict (mollie_payment_id) do update
      set user_id = excluded.user_id,
          plan_id = excluded.plan_id,
          status = excluded.status,
          sequence_type = excluded.sequence_type,
          amount_value = excluded.amount_value,
          currency = excluded.currency,
          checkout_url = excluded.checkout_url,
          metadata = excluded.metadata,
          updated_at = now()
    `,
    [
      crypto.randomUUID(),
      params.userId,
      params.planId,
      payment.id,
      payment.status || "open",
      optionalTrimmed(payment.sequenceType || null),
      payment.amount?.value ? Number(payment.amount.value) : checkoutAmount,
      optionalTrimmed(payment.amount?.currency || "EUR"),
      checkoutUrl,
      JSON.stringify(metadata),
    ],
  )

  return { checkoutUrl, paymentId: payment.id, requiresRedirect: true }
}

export async function createMollieExtraMinutesCheckout(params: {
  userId: string
  email: string | null
  displayName: string | null
}): Promise<{ checkoutUrl: string; paymentId: string; requiresRedirect: boolean }> {
  await ensureMollieSchema()

  const redirectUrl = optionalTrimmed(env.mollieRedirectUrl)
  if (!redirectUrl) {
    throw new Error("Missing MOLLIE_REDIRECT_URL")
  }
  const webhookUrl = requireMollieWebhookUrl()

  const checkoutAmount = await getExtraTranscriptionOneTimePriceEur()
  if (!(checkoutAmount > 0)) {
    throw new Error("One-time purchase amount must be greater than zero")
  }

  const customerId = await ensureCustomerForUser({
    userId: params.userId,
    email: params.email,
    displayName: params.displayName,
  })

  const metadata: Record<string, unknown> = {
    userId: params.userId,
    kind: "one_time_extra_transcription_minutes",
    grantSeconds: extraTranscriptionSecondsPerPurchase,
  }

  const payment = await mollieApiRequest<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: normalizeAmountValue(checkoutAmount),
      },
      customerId,
      locale: "nl_NL",
      description: `Coachscribe extra transcriptieminuten (${Math.floor(extraTranscriptionSecondsPerPurchase / 60)} min)`,
      redirectUrl,
      webhookUrl,
      metadata,
    }),
  })

  const checkoutUrl = String(payment?._links?.checkout?.href || "").trim()
  if (!checkoutUrl) {
    throw new Error("Mollie checkout URL ontbreekt")
  }

  await execute(
    `
    insert into public.mollie_payments (
      id,
      user_id,
      plan_id,
      mollie_payment_id,
      status,
      sequence_type,
      amount_value,
      currency,
      checkout_url,
      metadata,
      created_at,
      updated_at
    )
    values ($1, $2, null, $3, $4, $5, $6, $7, $8, $9::jsonb, now(), now())
    on conflict (mollie_payment_id) do update
      set user_id = excluded.user_id,
          status = excluded.status,
          sequence_type = excluded.sequence_type,
          amount_value = excluded.amount_value,
          currency = excluded.currency,
          checkout_url = excluded.checkout_url,
          metadata = excluded.metadata,
          updated_at = now()
    `,
    [
      crypto.randomUUID(),
      params.userId,
      payment.id,
      payment.status || "open",
      optionalTrimmed(payment.sequenceType || null),
      payment.amount?.value ? Number(payment.amount.value) : checkoutAmount,
      optionalTrimmed(payment.amount?.currency || "EUR"),
      checkoutUrl,
      JSON.stringify(metadata),
    ],
  )

  return { checkoutUrl, paymentId: payment.id, requiresRedirect: true }
}

async function upsertSubscriptionRecord(params: {
  userId: string
  customerId: string
  subscriptionId: string
  planId: string | null
  status: string
  nextPaymentDate: string | null
}): Promise<void> {
  await execute(
    `
    insert into public.mollie_subscriptions (
      user_id,
      mollie_customer_id,
      mollie_subscription_id,
      plan_id,
      status,
      next_payment_date,
      canceled_at,
      created_at,
      updated_at
    )
    values ($1, $2, $3, $4, $5, $6::date, null, now(), now())
    on conflict (user_id) do update
      set mollie_customer_id = excluded.mollie_customer_id,
          mollie_subscription_id = excluded.mollie_subscription_id,
          plan_id = excluded.plan_id,
          status = excluded.status,
          next_payment_date = excluded.next_payment_date,
          canceled_at = case when excluded.status = 'canceled' then now() else null end,
          updated_at = now()
    `,
    [params.userId, params.customerId, params.subscriptionId, params.planId, params.status, params.nextPaymentDate],
  )
}

async function readSubscriptionContextForUser(userId: string): Promise<{
  customerId: string
  subscriptionId: string
  planId: string | null
  status: string
  nextPaymentDate: string | null
  currentPlanMonthlyPrice: number | null
} | null> {
  const row = await queryOne<{
    mollie_customer_id: string
    mollie_subscription_id: string
    plan_id: string | null
    status: string
    next_payment_date: string | null
    current_plan_monthly_price: string | null
  }>(
    `
    select
      ms.mollie_customer_id,
      ms.mollie_subscription_id,
      ms.plan_id,
      ms.status,
      ms.next_payment_date::text as next_payment_date,
      p.monthly_price as current_plan_monthly_price
    from public.mollie_subscriptions ms
    left join public.plans p on p.id = ms.plan_id
    where ms.user_id = $1
    limit 1
    `,
    [userId],
  )
  if (!row?.mollie_customer_id || !row?.mollie_subscription_id) return null
  return {
    customerId: row.mollie_customer_id,
    subscriptionId: row.mollie_subscription_id,
    planId: row.plan_id,
    status: row.status,
    nextPaymentDate: optionalTrimmed(row.next_payment_date),
    currentPlanMonthlyPrice: row.current_plan_monthly_price == null ? null : Number(row.current_plan_monthly_price),
  }
}

async function readCurrentSubscriptionForUser(userId: string): Promise<{
  mollie_customer_id: string
  mollie_subscription_id: string
  plan_id: string | null
  status: string
  canceled_at: string | null
} | null> {
  const row = await queryOne<{
    mollie_customer_id: string
    mollie_subscription_id: string
    plan_id: string | null
    status: string
    canceled_at: string | null
  }>(
    `
    select mollie_customer_id, mollie_subscription_id, plan_id, status, canceled_at::text as canceled_at
    from public.mollie_subscriptions
    where user_id = $1
    limit 1
    `,
    [userId],
  )
  if (!row?.mollie_customer_id || !row?.mollie_subscription_id) return null
  return row
}

function isSubscriptionActiveStatus(status: string | null | undefined): boolean {
  const normalized = String(status || "").trim().toLowerCase()
  return normalized === "active" || normalized === "pending"
}

async function applyPlanForUser(params: { userId: string; planId: string | null }): Promise<void> {
  await execute(
    `
    update public.users
    set plan_id = $1,
        custom_monthly_price = case when $1::uuid is null then custom_monthly_price else null end,
        updated_at = now()
    where id = $2
    `,
    [params.planId, params.userId],
  )
}

async function fetchSubscription(customerId: string, subscriptionId: string): Promise<MollieSubscription> {
  return mollieApiRequest<MollieSubscription>(`/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(subscriptionId)}`)
}

function normalizeDateOnly(value: string | null | undefined): string | null {
  const raw = optionalTrimmed(value)
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return null
}

function parseDateMs(value: string | null | undefined): number | null {
  const raw = optionalTrimmed(value)
  if (!raw) return null
  const ms = Date.parse(raw)
  return Number.isFinite(ms) ? ms : null
}

async function createSubscriptionForPlan(params: {
  userId: string
  customerId: string
  planId: string
  startDate?: string | null
}): Promise<MollieSubscription> {
  const plan = await readPlanSummary(params.planId)
  if (!plan || !(plan.monthlyPrice > 0)) {
    throw new Error("Cannot create subscription for invalid plan")
  }

  const webhookUrl = requireMollieWebhookUrl()
  const startDate = normalizeDateOnly(params.startDate ?? null)
  return mollieApiRequest<MollieSubscription>(`/customers/${encodeURIComponent(params.customerId)}/subscriptions`, {
    method: "POST",
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: normalizeAmountValue(plan.monthlyPrice),
      },
      interval: "1 month",
      description: `Coachscribe ${plan.name}`,
      webhookUrl,
      metadata: {
        userId: params.userId,
        planId: params.planId,
      },
      ...(startDate ? { startDate } : {}),
    }),
  })
}

export async function changeMollieSubscriptionPlanForUser(params: {
  userId: string
  planId: string
}): Promise<{ changed: boolean }> {
  await ensureMollieSchema()
  const plan = await readPlanSummary(params.planId)
  if (!plan || !(plan.monthlyPrice > 0)) {
    throw new Error("Invalid plan")
  }

  const existing = await readSubscriptionContextForUser(params.userId)
  if (!existing) {
    await applyPlanForUser({ userId: params.userId, planId: params.planId })
    return { changed: true }
  }

  if (optionalTrimmed(existing.planId) === params.planId) {
    return { changed: false }
  }

  const replacement = await createSubscriptionForPlan({
    userId: params.userId,
    customerId: existing.customerId,
    planId: params.planId,
    startDate: existing.nextPaymentDate,
  })

  await upsertSubscriptionRecord({
    userId: params.userId,
    customerId: existing.customerId,
    subscriptionId: replacement.id,
    planId: params.planId,
    status: replacement.status,
    nextPaymentDate: optionalTrimmed(replacement.nextPaymentDate || null),
  })
  await applyPlanForUser({ userId: params.userId, planId: params.planId })

  if (existing.subscriptionId !== replacement.id) {
    try {
      await mollieApiRequest<void>(
        `/customers/${encodeURIComponent(existing.customerId)}/subscriptions/${encodeURIComponent(existing.subscriptionId)}`,
        { method: "DELETE" },
      )
    } catch (error: any) {
      const message = String(error?.message || error || "")
      if (!message.toLowerCase().includes("not found")) {
        console.log("[billing:mollie] failed to cancel previous subscription on manual plan change", {
          userId: params.userId,
          previousCustomerId: existing.customerId,
          previousSubscriptionId: existing.subscriptionId,
          message,
        })
      }
    }
  }

  return { changed: true }
}

async function createSubscriptionAfterFirstPayment(params: {
  userId: string
  customerId: string
  planId: string
}): Promise<void> {
  const subscription = await createSubscriptionForPlan({
    userId: params.userId,
    customerId: params.customerId,
    planId: params.planId,
  })

  await upsertSubscriptionRecord({
    userId: params.userId,
    customerId: params.customerId,
    subscriptionId: subscription.id,
    planId: params.planId,
    status: subscription.status,
    nextPaymentDate: optionalTrimmed(subscription.nextPaymentDate || null),
  })

  if (isSubscriptionActiveStatus(subscription.status)) {
    await applyPlanForUser({ userId: params.userId, planId: params.planId })
  }
}

export async function processMolliePaymentWebhook(paymentId: string): Promise<void> {
  await ensureMollieSchema()
  const cleanedPaymentId = String(paymentId || "").trim()
  if (!cleanedPaymentId) {
    throw new Error("Missing Mollie payment id")
  }

  const payment = await mollieApiRequest<MolliePayment>(`/payments/${encodeURIComponent(cleanedPaymentId)}`)
  const existing = await queryOne<{
    user_id: string | null
    plan_id: string | null
    status: string | null
    metadata: any | null
  }>(
    `
    select user_id, plan_id, status, metadata
    from public.mollie_payments
    where mollie_payment_id = $1
    limit 1
    `,
    [cleanedPaymentId],
  )

  const storedMetadata = existing?.metadata && typeof existing.metadata === "object" ? existing.metadata : {}
  const metadata = payment.metadata && typeof payment.metadata === "object" ? payment.metadata : storedMetadata
  const userId = optionalTrimmed(existing?.user_id || (metadata as any).userId)
  const planId = optionalTrimmed(existing?.plan_id || (metadata as any).planId)
  const previousStatus = String(existing?.status || "").trim().toLowerCase()

  await execute(
    `
    insert into public.mollie_payments (
      id,
      user_id,
      plan_id,
      mollie_payment_id,
      status,
      sequence_type,
      amount_value,
      currency,
      checkout_url,
      metadata,
      paid_at,
      created_at,
      updated_at
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, null, $9::jsonb, $10::timestamptz, now(), now())
    on conflict (mollie_payment_id) do update
      set user_id = coalesce(excluded.user_id, public.mollie_payments.user_id),
          plan_id = coalesce(excluded.plan_id, public.mollie_payments.plan_id),
          status = excluded.status,
          sequence_type = excluded.sequence_type,
          amount_value = excluded.amount_value,
          currency = excluded.currency,
          metadata = excluded.metadata,
          paid_at = excluded.paid_at,
          updated_at = now()
    `,
    [
      crypto.randomUUID(),
      userId,
      planId,
      cleanedPaymentId,
      payment.status || "unknown",
      optionalTrimmed(payment.sequenceType || null),
      payment.amount?.value ? Number(payment.amount.value) : null,
      optionalTrimmed(payment.amount?.currency || null),
      JSON.stringify(metadata),
      optionalTrimmed(payment.paidAt || null),
    ],
  )

  const paymentStatus = String(payment.status || "").trim().toLowerCase()
  const metadataKind = optionalTrimmed((metadata as any).kind)

  if (!userId) return

  if (metadataKind === "one_time_extra_transcription_minutes") {
    if (paymentStatus === "paid" && previousStatus !== "paid") {
      const requestedGrantSeconds = Number((metadata as any).grantSeconds)
      const grantSeconds = Number.isFinite(requestedGrantSeconds) && requestedGrantSeconds > 0
        ? Math.floor(requestedGrantSeconds)
        : extraTranscriptionSecondsPerPurchase

      await execute(
        `
        insert into public.billing_users (user_id, purchased_seconds, updated_at)
        values ($1, $2, now())
        on conflict (user_id) do update
          set purchased_seconds = public.billing_users.purchased_seconds + excluded.purchased_seconds,
              updated_at = now()
        `,
        [userId, grantSeconds],
      )
    }
    return
  }

  if (!planId) return

  if (paymentStatus !== "paid") {
    if (payment.customerId && payment.subscriptionId) {
      const subscription = await fetchSubscription(payment.customerId, payment.subscriptionId)
      await upsertSubscriptionRecord({
        userId,
        customerId: payment.customerId,
        subscriptionId: payment.subscriptionId,
        planId,
        status: subscription.status,
        nextPaymentDate: optionalTrimmed(subscription.nextPaymentDate || null),
      })
      if (!isSubscriptionActiveStatus(subscription.status)) {
        await applyPlanForUser({ userId, planId: null })
      }
    }
    return
  }

  const currentSubscriptionState = await readCurrentSubscriptionForUser(userId)
  const paidAtMs = parseDateMs(optionalTrimmed(payment.paidAt || null))
  const canceledAtMs = parseDateMs(currentSubscriptionState?.canceled_at ?? null)
  if (
    currentSubscriptionState &&
    String(currentSubscriptionState.status || "").trim().toLowerCase() === "canceled" &&
    canceledAtMs != null &&
    (paidAtMs == null || paidAtMs <= canceledAtMs)
  ) {
    await applyPlanForUser({ userId, planId: null })
    return
  }

  if (metadataKind === "subscription_upgrade_difference") {
    const previousCustomerId = optionalTrimmed((metadata as any).previousCustomerId || payment.customerId)
    const previousSubscriptionId = optionalTrimmed((metadata as any).previousSubscriptionId)
    const nextPaymentDate = optionalTrimmed((metadata as any).nextPaymentDate)
    const currentSubscription = await readCurrentSubscriptionForUser(userId)
    if (
      currentSubscription &&
      isSubscriptionActiveStatus(currentSubscription.status) &&
      optionalTrimmed(currentSubscription.plan_id) === planId &&
      optionalTrimmed(currentSubscription.mollie_subscription_id) !== previousSubscriptionId
    ) {
      await applyPlanForUser({ userId, planId })
      return
    }

    const customerId = previousCustomerId || optionalTrimmed(payment.customerId || null)
    if (!customerId) {
      throw new Error("Upgrade payment is missing customerId")
    }

    const replacement = await createSubscriptionForPlan({
      userId,
      customerId,
      planId,
      startDate: nextPaymentDate,
    })
    await upsertSubscriptionRecord({
      userId,
      customerId,
      subscriptionId: replacement.id,
      planId,
      status: replacement.status,
      nextPaymentDate: optionalTrimmed(replacement.nextPaymentDate || null),
    })
    await applyPlanForUser({ userId, planId })

    if (previousCustomerId && previousSubscriptionId && previousSubscriptionId !== replacement.id) {
      try {
        await mollieApiRequest<void>(
          `/customers/${encodeURIComponent(previousCustomerId)}/subscriptions/${encodeURIComponent(previousSubscriptionId)}`,
          { method: "DELETE" },
        )
      } catch (error: any) {
        const message = String(error?.message || error || "")
        if (!message.toLowerCase().includes("not found")) {
          console.log("[billing:mollie] failed to cancel previous subscription after upgrade", {
            userId,
            previousCustomerId,
            previousSubscriptionId,
            message,
          })
        }
      }
    }
    return
  }

  if (String(payment.sequenceType || "").trim().toLowerCase() === "first") {
    const customerId = optionalTrimmed(payment.customerId || null)
    if (!customerId) {
      throw new Error("Paid first Mollie payment is missing customerId")
    }
    const existingSubscription = await readCurrentSubscriptionForUser(userId)
    if (
      existingSubscription &&
      isSubscriptionActiveStatus(existingSubscription.status) &&
      optionalTrimmed(existingSubscription.plan_id) === planId
    ) {
      await applyPlanForUser({ userId, planId })
      return
    }
    await createSubscriptionAfterFirstPayment({
      userId,
      customerId,
      planId,
    })
    return
  }

  if (payment.customerId && payment.subscriptionId) {
    const subscription = await fetchSubscription(payment.customerId, payment.subscriptionId)
    await upsertSubscriptionRecord({
      userId,
      customerId: payment.customerId,
      subscriptionId: payment.subscriptionId,
      planId,
      status: subscription.status,
      nextPaymentDate: optionalTrimmed(subscription.nextPaymentDate || null),
    })
    if (isSubscriptionActiveStatus(subscription.status)) {
      await applyPlanForUser({ userId, planId })
    } else {
      await applyPlanForUser({ userId, planId: null })
    }
  } else {
    await applyPlanForUser({ userId, planId })
  }
}

export async function syncMollieSubscriptionForUser(userId: string): Promise<void> {
  await ensureMollieSchema()

  const row = await queryOne<{
    mollie_customer_id: string
    mollie_subscription_id: string
    plan_id: string | null
  }>(
    `
    select mollie_customer_id, mollie_subscription_id, plan_id
    from public.mollie_subscriptions
    where user_id = $1
    limit 1
    `,
    [userId],
  )
  if (!row?.mollie_customer_id || !row?.mollie_subscription_id) return

  try {
    const subscription = await fetchSubscription(row.mollie_customer_id, row.mollie_subscription_id)
    await upsertSubscriptionRecord({
      userId,
      customerId: row.mollie_customer_id,
      subscriptionId: row.mollie_subscription_id,
      planId: row.plan_id,
      status: subscription.status,
      nextPaymentDate: optionalTrimmed(subscription.nextPaymentDate || null),
    })
    if (isSubscriptionActiveStatus(subscription.status)) {
      await applyPlanForUser({ userId, planId: row.plan_id })
    } else {
      await applyPlanForUser({ userId, planId: null })
    }
  } catch (error: any) {
    const message = String(error?.message || error || "")
    if (message.toLowerCase().includes("not found")) {
      await execute(
        `
        update public.mollie_subscriptions
        set status = 'canceled',
            canceled_at = now(),
            updated_at = now()
        where user_id = $1
        `,
        [userId],
      )
      await applyPlanForUser({ userId, planId: null })
      return
    }
    throw error
  }
}

export async function syncRecentMolliePaymentsForUser(userId: string): Promise<void> {
  await ensureMollieSchema()

  const unresolvedPayments = await queryMany<{ mollie_payment_id: string }>(
    `
    select mollie_payment_id
    from public.mollie_payments
    where user_id = $1
      and lower(status) in ('open', 'pending', 'authorized')
      and created_at >= now() - interval '14 days'
    order by created_at desc
    limit 10
    `,
    [userId],
  )
  const latestPaidPayment = await queryOne<{ mollie_payment_id: string }>(
    `
    select mollie_payment_id
    from public.mollie_payments
    where user_id = $1
      and lower(status) = 'paid'
      and created_at >= now() - interval '48 hours'
    order by created_at desc
    limit 1
    `,
    [userId],
  )
  const paymentIds = new Set<string>()
  for (const row of unresolvedPayments) {
    const paymentId = optionalTrimmed(row.mollie_payment_id)
    if (paymentId) paymentIds.add(paymentId)
  }
  const latestPaidId = optionalTrimmed(latestPaidPayment?.mollie_payment_id)
  if (latestPaidId) paymentIds.add(latestPaidId)

  for (const paymentId of paymentIds) {
    try {
      await processMolliePaymentWebhook(paymentId)
    } catch (error: any) {
      const message = String(error?.message || error || "")
      console.log("[billing:mollie:sync-payments] failed", { userId, paymentId, message })
    }
  }
}

export async function cancelMollieSubscriptionForUser(userId: string): Promise<{ canceled: boolean }> {
  await ensureMollieSchema()
  const row = await queryOne<{
    mollie_customer_id: string
    mollie_subscription_id: string
  }>(
    `
    select mollie_customer_id, mollie_subscription_id
    from public.mollie_subscriptions
    where user_id = $1
    limit 1
    `,
    [userId],
  )
  if (!row?.mollie_customer_id || !row?.mollie_subscription_id) {
    return { canceled: false }
  }

  await mollieApiRequest<void>(
    `/customers/${encodeURIComponent(row.mollie_customer_id)}/subscriptions/${encodeURIComponent(row.mollie_subscription_id)}`,
    { method: "DELETE" },
  )

  await execute(
    `
    update public.mollie_subscriptions
    set status = 'canceled',
        plan_id = null,
        canceled_at = now(),
        updated_at = now()
    where user_id = $1
    `,
    [userId],
  )
  await applyPlanForUser({ userId, planId: null })
  return { canceled: true }
}
