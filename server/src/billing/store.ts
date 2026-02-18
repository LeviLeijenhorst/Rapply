import { freeSeconds, getIncludedSecondsForPlanKey, type PlanKey } from "./constants"
import { buildCycleKey, clampNonNegative } from "./cycleMath"
import { queryOne, execute } from "../db"

export type BillingStatus = {
  planKey: PlanKey | null
  cycleKey: string | null
  freeSeconds: number
  purchasedSeconds: number
  adminGrantedSeconds: number
  includedSeconds: number
  cycleUsedSeconds: number
  cycleRemainingSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
  nonExpiringRemainingSeconds: number
  remainingSeconds: number
}

let ensureBillingUsersCompatibilityPromise: Promise<void> | null = null

export async function ensureBillingUsersCompatibility(): Promise<void> {
  if (!ensureBillingUsersCompatibilityPromise) {
    ensureBillingUsersCompatibilityPromise = execute(
      `
      alter table public.billing_users
      add column if not exists admin_granted_seconds integer not null default 0;

      do $$
      begin
        if not exists (
          select 1
          from pg_constraint
          where conname = 'billing_users_non_negative_admin_granted'
        ) then
          alter table public.billing_users
          add constraint billing_users_non_negative_admin_granted
          check (admin_granted_seconds >= 0);
        end if;
      end
      $$;
      `,
      [],
    ).catch((error) => {
      ensureBillingUsersCompatibilityPromise = null
      throw error
    })
  }
  await ensureBillingUsersCompatibilityPromise
}

// Intent: ensureBillingUser
export async function ensureBillingUser(userId: string): Promise<void> {
  await ensureBillingUsersCompatibility()
  await execute(
    `
    insert into public.billing_users (user_id)
    values ($1)
    on conflict (user_id) do nothing
    `,
    [userId],
  )
}

// Intent: readBillingStatus
export async function readBillingStatus(params: {
  userId: string
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride?: number | null
}): Promise<BillingStatus> {
  const { userId, planKey, cycleStartMs, cycleEndMs, includedSecondsOverride } = params

  await ensureBillingUsersCompatibility()

  const includedSeconds = Number.isFinite(includedSecondsOverride) && Number(includedSecondsOverride) >= 0
    ? Math.floor(Number(includedSecondsOverride))
    : getIncludedSecondsForPlanKey(planKey)
  const cycleKey = buildCycleKey(cycleStartMs, cycleEndMs)

  const row = await queryOne<{
    purchased_seconds: number
    admin_granted_seconds: number
    non_expiring_used_seconds: number
    cycle_used_seconds_by_key: any
  }>(
    `
    select purchased_seconds, admin_granted_seconds, non_expiring_used_seconds, cycle_used_seconds_by_key
    from public.billing_users
    where user_id = $1
    `,
    [userId],
  )

  const purchasedSeconds = clampNonNegative(row?.purchased_seconds ?? 0)
  const adminGrantedSeconds = clampNonNegative(row?.admin_granted_seconds ?? 0)
  const nonExpiringUsedSeconds = clampNonNegative(row?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (row?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const cycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const nonExpiringTotalSeconds = freeSeconds + purchasedSeconds + adminGrantedSeconds
  const nonExpiringRemainingSeconds = Math.max(0, nonExpiringTotalSeconds - nonExpiringUsedSeconds)

  const cycleRemainingSeconds = Math.max(0, includedSeconds - cycleUsedSeconds)
  const remainingSeconds = cycleRemainingSeconds + nonExpiringRemainingSeconds

  return {
    planKey,
    cycleKey,
    freeSeconds,
    purchasedSeconds,
    adminGrantedSeconds,
    includedSeconds,
    cycleUsedSeconds,
    cycleRemainingSeconds,
    nonExpiringTotalSeconds,
    nonExpiringUsedSeconds,
    nonExpiringRemainingSeconds,
    remainingSeconds,
  }
}

