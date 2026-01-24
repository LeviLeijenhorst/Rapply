import type { SubscriptionPlanKey } from "@/screens/subscriptionFlowData"
import { getCustomerInfo, getCurrentPlanKeyFromCustomerInfo, getExtraTranscriptionStoreProduct, getOfferingByLookupKey } from "@/services/revenuecat"
import { normalizeSubscriptionProductId } from "@/services/subscriptionCatalog"
import { subscriptionPlans } from "@/screens/subscriptionFlowData"
import { formatEuroAmount, formatEuroFromPriceString } from "@/utils/formatCurrency"
import { isLikelyNoConnectionError } from "@/utils/networkErrors"

export type SubscriptionPricingSnapshot = {
  currentPlanKey: SubscriptionPlanKey | null
  pricesByPlanKey: Record<string, string>
  extraHourPrice: string
  updatedAtMs: number
  error: "offline" | "error" | null
}

let pricingInFlight: Promise<SubscriptionPricingSnapshot> | null = null
let cachedSnapshot: SubscriptionPricingSnapshot | null = null
const cacheTtlMs = 5 * 60_000

export function getCachedSubscriptionPricing(): SubscriptionPricingSnapshot | null {
  return cachedSnapshot
}

export function invalidateSubscriptionPricingCache() {
  cachedSnapshot = null
}

export async function prefetchSubscriptionPricing(): Promise<void> {
  try {
    await getSubscriptionPricing()
  } catch {}
}

export async function getSubscriptionPricing(options?: { force?: boolean }): Promise<SubscriptionPricingSnapshot> {
  const force = !!options?.force
  const now = Date.now()
  if (!force && cachedSnapshot && now - cachedSnapshot.updatedAtMs <= cacheTtlMs) {
    return cachedSnapshot
  }
  if (pricingInFlight) return await pricingInFlight

  pricingInFlight = (async () => {
    try {
      const offering = await getOfferingByLookupKey("default_monthly")
      const availablePackages = Array.isArray(offering?.availablePackages) ? offering.availablePackages : []

      const nextPrices: Record<string, string> = {}
      for (const plan of subscriptionPlans) {
        const productId = typeof (plan as any)?.productId === "string" ? String((plan as any).productId).trim() : ""
        if (!productId) continue
        const match = availablePackages.find((pkg: any) => {
          const id = String(pkg?.product?.identifier || "").trim()
          return normalizeSubscriptionProductId(id) === normalizeSubscriptionProductId(productId)
        })
        const amount = typeof match?.product?.price === "number" ? (match.product.price as number) : null
        if (amount !== null) {
          nextPrices[plan.key] = formatEuroAmount(amount)
          continue
        }
        const priceString = String(match?.product?.priceString || "").trim()
        if (priceString) {
          nextPrices[plan.key] = formatEuroFromPriceString(priceString) ?? priceString
        }
      }

      const info = await getCustomerInfo()
      const currentPlanKey = getCurrentPlanKeyFromCustomerInfo(info)

      let extraHourPrice = ""
      try {
        const product = await getExtraTranscriptionStoreProduct()
        const amount = typeof product?.price === "number" ? (product.price as number) : null
        if (amount !== null) {
          extraHourPrice = formatEuroAmount(amount)
        } else {
          extraHourPrice = String(product?.priceString || "").trim()
          extraHourPrice = formatEuroFromPriceString(extraHourPrice) ?? extraHourPrice
        }
      } catch {
        extraHourPrice = ""
      }

      const snapshot: SubscriptionPricingSnapshot = {
        currentPlanKey,
        pricesByPlanKey: nextPrices,
        extraHourPrice,
        updatedAtMs: Date.now(),
        error: null,
      }
      cachedSnapshot = snapshot
      return snapshot
    } catch (error) {
      const snapshot: SubscriptionPricingSnapshot = {
        currentPlanKey: cachedSnapshot?.currentPlanKey ?? null,
        pricesByPlanKey: cachedSnapshot?.pricesByPlanKey ?? {},
        extraHourPrice: cachedSnapshot?.extraHourPrice ?? "",
        updatedAtMs: Date.now(),
        error: isLikelyNoConnectionError(error) ? "offline" : "error",
      }
      cachedSnapshot = snapshot
      throw error
    } finally {
      pricingInFlight = null
    }
  })()

  return await pricingInFlight
}

