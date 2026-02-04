import { freeSeconds, getIncludedSecondsForPlanKey, type PlanKey } from "./constants"
import { queryOne, execute } from "../db"

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

function buildCycleKey(cycleStartMs: number | null, cycleEndMs: number | null): string | null {
  if (!cycleStartMs || !cycleEndMs) return null
  return `${cycleStartMs}-${cycleEndMs}`
}

function clampNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

export async function ensureBillingUser(userId: string): Promise<void> {
  await execute(
    `
    insert into public.billing_users (user_id)
    values ($1)
    on conflict (user_id) do nothing
    `,
    [userId],
  )
}

export async function readBillingStatus(params: { userId: string; planKey: PlanKey | null; cycleStartMs: number | null; cycleEndMs: number | null }): Promise<BillingStatus> {
  const { userId, planKey, cycleStartMs, cycleEndMs } = params

  const includedSeconds = getIncludedSecondsForPlanKey(planKey)
  const cycleKey = buildCycleKey(cycleStartMs, cycleEndMs)

  const row = await queryOne<{
    purchased_seconds: number
    non_expiring_used_seconds: number
    cycle_used_seconds_by_key: any
  }>(
    `
    select purchased_seconds, non_expiring_used_seconds, cycle_used_seconds_by_key
    from public.billing_users
    where user_id = $1
    `,
    [userId],
  )

  const purchasedSeconds = clampNonNegative(row?.purchased_seconds ?? 0)
  const nonExpiringUsedSeconds = clampNonNegative(row?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (row?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const cycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const nonExpiringTotalSeconds = freeSeconds + purchasedSeconds
  const nonExpiringRemainingSeconds = Math.max(0, nonExpiringTotalSeconds - nonExpiringUsedSeconds)

  const cycleRemainingSeconds = Math.max(0, includedSeconds - cycleUsedSeconds)
  const remainingSeconds = cycleRemainingSeconds + nonExpiringRemainingSeconds

  return {
    planKey,
    cycleKey,
    freeSeconds,
    purchasedSeconds,
    includedSeconds,
    cycleUsedSeconds,
    cycleRemainingSeconds,
    nonExpiringTotalSeconds,
    nonExpiringUsedSeconds,
    nonExpiringRemainingSeconds,
    remainingSeconds,
  }
}

