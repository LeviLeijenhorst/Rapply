import { freeSeconds, getIncludedSecondsForPlanKey, type PlanKey } from "../billing/constants"
import crypto from "crypto"
import { execute, queryOne } from "../db"

function clampNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

function buildCycleKey(cycleStartMs: number | null, cycleEndMs: number | null): string | null {
  if (!cycleStartMs || !cycleEndMs) return null
  return `${cycleStartMs}-${cycleEndMs}`
}

export async function createUploadToken(params: { userId: string; operationId: string; uploadPath: string }): Promise<{ uploadToken: string; expiresAtMs: number }> {
  const { userId, operationId, uploadPath } = params

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = cryptoRandomToken()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    try {
      await execute(
        `
        insert into public.upload_tokens (token, user_id, operation_id, upload_blob_name, expires_at, used_at)
        values ($1, $2, $3, $4, $5, null)
        `,
        [token, userId, operationId, uploadPath, expiresAt],
      )
      return { uploadToken: token, expiresAtMs: Date.parse(expiresAt) }
    } catch (e: any) {
      const message = String(e?.message || "")
      if (!message.toLowerCase().includes("duplicate")) {
        throw e
      }
    }
  }

  throw new Error("Failed to create upload token")
}

function cryptoRandomToken(): string {
  const base64 = crypto.randomBytes(32).toString("base64")
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export async function consumeUploadToken(params: { userId: string; uploadToken: string; operationId: string }): Promise<{ uploadPath: string }> {
  const { userId, uploadToken, operationId } = params
  const row = await queryOne<{ upload_blob_name: string }>(
    `
    update public.upload_tokens
    set used_at = now()
    where token = $1
      and user_id = $2
      and operation_id = $3
      and used_at is null
      and expires_at > now()
    returning upload_blob_name
    `,
    [uploadToken, userId, operationId],
  )

  if (!row?.upload_blob_name) {
    throw new Error("Invalid upload token")
  }

  return { uploadPath: String(row.upload_blob_name) }
}

export type ChargeResult = {
  secondsCharged: number
  chargedCycleSeconds: number
  chargedNonExpiringSeconds: number
  remainingSecondsAfter: number
}

export async function chargeSecondsIdempotent(params: {
  userId: string
  operationId: string
  secondsToCharge: number
  planKey: PlanKey | null
  cycleStartMs: number | null
  cycleEndMs: number | null
}): Promise<ChargeResult> {
  const { userId, operationId, secondsToCharge, planKey, cycleStartMs, cycleEndMs } = params

  const seconds = clampNonNegative(secondsToCharge)
  if (seconds <= 0) {
    throw new Error("Invalid seconds to charge")
  }

  const existingOp = await queryOne<any>(`select * from public.transcription_operations where operation_id = $1`, [operationId])
  if (existingOp) {
    if (String(existingOp.user_id) !== userId) {
      throw new Error("Operation does not belong to user")
    }
    const status = String(existingOp.status || "")
    if (status === "charged" || status === "completed") {
      const chargedCycleSeconds = clampNonNegative(existingOp.charged_cycle_seconds ?? 0)
      const chargedNonExpiringSeconds = clampNonNegative(existingOp.charged_non_expiring_seconds ?? 0)
      const remainingSecondsAfter = clampNonNegative(existingOp.remaining_seconds_after ?? 0)
      return { secondsCharged: chargedCycleSeconds + chargedNonExpiringSeconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSecondsAfter }
    }
  }

  const includedSeconds = getIncludedSecondsForPlanKey(planKey)
  const cycleKey = buildCycleKey(cycleStartMs, cycleEndMs)

  const billingRow = await queryOne<any>(
    `
    select purchased_seconds, non_expiring_used_seconds, cycle_used_seconds_by_key
    from public.billing_users
    where user_id = $1
    `,
    [userId],
  )

  const purchasedSeconds = clampNonNegative(billingRow?.purchased_seconds ?? 0)
  const nonExpiringUsedSeconds = clampNonNegative(billingRow?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (billingRow?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const currentCycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const cycleRemainingSeconds = cycleKey ? Math.max(0, includedSeconds - currentCycleUsedSeconds) : 0
  const nonExpiringTotalSeconds = freeSeconds + purchasedSeconds
  const nonExpiringRemainingSeconds = Math.max(0, nonExpiringTotalSeconds - nonExpiringUsedSeconds)

  const maxChargeable = cycleRemainingSeconds + nonExpiringRemainingSeconds
  if (seconds > maxChargeable) {
    throw new Error("Not enough seconds remaining")
  }

  const chargedCycleSeconds = Math.min(seconds, cycleRemainingSeconds)
  const chargedNonExpiringSeconds = seconds - chargedCycleSeconds

  const nextCycleUsedSeconds = currentCycleUsedSeconds + chargedCycleSeconds
  const nextNonExpiringUsedSeconds = nonExpiringUsedSeconds + chargedNonExpiringSeconds
  const remainingSecondsAfter = (cycleRemainingSeconds - chargedCycleSeconds) + (nonExpiringRemainingSeconds - chargedNonExpiringSeconds)

  const nextCycleUsedSecondsByKey = { ...cycleUsedSecondsByKey }
  if (cycleKey) {
    nextCycleUsedSecondsByKey[cycleKey] = nextCycleUsedSeconds
  }

  await execute(
    `
    insert into public.billing_users (user_id, non_expiring_used_seconds, cycle_used_seconds_by_key, updated_at)
    values ($1, $2, $3::jsonb, now())
    on conflict (user_id) do update
      set non_expiring_used_seconds = excluded.non_expiring_used_seconds,
          cycle_used_seconds_by_key = excluded.cycle_used_seconds_by_key,
          updated_at = now()
    `,
    [userId, nextNonExpiringUsedSeconds, JSON.stringify(nextCycleUsedSecondsByKey)],
  )

  await execute(
    `
    insert into public.transcription_operations (
      operation_id,
      user_id,
      status,
      seconds_charged,
      charged_cycle_seconds,
      charged_non_expiring_seconds,
      remaining_seconds_after,
      plan_key,
      cycle_key,
      charged_at
    )
    values ($1, $2, 'charged', $3, $4, $5, $6, $7, $8, now())
    on conflict (operation_id) do update
      set user_id = excluded.user_id,
          status = excluded.status,
          seconds_charged = excluded.seconds_charged,
          charged_cycle_seconds = excluded.charged_cycle_seconds,
          charged_non_expiring_seconds = excluded.charged_non_expiring_seconds,
          remaining_seconds_after = excluded.remaining_seconds_after,
          plan_key = excluded.plan_key,
          cycle_key = excluded.cycle_key,
          charged_at = now()
    `,
    [operationId, userId, seconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSecondsAfter, planKey, cycleKey],
  )

  return { secondsCharged: seconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSecondsAfter }
}

export async function refundSecondsIdempotent(params: { userId: string; operationId: string }): Promise<void> {
  const { userId, operationId } = params

  const op = await queryOne<any>(`select * from public.transcription_operations where operation_id = $1`, [operationId])
  if (!op) return
  if (String(op.user_id) !== userId) {
    throw new Error("Operation does not belong to user")
  }
  if (op.refunded_at) return

  const chargedCycleSeconds = clampNonNegative(op.charged_cycle_seconds ?? 0)
  const chargedNonExpiringSeconds = clampNonNegative(op.charged_non_expiring_seconds ?? 0)
  const cycleKey = typeof op.cycle_key === "string" ? op.cycle_key : null

  const billingRow = await queryOne<any>(
    `
    select non_expiring_used_seconds, cycle_used_seconds_by_key
    from public.billing_users
    where user_id = $1
    `,
    [userId],
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
    insert into public.billing_users (user_id, non_expiring_used_seconds, cycle_used_seconds_by_key, updated_at)
    values ($1, $2, $3::jsonb, now())
    on conflict (user_id) do update
      set non_expiring_used_seconds = excluded.non_expiring_used_seconds,
          cycle_used_seconds_by_key = excluded.cycle_used_seconds_by_key,
          updated_at = now()
    `,
    [userId, nextNonExpiringUsedSeconds, JSON.stringify(nextCycleUsedSecondsByKey)],
  )

  await execute(
    `
    update public.transcription_operations
    set status = 'refunded',
        refunded_at = now()
    where operation_id = $1
      and user_id = $2
    `,
    [operationId, userId],
  )
}

