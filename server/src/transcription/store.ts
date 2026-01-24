import { supabaseAdmin } from "../supabaseAdmin"
import { freeSeconds, getIncludedSecondsForPlanKey, type PlanKey } from "../billing/constants"
import crypto from "crypto"

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

    const insertResult = await supabaseAdmin.from("upload_tokens").insert({
      token,
      user_id: userId,
      operation_id: operationId,
      upload_path: uploadPath,
      expires_at: expiresAt,
      used_at: null,
    })

    if (!insertResult.error) {
      return { uploadToken: token, expiresAtMs: Date.parse(expiresAt) }
    }

    const message = String(insertResult.error.message || "")
    if (!message.toLowerCase().includes("duplicate")) {
      throw new Error(insertResult.error.message)
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
  const nowIso = new Date().toISOString()

  const updateResult = await supabaseAdmin
    .from("upload_tokens")
    .update({ used_at: nowIso })
    .eq("token", uploadToken)
    .eq("user_id", userId)
    .eq("operation_id", operationId)
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .select("upload_path")
    .maybeSingle()

  if (updateResult.error || !updateResult.data?.upload_path) {
    throw new Error("Invalid upload token")
  }

  return { uploadPath: String(updateResult.data.upload_path) }
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

  const existingOp = await supabaseAdmin.from("transcription_operations").select("*").eq("operation_id", operationId).maybeSingle()
  if (existingOp.error) {
    throw new Error(existingOp.error.message)
  }
  if (existingOp.data) {
    if (String(existingOp.data.user_id) !== userId) {
      throw new Error("Operation does not belong to user")
    }
    const status = String(existingOp.data.status || "")
    if (status === "charged" || status === "completed") {
      const chargedCycleSeconds = clampNonNegative(existingOp.data.charged_cycle_seconds ?? 0)
      const chargedNonExpiringSeconds = clampNonNegative(existingOp.data.charged_non_expiring_seconds ?? 0)
      const remainingSecondsAfter = clampNonNegative(existingOp.data.remaining_seconds_after ?? 0)
      return { secondsCharged: chargedCycleSeconds + chargedNonExpiringSeconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSecondsAfter }
    }
  }

  const includedSeconds = getIncludedSecondsForPlanKey(planKey)
  const cycleKey = buildCycleKey(cycleStartMs, cycleEndMs)

  const billingRow = await supabaseAdmin
    .from("billing_users")
    .select("purchased_seconds, non_expiring_used_seconds, cycle_used_seconds_by_key")
    .eq("user_id", userId)
    .maybeSingle()

  if (billingRow.error) {
    throw new Error(billingRow.error.message)
  }

  const purchasedSeconds = clampNonNegative(billingRow.data?.purchased_seconds ?? 0)
  const nonExpiringUsedSeconds = clampNonNegative(billingRow.data?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (billingRow.data?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
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

  await supabaseAdmin.from("billing_users").upsert({
    user_id: userId,
    non_expiring_used_seconds: nextNonExpiringUsedSeconds,
    cycle_used_seconds_by_key: nextCycleUsedSecondsByKey,
    updated_at: new Date().toISOString(),
  })

  await supabaseAdmin.from("transcription_operations").upsert({
    operation_id: operationId,
    user_id: userId,
    status: "charged",
    seconds_charged: seconds,
    charged_cycle_seconds: chargedCycleSeconds,
    charged_non_expiring_seconds: chargedNonExpiringSeconds,
    remaining_seconds_after: remainingSecondsAfter,
    plan_key: planKey,
    cycle_key: cycleKey,
    charged_at: new Date().toISOString(),
  })

  return { secondsCharged: seconds, chargedCycleSeconds, chargedNonExpiringSeconds, remainingSecondsAfter }
}

export async function refundSecondsIdempotent(params: { userId: string; operationId: string }): Promise<void> {
  const { userId, operationId } = params

  const op = await supabaseAdmin.from("transcription_operations").select("*").eq("operation_id", operationId).maybeSingle()
  if (op.error) {
    throw new Error(op.error.message)
  }
  if (!op.data) return
  if (String(op.data.user_id) !== userId) {
    throw new Error("Operation does not belong to user")
  }
  if (op.data.refunded_at) return

  const chargedCycleSeconds = clampNonNegative(op.data.charged_cycle_seconds ?? 0)
  const chargedNonExpiringSeconds = clampNonNegative(op.data.charged_non_expiring_seconds ?? 0)
  const cycleKey = typeof op.data.cycle_key === "string" ? op.data.cycle_key : null

  const billingRow = await supabaseAdmin
    .from("billing_users")
    .select("non_expiring_used_seconds, cycle_used_seconds_by_key")
    .eq("user_id", userId)
    .maybeSingle()
  if (billingRow.error) {
    throw new Error(billingRow.error.message)
  }

  const nonExpiringUsedSeconds = clampNonNegative(billingRow.data?.non_expiring_used_seconds ?? 0)
  const cycleUsedSecondsByKey = (billingRow.data?.cycle_used_seconds_by_key ?? {}) as Record<string, number>
  const currentCycleUsedSeconds = cycleKey ? clampNonNegative(cycleUsedSecondsByKey[cycleKey] ?? 0) : 0

  const nextNonExpiringUsedSeconds = Math.max(0, nonExpiringUsedSeconds - chargedNonExpiringSeconds)
  const nextCycleUsedSeconds = Math.max(0, currentCycleUsedSeconds - chargedCycleSeconds)

  const nextCycleUsedSecondsByKey = { ...cycleUsedSecondsByKey }
  if (cycleKey) {
    nextCycleUsedSecondsByKey[cycleKey] = nextCycleUsedSeconds
  }

  await supabaseAdmin.from("billing_users").upsert({
    user_id: userId,
    non_expiring_used_seconds: nextNonExpiringUsedSeconds,
    cycle_used_seconds_by_key: nextCycleUsedSecondsByKey,
    updated_at: new Date().toISOString(),
  })

  await supabaseAdmin
    .from("transcription_operations")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("operation_id", operationId)
    .eq("user_id", userId)
}

