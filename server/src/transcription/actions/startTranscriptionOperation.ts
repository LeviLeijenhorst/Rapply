import { TranscriptionError } from "../../errors/TranscriptionError"
import { Csa1DecryptStream, ensureValidAesKey } from "../csa1"
import { chargeSecondsOnce, readTranscriptionChargeContext, refundChargedSeconds } from "../billingStore"
import {
  attachOperationInput,
  buildOperationResponse,
  markInputCompleted,
  markInputFailed,
  markOperationFailed,
  markOperationSubmitted,
  readOperationById,
} from "../operationStore"
import { type BatchTranscriptionProvider, type TranscriptionOperationResponse } from "../operationTypes"
import { startAzureSpeechTranscription } from "../providers/azureSpeech"
import { readStreamToBuffer } from "../providers/shared"
import { startWhisperFastTranscription } from "../providers/whisperFast"
import { startSpeechmaticsTranscription } from "../providers/speechmatics"
import { deleteEncryptedUpload, fetchEncryptedUploadStream, getEncryptedUploadSize } from "../storage"
import { consumeUploadToken } from "../uploadTokenStore"
import { readDurationSeconds } from "./readDurationSeconds"
import { getProviderMaxAudioDurationSeconds, resolveBatchTranscriptionPlan } from "./resolveBatchTranscriptionPlan"

async function startProviderTranscription(params: {
  provider: BatchTranscriptionProvider
  operationId: string
  audioBuffer: Buffer
  mimeType: string
  languageCode: string
}) {
  if (params.provider === "whisper-fast") {
    return await startWhisperFastTranscription(params)
  }
  if (params.provider === "speechmatics") {
    return await startSpeechmaticsTranscription(params)
  }
  return await startAzureSpeechTranscription(params)
}

export async function startTranscriptionOperation(params: {
  userId: string
  operationId: string
  uploadToken: string
  keyBase64: string
  inputId: string | null
  languageCode: string
  mimeType: string
}): Promise<TranscriptionOperationResponse> {
  const plan = resolveBatchTranscriptionPlan()
  if (plan.provider === "none") {
    throw new TranscriptionError("No batch transcription provider is configured")
  }

  let uploadPath = ""

  try {
    const consumed = await consumeUploadToken({
      userId: params.userId,
      uploadToken: params.uploadToken,
      operationId: params.operationId,
    })
    uploadPath = consumed.uploadPath
    if (!uploadPath.startsWith(`${params.userId}/`)) {
      throw new TranscriptionError("Invalid uploadPath")
    }

    const uploadBytes = await getEncryptedUploadSize({ blobName: uploadPath })
    const durationSeconds = await readDurationSeconds({
      uploadPath,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      encryptedSizeBytes: uploadBytes,
    })
    const maxAudioDurationSeconds = getProviderMaxAudioDurationSeconds(plan.provider)
    if (typeof maxAudioDurationSeconds === "number" && durationSeconds > maxAudioDurationSeconds) {
      throw new TranscriptionError(`Audio duration exceeds maximum allowed length (max ${Math.floor(maxAudioDurationSeconds / 60)} minutes).`)
    }

    await attachOperationInput({
      operationId: params.operationId,
      userId: params.userId,
      inputId: params.inputId,
      languageCode: params.languageCode,
      mimeType: params.mimeType,
      uploadPath,
      provider: plan.provider,
    })

    const secondsToCharge = Math.max(1, Math.ceil(durationSeconds))
    const chargeContext = await readTranscriptionChargeContext({ userId: params.userId })
    await chargeSecondsOnce({
      userId: params.userId,
      operationId: params.operationId,
      secondsToCharge,
      planKey: null,
      cycleStartMs: chargeContext.cycleStartMs,
      cycleEndMs: chargeContext.cycleEndMs,
      includedSecondsOverride: chargeContext.includedSecondsOverride,
      freeSecondsOverride: chargeContext.freeSecondsOverride,
      nonExpiringTotalSecondsOverride: undefined,
    })

    const encryptedUploadStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
    const aesKey = ensureValidAesKey(params.keyBase64)
    const decryptedAudioStream = encryptedUploadStream.pipe(new Csa1DecryptStream(aesKey))
    const audioBuffer = await readStreamToBuffer(decryptedAudioStream, 250 * 1024 * 1024)

    const providerResult = await startProviderTranscription({
      provider: plan.provider,
      operationId: params.operationId,
      audioBuffer,
      mimeType: params.mimeType,
      languageCode: params.languageCode,
    })

    await markOperationSubmitted({
      operationId: params.operationId,
      userId: params.userId,
      provider: plan.provider,
      result: providerResult,
    })

    if (providerResult.status === "completed" && params.inputId) {
      await markInputCompleted({
        inputId: params.inputId,
        transcript: providerResult.transcript,
        languageCode: params.languageCode,
      })
    }
    if (providerResult.status === "completed") {
      await deleteEncryptedUpload({ blobName: uploadPath }).catch(() => undefined)
    }

    const operation = await readOperationById({
      operationId: params.operationId,
      userId: params.userId,
    })
    if (!operation) {
      throw new TranscriptionError("Transcription operation was not found after start")
    }

    return buildOperationResponse(operation)
  } catch (error: any) {
    const errorMessage = String(error?.message || error)
    await refundChargedSeconds({ userId: params.userId, operationId: params.operationId }).catch((refundError) => {
      console.error("[transcription] refund failed after operation error", { operationId: params.operationId, userId: params.userId, error: String(refundError?.message || refundError) })
    })
    await markOperationFailed({ operationId: params.operationId, userId: params.userId, errorMessage }).catch(() => undefined)
    if (params.inputId) {
      await markInputFailed({ inputId: params.inputId, errorMessage }).catch(() => undefined)
    }
    throw error
  }
}
