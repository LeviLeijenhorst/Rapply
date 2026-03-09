import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { readManualPricingContextForUser } from "../../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser } from "../../billing/mollie"
import { readBillingStatus } from "../../billing/store"
import { asyncHandler, sendError } from "../../http"
import { generateSessionSummary } from "../../summaries/generateSessionSummary"
import { deleteEncryptedUpload, getEncryptedUploadSize } from "../storage"
import { chargeSecondsIdempotent, consumeUploadToken, refundSecondsIdempotent } from "../store"
import { markOperationCompleted } from "../actions/markOperationCompleted"
import { markOperationFailed } from "../actions/markOperationFailed"
import { getProviderMaxAudioDurationSeconds } from "../actions/providerLimits"
import { readDurationSeconds } from "../actions/readDurationSeconds"
import { readStartRequest } from "../actions/readStartRequest"
import { resolveTranscriptionProviderWithRuntimeMode } from "../actions/resolveTranscriptionProvider"
import { runTranscription } from "../actions/runTranscription"
import type { RegisterTranscriptionRoutesParams, TranscriptionProvider } from "./types"

export function registerTranscriptionStartRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/start",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const startRequest = readStartRequest(req.body)
      if (!startRequest) {
        sendError(res, 400, "Missing operationId, uploadToken, or keyBase64")
        return
      }

      const { operationId, uploadToken, keyBase64, languageCode, mimeType, includeSummary } = startRequest
      let uploadPath = ""
      let selectedProvider: TranscriptionProvider = "none"

      try {
        const consumed = await consumeUploadToken({ userId: user.userId, uploadToken, operationId })
        uploadPath = consumed.uploadPath
        if (!uploadPath.startsWith(`${user.userId}/`)) {
          sendError(res, 403, "Invalid uploadPath")
          return
        }

        const uploadBytes = await getEncryptedUploadSize({ blobName: uploadPath })
        const durationSeconds = await readDurationSeconds({
          uploadPath,
          keyBase64,
          mimeType,
          encryptedSizeBytes: uploadBytes,
        })
        selectedProvider = await resolveTranscriptionProviderWithRuntimeMode()
        const maxAudioDurationSeconds = getProviderMaxAudioDurationSeconds(selectedProvider)
        if (typeof maxAudioDurationSeconds === "number" && durationSeconds > maxAudioDurationSeconds) {
          sendError(res, 422, `Audio duration exceeds maximum allowed length (max ${Math.floor(maxAudioDurationSeconds / 60)} minutes).`)
          return
        }
        const secondsToCharge = Math.max(1, Math.ceil(durationSeconds))

        const useMollie = isMollieConfigured()
        if (useMollie) {
          await syncMollieSubscriptionForUser(user.userId)
        }

        const manualPricing = await readManualPricingContextForUser(user.userId)
        const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
        const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
        const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null

        let charge: { secondsCharged: number; remainingSecondsAfter: number }
        try {
          charge = await chargeSecondsIdempotent({
            userId: user.userId,
            operationId,
            secondsToCharge,
            planKey: null,
            cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
            cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
            includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
            freeSecondsOverride,
            nonExpiringTotalSecondsOverride: undefined,
          })
        } catch (error: any) {
          const message = String(error?.message || error)
          if (message !== "Not enough seconds remaining") {
            throw error
          }
          const status = await readBillingStatus({
            userId: user.userId,
            planKey: null,
            cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
            cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
            includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
            freeSecondsOverride,
          })
          sendError(res, 402, `Not enough seconds remaining. Needed ${secondsToCharge}s, remaining ${status.remainingSeconds}s.`)
          return
        }

        const transcript = await runTranscription({
          provider: selectedProvider,
          uploadPath,
          keyBase64,
          mimeType,
          languageCode,
        })

        const summary = includeSummary ? await generateSessionSummary({ transcript }) : ""
        await markOperationCompleted({ operationId, userId: user.userId })

        res.status(200).json({
          transcript,
          text: transcript,
          summary,
          secondsCharged: charge.secondsCharged,
          remainingSecondsAfter: charge.remainingSecondsAfter,
          planKey: null,
        })
      } catch (error: any) {
        const errorMessage = String(error?.message || error)
        try {
          await refundSecondsIdempotent({ userId: user.userId, operationId })
          await markOperationFailed({ operationId, userId: user.userId, errorMessage })
        } catch {
          // Ignore cleanup failures to avoid masking root errors.
        }
        sendError(res, 500, errorMessage)
      } finally {
        if (!uploadPath) return
        try {
          await deleteEncryptedUpload({ blobName: uploadPath })
        } catch {
          // Ignore cleanup failures after response handling.
        }
      }
    }),
  )
}
