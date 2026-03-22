import { freeSeconds, getIncludedSecondsForPlanKey, type PlanKey } from "../billing/constants"
import { buildCycleKey, clampNonNegative } from "../billing/cycleMath"
import { ensureBillingUsersCompatibility } from "../billing/store"
import { requireUserDefaultOrganizationId } from "../access/clientAccess"
import { readManualPricingContextForUser } from "../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser } from "../billing/mollie"
import { execute, queryOne } from "../db"

export type ChargeResult = {
  secondsCharged: number
  chargedCycleSeconds: number
  chargedNonExpiringSeconds: number
  remainingSeconds: number
}

export type TranscriptionChargeContext = {
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride: number | null
  freeSecondsOverride: number | null
}

type OperationScope = "legacy" | "async"

function readOperationTableName(scope: OperationScope): string {
  return scope === "legacy" ? "public.transcription_operations" : "public.async_transcription_operations"
}

// Charges transcription seconds and reuses an existing charge for the same operation.
export async function chargeSecondsOnce(params: {
  userId: string
  operationId: string
  secondsToCharge: number
  scope?: OperationScope
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride?: number | null
  freeSecondsOverride?: number | null
  nonExpiringTotalSecondsOverride?: number
}): Promise<ChargeResult> {
  const {
    userId,
    operationId,
    secondsToCharge,
    scope = "async",
    planKey,
    cycleStartMs,
    cycleEndMs,
    includedSecondsOverride,
    freeSecondsOverride,
    nonExpiringTotalSecondsOverride,
  } = params

  const seconds = clampNonNegative(secondsToCharge)
  if (seconds <= 0) {
    throw new Error("Invalid seconds to charge")
  }

  const operationTableName = readOperationTableName(scope)
  const existingOperation = await queryOne<any>(`select * from ${operationTableName} where operation_id = $1`, [operationId])
  if (existingOperation) {
    if (String(existingOperation.owner_user_id) !== userId) {
      throw new Error("Operation does not belong to user")
    }

    const secondsCharged = clampNonNegative(existingOperation.seconds_charged ?? 0)
    if (secondsCharged > 0 && !existingOperation.refunded_at) {
      const chargedCycleSeconds = clampNonNegative(existingOperation.charged_cycle_seconds ?? 0)
      const chargedNonExpiringSeconds = clampNonNegative(existingOperation.charged_non_expiring_seconds ?? 0)
      const remainingSeconds = clampNonNegative(existingOperation.remaining_seconds_after ?? 0)
      return { secondsCharged, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSeconds }
    }
  }

  const includedSeconds =
    Number.isFinite(includedSecondsOverride) && Number(includedSecondsOverride) >= 0
      ? Math.floor(Number(includedSecondsOverride))
      : getIncludedSecondsForPlanKey(planKey)
  const effectiveFreeSeconds =
    Number.isFinite(freeSecondsOverride) && Number(freeSecondsOverride) >= 0
      ? Math.floor(Number(freeSecondsOverride))
      : freeSeconds
  const cycleKey = buildCycleKey(cycleStartMs, cycleEndMs)
  const organizationId = await requireUserDefaultOrganizationId(userId)
  await ensureBillingUsersCompatibility()

  const billingRow = await queryOne<any>(
    `
    select purchased_seconds, admin_granted_seconds, non_expiring_used_seconds, cycle_used_seconds_by_key, cycle_granted_seconds_by_key
    from public.billing_organizations
    where organization_id = $1
    `,
    [organizationId],
  )

  const purchasedSeconds = clampNonNegative(billingRow?.purchased_seconds ?? 0)
  const adminGrantedSeconds = clampNonNegative(billingRow?.admin_granted_seconds ?? 0)
  const nonExpiringUsedSeconds = clampNonNegative(billingRow?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (billingRow?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const cycleGrantedSecondsByKey = (billingRow?.cycle_granted_seconds_by_key ?? {}) as Record<string, number>
  const cycleGrantedSeconds = cycleKey ? clampNonNegative(cycleGrantedSecondsByKey[cycleKey] ?? 0) : 0
  const currentCycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const cycleIncludedSeconds = includedSeconds + cycleGrantedSeconds
  const cycleRemainingSeconds = cycleKey ? Math.max(0, cycleIncludedSeconds - currentCycleUsedSeconds) : 0
  let nonExpiringTotalSeconds = effectiveFreeSeconds + purchasedSeconds + adminGrantedSeconds
  if (typeof nonExpiringTotalSecondsOverride === "number" && Number.isFinite(nonExpiringTotalSecondsOverride) && nonExpiringTotalSecondsOverride > 0) {
    nonExpiringTotalSeconds = Math.floor(nonExpiringTotalSecondsOverride)
  }
  const nonExpiringRemainingSeconds = Math.max(0, nonExpiringTotalSeconds - nonExpiringUsedSeconds)

  const maxChargeable = cycleRemainingSeconds + nonExpiringRemainingSeconds
  if (seconds > maxChargeable) {
    throw new Error("Not enough seconds remaining")
  }

  const chargedCycleSeconds = Math.min(seconds, cycleRemainingSeconds)
  const chargedNonExpiringSeconds = seconds - chargedCycleSeconds

  const nextCycleUsedSeconds = currentCycleUsedSeconds + chargedCycleSeconds
  const nextNonExpiringUsedSeconds = nonExpiringUsedSeconds + chargedNonExpiringSeconds
  const remainingSeconds = cycleRemainingSeconds - chargedCycleSeconds + (nonExpiringRemainingSeconds - chargedNonExpiringSeconds)

  const nextCycleUsedSecondsByKey = { ...cycleUsedSecondsByKey }
  if (cycleKey) {
    nextCycleUsedSecondsByKey[cycleKey] = nextCycleUsedSeconds
  }

  await execute(
    `
    insert into public.billing_organizations (organization_id, non_expiring_used_seconds, cycle_used_seconds_by_key, updated_at)
    values ($1, $2, $3::jsonb, now())
    on conflict (organization_id) do update
      set non_expiring_used_seconds = excluded.non_expiring_used_seconds,
          cycle_used_seconds_by_key = excluded.cycle_used_seconds_by_key,
          updated_at = now()
    `,
    [organizationId, nextNonExpiringUsedSeconds, JSON.stringify(nextCycleUsedSecondsByKey)],
  )

  await execute(
    `
    update ${operationTableName}
    set seconds_charged = $3,
        charged_cycle_seconds = $4,
        charged_non_expiring_seconds = $5,
        remaining_seconds_after = $6,
        plan_key = $7,
        cycle_key = $8,
        charged_at = now(),
        refunded_at = null
    where operation_id = $1
      and owner_user_id = $2
    `,
    [operationId, userId, seconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSeconds, planKey, cycleKey],
  )

  return { secondsCharged: seconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSeconds }
}

// Reads the billing context used for charging transcription seconds.
export async function readTranscriptionChargeContext(params: { userId: string }): Promise<TranscriptionChargeContext> {
  const useMollie = isMollieConfigured()
  if (useMollie) {
    try {
      await syncMollieSubscriptionForUser(params.userId)
    } catch (error: any) {
      const message = String(error?.message || error || "")
      console.warn("[transcription] mollie sync failed; continuing with manual pricing context", {
        userId: params.userId,
        message,
      })
    }
  }

  const manualPricing = await readManualPricingContextForUser(params.userId)
  const useManualCycle =
    useMollie ||
    manualPricing.includedSecondsPerCycle > 0 ||
    manualPricing.planId != null ||
    manualPricing.customMonthlyPrice != null
  const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
  const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null

  return {
    cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
    cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
    includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
    freeSecondsOverride,
  }
}

// Refunds a charged transcription operation once.
export async function refundChargedSeconds(params: { userId: string; operationId: string }): Promise<void> {
  const { userId, operationId } = params
  const operationTableName = readOperationTableName("async")

  const op = await queryOne<any>(`select * from ${operationTableName} where operation_id = $1`, [operationId])
  if (!op) return
  if (String(op.owner_user_id) !== userId) {
    throw new Error("Operation does not belong to user")
  }
  if (op.refunded_at) return

  const chargedCycleSeconds = clampNonNegative(op.charged_cycle_seconds ?? 0)
  const chargedNonExpiringSeconds = clampNonNegative(op.charged_non_expiring_seconds ?? 0)
  const cycleKey = typeof op.cycle_key === "string" ? op.cycle_key : null
  const organizationId = await requireUserDefaultOrganizationId(userId)

  await ensureBillingUsersCompatibility()
  const billingRow = await queryOne<any>(
    `
    select non_expiring_used_seconds, cycle_used_seconds_by_key
    from public.billing_organizations
    where organization_id = $1
    `,
    [organizationId],
  )

  const nonExpiringUsedSeconds = clampNonNegative(billingRow?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (billingRow?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const currentCycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const nextNonExpiringUsedSeconds = Math.max(0, nonExpiringUsedSeconds - chargedNonExpiringSeconds)
  const nextCycleUsedSeconds = Math.max(0, currentCycleUsedSeconds - chargedCycleSeconds)

  const nextCycleUsedSecondsByKey = { ...cycleUsedSecondsByKey }
  if (cycleKey) {
    nextCycleUsedSecondsByKey[cycleKey] = nextCycleUsedSeconds
  }

  await execute(
    `
    insert into public.billing_organizations (organization_id, non_expiring_used_seconds, cycle_used_seconds_by_key, updated_at)
    values ($1, $2, $3::jsonb, now())
    on conflict (organization_id) do update
      set non_expiring_used_seconds = excluded.non_expiring_used_seconds,
          cycle_used_seconds_by_key = excluded.cycle_used_seconds_by_key,
          updated_at = now()
    `,
    [organizationId, nextNonExpiringUsedSeconds, JSON.stringify(nextCycleUsedSecondsByKey)],
  )

  await execute(
    `
    update ${operationTableName}
    set refunded_at = now()
    where operation_id = $1
      and owner_user_id = $2
    `,
    [operationId, userId],
  )
}
