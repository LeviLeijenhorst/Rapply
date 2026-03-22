import { refundChargedSeconds } from "../billingStore"
import {
  buildOperationResponse,
  markInputCompleted,
  markInputFailed,
  markOperationCompleted,
  markOperationFailed,
  markOperationRunning,
  readOperationById,
} from "../operationStore"
import type { ProviderOperationPollResult, TranscriptionOperationResponse } from "../operationTypes"
import { pollWhisperFastTranscription } from "../providers/whisperFast"
import { pollSpeechmaticsTranscription } from "../providers/speechmatics"
import { deleteEncryptedUpload } from "../storage"

async function pollProvider(operation: NonNullable<Awaited<ReturnType<typeof readOperationById>>>): Promise<ProviderOperationPollResult> {
  const provider = String(operation.provider || "").trim()
  if (provider === "whisper-fast") {
    return await pollWhisperFastTranscription({
      externalJobId: String(operation.externalJobId || ""),
      externalStatusPath: String(operation.externalStatusPath || ""),
      externalResultPath: String(operation.externalResultPath || ""),
    })
  }
  if (provider === "speechmatics") {
    return await pollSpeechmaticsTranscription({
      externalJobId: String(operation.externalJobId || ""),
    })
  }
  throw new Error("Polling is not supported for this transcription provider")
}

export async function refreshTranscriptionOperation(params: {
  userId: string
  operationId: string
}): Promise<TranscriptionOperationResponse> {
  const operation = await readOperationById(params)
  if (!operation) {
    throw new Error("Transcription operation not found")
  }
  if (operation.status === "completed" || operation.status === "failed" || operation.status === "cancelled") {
    return buildOperationResponse(operation)
  }
  if (!operation.externalJobId) {
    return buildOperationResponse(operation)
  }

  const polled = await pollProvider(operation)
  if (polled.status === "queued" || polled.status === "running") {
    if (polled.status === "running") {
      await markOperationRunning(params)
    }
  } else if (polled.status === "completed") {
    await markOperationCompleted({
      operationId: params.operationId,
      userId: params.userId,
      transcript: polled.transcript,
    })
    if (operation.inputId) {
      await markInputCompleted({
        inputId: operation.inputId,
        transcript: polled.transcript,
        languageCode: operation.languageCode,
      })
    }
    if (operation.uploadPath) {
      await deleteEncryptedUpload({ blobName: operation.uploadPath }).catch(() => undefined)
    }
  } else if (polled.status === "failed") {
    const errorMessage = polled.errorMessage
    await markOperationFailed({
      operationId: params.operationId,
      userId: params.userId,
      errorMessage,
    })
    await refundChargedSeconds({
      userId: params.userId,
      operationId: params.operationId,
    }).catch(() => undefined)
    if (operation.inputId) {
      await markInputFailed({
        inputId: operation.inputId,
        errorMessage,
      }).catch(() => undefined)
    }
  }

  const refreshedOperation = await readOperationById(params)
  if (!refreshedOperation) {
    throw new Error("Transcription operation not found after refresh")
  }

  return buildOperationResponse(refreshedOperation)
}
