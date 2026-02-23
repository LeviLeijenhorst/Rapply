import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { readManualPricingContextForUser } from "../../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser } from "../../billing/mollie"
import { derivePlanStateFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../../billing/revenuecat"
import { readBillingStatus } from "../../billing/store"
import { env } from "../../env"
import { asyncHandler, sendError } from "../../http"
import { readTranscriptionMode } from "../../transcription/mode"
import { chargeSecondsIdempotent } from "../../transcription/store"
import { applyEmailBillingOverrides, getNonExpiringTotalSecondsOverrideForEmail } from "../billingOverrides"
import { markOperationCompleted, markOperationFailed } from "./helpers"
import type { RegisterTranscriptionRoutesParams } from "./types"

const AZURE_SPEECH_TOKEN_TTL_SECONDS = 540

function normalizeRegion(value: string): string {
  return String(value || "").trim().toLowerCase()
}

async function issueAzureSpeechToken(): Promise<{ token: string; region: string; expiresInSeconds: number }> {
  const key = String(env.azureSpeechKey || "").trim()
  const region = normalizeRegion(env.azureSpeechRegion)
  if (!key || !region) {
    throw new Error("Azure Speech is not configured")
  }

  const tokenResponse = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Length": "0",
    },
  })
  const token = (await tokenResponse.text().catch(() => "")).trim()
  if (!tokenResponse.ok || !token) {
    throw new Error(`Failed to issue Azure Speech token (${tokenResponse.status})`)
  }

  return {
    token,
    region,
    expiresInSeconds: AZURE_SPEECH_TOKEN_TTL_SECONDS,
  }
}

export function registerTranscriptionRealtimeRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/runtime-config",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const mode = await readTranscriptionMode()
      const azureSpeechConfigured = !!String(env.azureSpeechKey || "").trim() && !!normalizeRegion(env.azureSpeechRegion)
      res.status(200).json({
        mode,
        azureSpeechConfigured,
      })
    }),
  )

  app.post(
    "/transcription/realtime/token",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const mode = await readTranscriptionMode()
      if (mode !== "azure-realtime-live") {
        sendError(res, 409, "Realtime transcription is disabled")
        return
      }
      try {
        const tokenResult = await issueAzureSpeechToken()
        res.status(200).json({
          mode,
          ...tokenResult,
        })
      } catch (error: any) {
        const message = String(error?.message || error)
        sendError(res, 500, message)
      }
    }),
  )

  app.post(
    "/transcription/realtime/charge",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const mode = await readTranscriptionMode()
      if (mode !== "azure-realtime-live") {
        sendError(res, 409, "Realtime transcription is disabled")
        return
      }

      const operationId = String(req.body?.operationId || "").trim()
      const durationSecondsRaw = Number(req.body?.durationSeconds)
      const durationSeconds = Number.isFinite(durationSecondsRaw) ? Math.max(0, Math.floor(durationSecondsRaw)) : 0
      if (!operationId) {
        sendError(res, 400, "Missing operationId")
        return
      }
      if (durationSeconds <= 0) {
        sendError(res, 400, "Invalid durationSeconds")
        return
      }

      try {
        const useMollie = isMollieConfigured()
        if (useMollie) {
          await syncMollieSubscriptionForUser(user.userId)
        }

        const subscriber = useMollie ? {} : await fetchRevenueCatSubscriber(user.userId)
        const planState = useMollie ? { planKey: null, cycleStartMs: null, cycleEndMs: null } : derivePlanStateFromRevenueCatSubscriber(subscriber)
        const manualPricing = await readManualPricingContextForUser(user.userId)
        const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
        const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
        const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null
        const nonExpiringTotalSecondsOverride = getNonExpiringTotalSecondsOverrideForEmail(user.email)

        const charge = await chargeSecondsIdempotent({
          userId: user.userId,
          operationId,
          secondsToCharge: Math.max(1, durationSeconds),
          planKey: useManualCycle ? null : planState.planKey,
          cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
          cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
          includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
          freeSecondsOverride,
          nonExpiringTotalSecondsOverride,
        })

        await markOperationCompleted({ operationId, userId: user.userId })

        const statusRaw = await readBillingStatus({
          userId: user.userId,
          planKey: useManualCycle ? null : planState.planKey,
          cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
          cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
          includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
          freeSecondsOverride,
        })
        const status = applyEmailBillingOverrides(statusRaw, user.email)

        res.status(200).json({
          ok: true,
          secondsCharged: charge.secondsCharged,
          remainingSecondsAfter: charge.remainingSecondsAfter,
          remainingSeconds: status.remainingSeconds,
        })
      } catch (error: any) {
        const message = String(error?.message || error)
        if (message === "Not enough seconds remaining") {
          await markOperationFailed({ operationId, userId: user.userId, errorMessage: message }).catch(() => undefined)
          sendError(res, 402, message)
          return
        }
        await markOperationFailed({ operationId, userId: user.userId, errorMessage: message }).catch(() => undefined)
        sendError(res, 500, message)
      }
    }),
  )
}
