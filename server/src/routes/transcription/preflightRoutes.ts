import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { isMollieConfigured, syncMollieSubscriptionForUser } from "../../billing/mollie"
import { readManualPricingContextForUser } from "../../billing/manualPricing"
import { ensureBillingUser, readBillingStatus } from "../../billing/store"
import { asyncHandler } from "../../http"
import { randomBase64Url } from "../../transcription/random"
import { createEncryptedUploadUrl } from "../../transcription/storage"
import { createUploadToken } from "../../transcription/store"
import { transcriptionUploadExpirationSeconds } from "../../transcription/uploadExpiration"
import { getProviderMaxAudioBytes, getProviderMaxAudioDurationSeconds } from "./actions/providerLimits"
import { resolveTranscriptionProviderWithRuntimeMode } from "./actions/resolveTranscriptionProvider"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers transcription preflight endpoint.
export function registerTranscriptionPreflightRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/preflight",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      await ensureBillingUser(user.userId)

      const useMollie = isMollieConfigured()
      if (useMollie) {
        await syncMollieSubscriptionForUser(user.userId)
      }

      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null
      const statusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
      })
      const status = statusRaw
      const transcriptionProvider = await resolveTranscriptionProviderWithRuntimeMode()
      const requiresWav = false
      const maxAudioBytes = getProviderMaxAudioBytes(transcriptionProvider)
      const maxAudioDurationSeconds = getProviderMaxAudioDurationSeconds(transcriptionProvider)

      if (status.remainingSeconds <= 0) {
        res.status(200).json({
          allowed: false,
          remainingSeconds: status.remainingSeconds,
          planKey: status.planKey,
          transcriptionProvider,
          requiresWav,
          maxAudioBytes,
          maxAudioDurationSeconds,
        })
        return
      }

      const operationId = randomBase64Url(16)
      const uploadPath = `${user.userId}/${operationId}/${Date.now()}.csa1`
      const token = await createUploadToken({ userId: user.userId, operationId, uploadPath })
      const upload = await createEncryptedUploadUrl({
        blobName: uploadPath,
        expiresInSeconds: transcriptionUploadExpirationSeconds,
      })

      res.status(200).json({
        allowed: true,
        remainingSeconds: status.remainingSeconds,
        planKey: status.planKey,
        operationId,
        uploadToken: token.uploadToken,
        uploadPath,
        uploadUrl: upload.uploadUrl,
        uploadHeaders: upload.uploadHeaders,
        uploadTokenExpiresAtMs: token.expiresAtMs,
        transcriptionProvider,
        requiresWav,
        maxAudioBytes,
        maxAudioDurationSeconds,
      })
    }),
  )
}

