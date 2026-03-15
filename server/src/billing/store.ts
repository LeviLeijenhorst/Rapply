import { freeSeconds, getIncludedSecondsForPlanKey, type PlanKey } from "./constants"
import { buildCycleKey, clampNonNegative } from "./cycleMath"
import { queryOne, execute } from "../db"
import { requireUserDefaultOrganizationId } from "../access/clientAccess"

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

let ensureBillingOrganizationsCompatibilityPromise: Promise<void> | null = null

export async function ensureBillingUsersCompatibility(): Promise<void> {
  if (!ensureBillingOrganizationsCompatibilityPromise) {
    ensureBillingOrganizationsCompatibilityPromise = execute(
      `
      create table if not exists public.billing_organizations (
        organization_id text primary key references public.organizations (id) on delete cascade,
        purchased_seconds integer not null default 0,
        admin_granted_seconds integer not null default 0,
        non_expiring_used_seconds integer not null default 0,
        cycle_used_seconds_by_key jsonb not null default '{}'::jsonb,
        cycle_granted_seconds_by_key jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now(),
        constraint billing_organizations_non_negative_purchased check (purchased_seconds >= 0),
        constraint billing_organizations_non_negative_admin_granted check (admin_granted_seconds >= 0),
        constraint billing_organizations_non_negative_non_expiring_used check (non_expiring_used_seconds >= 0)
      );
      `,
      [],
    ).catch((error) => {
      ensureBillingOrganizationsCompatibilityPromise = null
      throw error
    })
  }
  await ensureBillingOrganizationsCompatibilityPromise
}

export async function ensureBillingUser(userId: string): Promise<void> {
  const organizationId = await requireUserDefaultOrganizationId(userId)
  await ensureBillingOrganization(organizationId)
}

export async function ensureBillingOrganization(organizationId: string): Promise<void> {
  await ensureBillingUsersCompatibility()
  await execute(
    `
    insert into public.billing_organizations (organization_id)
    values ($1)
    on conflict (organization_id) do nothing
    `,
    [organizationId],
  )
}

async function readBillingStatusForOrganization(params: {
  organizationId: string
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride?: number | null
  freeSecondsOverride?: number | null
}): Promise<BillingStatus> {
  const { organizationId, planKey, cycleStartMs, cycleEndMs, includedSecondsOverride, freeSecondsOverride } = params
  await ensureBillingOrganization(organizationId)

  const includedSeconds = Number.isFinite(includedSecondsOverride) && Number(includedSecondsOverride) >= 0
    ? Math.floor(Number(includedSecondsOverride))
    : getIncludedSecondsForPlanKey(planKey)
  const effectiveFreeSeconds = Number.isFinite(freeSecondsOverride) && Number(freeSecondsOverride) >= 0
    ? Math.floor(Number(freeSecondsOverride))
    : freeSeconds
  const cycleKey = buildCycleKey(cycleStartMs, cycleEndMs)

  const row = await queryOne<{
    purchased_seconds: number
    admin_granted_seconds: number
    non_expiring_used_seconds: number
    cycle_used_seconds_by_key: any
    cycle_granted_seconds_by_key: any
  }>(
    `
    select purchased_seconds, admin_granted_seconds, non_expiring_used_seconds, cycle_used_seconds_by_key, cycle_granted_seconds_by_key
    from public.billing_organizations
    where organization_id = $1
    `,
    [organizationId],
  )

  const purchasedSeconds = clampNonNegative(row?.purchased_seconds ?? 0)
  const adminGrantedSeconds = clampNonNegative(row?.admin_granted_seconds ?? 0)
  const nonExpiringUsedSeconds = clampNonNegative(row?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (row?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const cycleGrantedSecondsByKey = (row?.cycle_granted_seconds_by_key ?? {}) as Record<string, number>
  const cycleGrantedSeconds = cycleKey ? clampNonNegative(cycleGrantedSecondsByKey[cycleKey] ?? 0) : 0
  const cycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const nonExpiringTotalSeconds = effectiveFreeSeconds + purchasedSeconds + adminGrantedSeconds
  const nonExpiringRemainingSeconds = Math.max(0, nonExpiringTotalSeconds - nonExpiringUsedSeconds)

  const cycleIncludedSeconds = includedSeconds + cycleGrantedSeconds
  const cycleRemainingSeconds = Math.max(0, cycleIncludedSeconds - cycleUsedSeconds)
  const remainingSeconds = cycleRemainingSeconds + nonExpiringRemainingSeconds

  return {
    planKey,
    cycleKey,
    freeSeconds: effectiveFreeSeconds,
    purchasedSeconds,
    adminGrantedSeconds,
    includedSeconds: cycleIncludedSeconds,
    cycleUsedSeconds,
    cycleRemainingSeconds,
    nonExpiringTotalSeconds,
    nonExpiringUsedSeconds,
    nonExpiringRemainingSeconds,
    remainingSeconds,
  }
}

export async function readBillingStatus(params: {
  userId: string
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride?: number | null
  freeSecondsOverride?: number | null
}): Promise<BillingStatus> {
  const organizationId = await requireUserDefaultOrganizationId(params.userId)
  return readBillingStatusForOrganization({
    organizationId,
    planKey: params.planKey,
    cycleStartMs: params.cycleStartMs,
    cycleEndMs: params.cycleEndMs,
    includedSecondsOverride: params.includedSecondsOverride,
    freeSecondsOverride: params.freeSecondsOverride,
  })
}

export async function readBillingStatusByOrganization(params: {
  organizationId: string
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride?: number | null
  freeSecondsOverride?: number | null
}): Promise<BillingStatus> {
  return readBillingStatusForOrganization(params)
}

