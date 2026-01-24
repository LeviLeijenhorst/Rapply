import { env } from "../env"
import { extraTranscriptionProductId, extraTranscriptionSecondsPerPurchase, getPlanKeyFromSubscriptionProductId, type PlanKey } from "./constants"

export type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, { expires_date?: string | null }>
    subscriptions?: Record<string, { purchase_date?: string | null; expires_date?: string | null }>
    non_subscriptions?: Record<string, Array<{ id?: string | null }>>
  }
}

function parseDateMs(value: string | null | undefined): number | null {
  const s = typeof value === "string" ? value.trim() : ""
  if (!s) return null
  const ms = Date.parse(s)
  if (!Number.isFinite(ms)) return null
  return ms
}

function isEntitlementActive(entitlement: { expires_date?: string | null } | undefined, nowMs: number): boolean {
  if (!entitlement) return false
  if (entitlement.expires_date === null) return true
  const expiresMs = parseDateMs(entitlement.expires_date)
  if (!expiresMs) return false
  return expiresMs > nowMs
}

function pickActiveSubscriptionProductId(subscriptions: Record<string, { expires_date?: string | null }> | undefined, nowMs: number): string | null {
  const entries = subscriptions ? Object.entries(subscriptions) : []
  const active = entries
    .map(([productId, data]) => {
      const expiresMs = parseDateMs(data?.expires_date ?? null)
      return { productId, expiresMs }
    })
    .filter((x) => x.expiresMs !== null && (x.expiresMs as number) > nowMs)
    .sort((a, b) => (b.expiresMs as number) - (a.expiresMs as number))
  if (active.length === 0) return null
  return active[0].productId
}

export async function fetchRevenueCatSubscriber(userId: string): Promise<RevenueCatSubscriberResponse> {
  const apiKey = env.revenueCatSecretKey
  if (!apiKey) {
    return {}
  }

  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  })
  const json: any = await response.json().catch(() => null)
  if (!response.ok) {
    const message = json?.message || json?.error || "RevenueCat request failed"
    throw new Error(String(message))
  }
  return json as RevenueCatSubscriberResponse
}

export type RevenueCatPlanState = {
  entitlementIsActive: boolean
  planKey: PlanKey | null
  subscriptionProductId: string | null
  cycleStartMs: number | null
  cycleEndMs: number | null
}

export function derivePlanStateFromRevenueCatSubscriber(subscriberResponse: RevenueCatSubscriberResponse): RevenueCatPlanState {
  const nowMs = Date.now()
  const subscriber = subscriberResponse?.subscriber

  const entitlement = subscriber?.entitlements?.paid_features
  const entitlementIsActive = isEntitlementActive(entitlement, nowMs)

  const subscriptionProductId = pickActiveSubscriptionProductId(subscriber?.subscriptions, nowMs)
  const planKeyFromProduct = getPlanKeyFromSubscriptionProductId(subscriptionProductId)
  const planKey: PlanKey | null = entitlementIsActive && planKeyFromProduct ? planKeyFromProduct : null

  const subscriptionData = subscriptionProductId ? subscriber?.subscriptions?.[subscriptionProductId] : undefined
  const cycleStartMs = parseDateMs(subscriptionData?.purchase_date ?? null)
  const cycleEndMs = parseDateMs(subscriptionData?.expires_date ?? null)

  return { entitlementIsActive, planKey, subscriptionProductId, cycleStartMs, cycleEndMs }
}

export function derivePurchasedSecondsFromRevenueCatSubscriber(subscriberResponse: RevenueCatSubscriberResponse): number {
  const subscriber = subscriberResponse?.subscriber
  const map = subscriber?.non_subscriptions ?? {}
  const purchases = Array.isArray((map as any)[extraTranscriptionProductId]) ? (map as any)[extraTranscriptionProductId] : []
  const count = Array.isArray(purchases) ? purchases.length : 0
  return Math.max(0, Math.floor(count)) * extraTranscriptionSecondsPerPurchase
}

