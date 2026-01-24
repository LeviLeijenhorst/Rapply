import { postToSecureApi } from "@/services/secureApi"
import { isLikelyNoConnectionError } from "@/utils/networkErrors"

export type PlanKey = "basis" | "professioneel" | "fulltime" | "praktijk"

export type BillingStatus = {
  planKey: PlanKey | null
  cycleKey: string | null
  freeSeconds: number
  purchasedSeconds: number
  includedSeconds: number
  cycleUsedSeconds: number
  cycleRemainingSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
  nonExpiringRemainingSeconds: number
  remainingSeconds: number
}

export type BillingStatusResponse = {
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
  billingStatus: BillingStatus
}

let billingStatusInFlight: Promise<BillingStatusResponse> | null = null
let billingStatusCache: BillingStatusResponse | null = null
let billingStatusCacheUpdatedAtMs = 0
let billingStatusCacheError: "offline" | "error" | null = null

const cacheTtlMs = 60_000

export function getCachedBillingStatus(): BillingStatusResponse | null {
  return billingStatusCache
}

export function getCachedBillingStatusError(): "offline" | "error" | null {
  return billingStatusCacheError
}

export function invalidateBillingStatusCache() {
  billingStatusCache = null
  billingStatusCacheUpdatedAtMs = 0
  billingStatusCacheError = null
}

export async function prefetchBillingStatus(): Promise<void> {
  try {
    await getBillingStatus()
  } catch {}
}

export async function getBillingStatus(options?: { force?: boolean }): Promise<BillingStatusResponse> {
  const force = !!options?.force
  const now = Date.now()
  if (!force && billingStatusCache && now - billingStatusCacheUpdatedAtMs <= cacheTtlMs) {
    return billingStatusCache
  }
  if (billingStatusInFlight) return await billingStatusInFlight
  billingStatusInFlight = (async () => {
    try {
      const json = await postToSecureApi("/billing/status", {})
      const billingStatus = (json as any)?.billingStatus
      if (!billingStatus) {
        throw new Error("Billing status is missing from server response")
      }
      billingStatusCache = json as BillingStatusResponse
      billingStatusCacheUpdatedAtMs = Date.now()
      billingStatusCacheError = null
      return json as BillingStatusResponse
    } catch (error) {
      billingStatusCacheError = isLikelyNoConnectionError(error) ? "offline" : "error"
      throw error
    }
  })().finally(() => {
    billingStatusInFlight = null
  })
  return await billingStatusInFlight
}

export function formatMinutesFromSeconds(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  if (safeSeconds === 0) return "0 minuten"
  if (safeSeconds < 60) return "<1 minuut"
  const minutes = Math.floor(safeSeconds / 60)
  if (minutes === 1) return "1 minuut"
  return `${minutes} minuten`
}

export function computeUsageMinutesLabels(status: BillingStatus): { usedLabel: string; availableLabel: string; remainingLabel: string } {
  const usedSeconds = Math.max(0, (status.cycleUsedSeconds || 0) + (status.nonExpiringUsedSeconds || 0))
  const availableSeconds = Math.max(0, (status.includedSeconds || 0) + (status.nonExpiringTotalSeconds || 0))
  const remainingSeconds = Math.max(0, status.remainingSeconds || 0)
  return {
    usedLabel: formatMinutesFromSeconds(usedSeconds),
    availableLabel: formatMinutesFromSeconds(availableSeconds),
    remainingLabel: formatMinutesFromSeconds(remainingSeconds),
  }
}
