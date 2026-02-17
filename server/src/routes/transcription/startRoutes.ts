import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { derivePlanStateFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../../billing/revenuecat"
import { readBillingStatus } from "../../billing/store"
import { asyncHandler, sendError } from "../../http"
import { generateSummary } from "../../summary/summary"
import { deleteEncryptedUpload, getEncryptedUploadSize } from "../../transcription/storage"
import { chargeSecondsIdempotent, consumeUploadToken, refundSecondsIdempotent } from "../../transcription/store"
import { applyEmailBillingOverrides, getNonExpiringTotalSecondsOverrideForEmail } from "../billingOverrides"
import { markOperationCompleted, markOperationFailed, readDurationSeconds, readStartRequest, resolveTranscriptionProvider, runTranscription } from "./helpers"
import type { RegisterTranscriptionRoutesParams, TranscriptionProvider } from "./types"

// Registers transcription execution endpoint.
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
        const secondsToCharge = Math.max(1, Math.ceil(durationSeconds))

        const subscriber = await fetchRevenueCatSubscriber(user.userId)
        const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
        const nonExpiringTotalSecondsOverride = getNonExpiringTotalSecondsOverrideForEmail(user.email)

        let charge: { secondsCharged: number; remainingSecondsAfter: number }
        try {
          charge = await chargeSecondsIdempotent({
            userId: user.userId,
            operationId,
            secondsToCharge,
            planKey: planState.planKey,
            cycleStartMs: planState.cycleStartMs,
            cycleEndMs: planState.cycleEndMs,
            nonExpiringTotalSecondsOverride,
          })
        } catch (error: any) {
          const message = String(error?.message || error)
          if (message !== "Not enough seconds remaining") {
            throw error
          }
          const statusRaw = await readBillingStatus({
            userId: user.userId,
            planKey: planState.planKey,
            cycleStartMs: planState.cycleStartMs,
            cycleEndMs: planState.cycleEndMs,
          })
          const status = applyEmailBillingOverrides(statusRaw, user.email)
          sendError(res, 402, `Not enough seconds remaining. Needed ${secondsToCharge}s, remaining ${status.remainingSeconds}s.`)
          return
        }

        selectedProvider = resolveTranscriptionProvider()

        const transcript = await runTranscription({
          provider: selectedProvider,
          uploadPath,
          keyBase64,
          mimeType,
          languageCode,
        })

        const summary = includeSummary ? await generateSummary({ transcript }) : ""
        await markOperationCompleted({ operationId, userId: user.userId })

        res.status(200).json({
          transcript,
          text: transcript,
          summary,
          secondsCharged: charge.secondsCharged,
          remainingSecondsAfter: charge.remainingSecondsAfter,
          planKey: planState.planKey,
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

