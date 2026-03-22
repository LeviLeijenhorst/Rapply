import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { ensureBillingUser, readBillingStatus } from "../../billing/store"
import { asyncHandler, sendError } from "../../http"
import { randomBase64Url } from "../random"
import { createEncryptedUploadUrl } from "../storage"
import { createUploadToken } from "../uploadTokenStore"
import { transcriptionUploadExpirationSeconds } from "../uploadExpiration"
import { readTranscriptionChargeContext } from "../billingStore"
import { getProviderMaxAudioBytes, getProviderMaxAudioDurationSeconds, resolveBatchTranscriptionPlan } from "../actions/resolveBatchTranscriptionPlan"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers the route that prepares a batch upload and returns billing limits.
export function registerTranscriptionPreflightRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/preflight",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      await ensureBillingUser(user.userId)

      const chargeContext = await readTranscriptionChargeContext({ userId: user.userId })
      const status = await readBillingStatus({
        userId: user.userId,
        planKey: null,
        cycleStartMs: chargeContext.cycleStartMs,
        cycleEndMs: chargeContext.cycleEndMs,
        includedSecondsOverride: chargeContext.includedSecondsOverride,
        freeSecondsOverride: chargeContext.freeSecondsOverride,
      })
      const plan = resolveBatchTranscriptionPlan()
      const transcriptionProvider = plan.provider
      if (transcriptionProvider === "none") {
        sendError(res, 503, "No batch transcription provider is configured")
        return
      }
      const maxAudioBytes = getProviderMaxAudioBytes(transcriptionProvider)
      const maxAudioDurationSeconds = getProviderMaxAudioDurationSeconds(transcriptionProvider)

      if (status.remainingSeconds <= 0) {
        res.status(200).json({
          allowed: false,
          remainingSeconds: status.remainingSeconds,
          planKey: status.planKey,
          transcriptionProvider,
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
        maxAudioBytes,
        maxAudioDurationSeconds,
      })
    }),
  )
}
