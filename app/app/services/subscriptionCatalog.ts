export type SubscriptionPeriod = "monthly" | "yearly"

export type SubscriptionPlanKey = "basis" | "professioneel" | "fulltime" | "praktijk"

export type SubscriptionPlanProductIds = {
  monthly?: string
  yearly?: string
}

export const subscriptionPlanProductIdsByPlanKey: Record<Exclude<SubscriptionPlanKey, "praktijk">, SubscriptionPlanProductIds> = {
  basis: { monthly: "tier_1_monthly" },
  professioneel: { monthly: "tier_2_monthly" },
  fulltime: { monthly: "tier_3_monthly" },
}

export function normalizeSubscriptionProductId(value: string | null | undefined): string {
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) return ""
  const idx = trimmed.indexOf(":")
  if (idx === -1) return trimmed
  return trimmed.slice(0, idx).trim()
}

export function getPlanKeyFromSubscriptionProductId(value: string | null | undefined): Exclude<SubscriptionPlanKey, "praktijk"> | null {
  const base = normalizeSubscriptionProductId(value)
  if (!base) return null
  const entries = Object.entries(subscriptionPlanProductIdsByPlanKey) as Array<[Exclude<SubscriptionPlanKey, "praktijk">, SubscriptionPlanProductIds]>
  for (const [planKey, ids] of entries) {
    const all = [ids.monthly, ids.yearly].filter((v) => typeof v === "string" && v.trim()) as string[]
    if (all.some((id) => normalizeSubscriptionProductId(id) === base)) {
      return planKey
    }
  }
  return null
}

export function getAllKnownSubscriptionBaseProductIds(): string[] {
  const ids: string[] = []
  const entries = Object.entries(subscriptionPlanProductIdsByPlanKey) as Array<[Exclude<SubscriptionPlanKey, "praktijk">, SubscriptionPlanProductIds]>
  for (const [, value] of entries) {
    const all = [value.monthly, value.yearly].filter((v) => typeof v === "string" && v.trim()) as string[]
    for (const id of all) {
      const base = normalizeSubscriptionProductId(id)
      if (base && !ids.includes(base)) ids.push(base)
    }
  }
  return ids
}

