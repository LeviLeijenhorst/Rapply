import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { derivePlanStateFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../../billing/revenuecat"
import { ensureBillingUser, readBillingStatus } from "../../billing/store"
import { asyncHandler } from "../../http"
import { randomBase64Url } from "../../transcription/random"
import { createEncryptedUploadUrl } from "../../transcription/storage"
import { createUploadToken } from "../../transcription/store"
import { transcriptionUploadExpirationSeconds } from "../../transcription/uploadExpiration"
import { applyEmailBillingOverrides } from "../billingOverrides"
import { getProviderMaxAudioBytes, getProviderMaxAudioDurationSeconds, resolveTranscriptionProvider } from "./helpers"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers transcription preflight endpoint.
export function registerTranscriptionPreflightRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/preflight",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      await ensureBillingUser(user.userId)

      const subscriber = await fetchRevenueCatSubscriber(user.userId)
      const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
      const statusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: planState.planKey,
        cycleStartMs: planState.cycleStartMs,
        cycleEndMs: planState.cycleEndMs,
      })
      const status = applyEmailBillingOverrides(statusRaw, user.email)
      const transcriptionProvider = resolveTranscriptionProvider()
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

