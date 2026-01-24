export type PlanKey = "basis" | "professioneel" | "fulltime" | "praktijk"

export const freeSeconds = 1800

export const extraTranscriptionProductId = "extra_transcription_1h"
export const extraTranscriptionSecondsPerPurchase = 3600

const includedSecondsByPlanKey: Record<Exclude<PlanKey, "praktijk">, number> = {
  basis: 36000,
  professioneel: 144000,
  fulltime: 360000,
}

const subscriptionProductIdsByPlanKey: Record<Exclude<PlanKey, "praktijk">, string[]> = {
  basis: ["tier_1_monthly"],
  professioneel: ["tier_2_monthly"],
  fulltime: ["tier_3_monthly"],
}

function normalizeSubscriptionProductId(value: string): string {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  const idx = trimmed.indexOf(":")
  if (idx === -1) return trimmed
  return trimmed.slice(0, idx).trim()
}

function buildPlanKeyBySubscriptionProductId(): Record<string, Exclude<PlanKey, "praktijk">> {
  const map: Record<string, Exclude<PlanKey, "praktijk">> = {}
  const entries = Object.entries(subscriptionProductIdsByPlanKey) as Array<[Exclude<PlanKey, "praktijk">, string[]]>
  for (const [planKey, productIds] of entries) {
    for (const productId of productIds) {
      const key = normalizeSubscriptionProductId(productId)
      if (!key) continue
      map[key] = planKey
    }
  }
  return map
}

const planKeyBySubscriptionProductId = buildPlanKeyBySubscriptionProductId()

export function getPlanKeyFromSubscriptionProductId(productId: string | null | undefined): Exclude<PlanKey, "praktijk"> | null {
  const key = typeof productId === "string" ? normalizeSubscriptionProductId(productId) : ""
  if (!key) return null
  return planKeyBySubscriptionProductId[key] ?? null
}

export function getIncludedSecondsForPlanKey(planKey: PlanKey | null | undefined): number {
  if (!planKey) return 0
  if (planKey === "praktijk") return 0
  return includedSecondsByPlanKey[planKey] ?? 0
}

