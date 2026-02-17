import { execute } from "../../db"
import { env } from "../../env"
import { runAzureSpeechTranscriptionFromEncryptedUpload } from "../../transcription/azureSpeechTranscription"
import { computeAudioDurationSecondsFromEncryptedUpload } from "../../transcription/duration"
import { fetchEncryptedUploadStream } from "../../transcription/storage"
import type { StartRequest, TranscriptionProvider } from "./types"

const AZURE_SPEECH_MAX_AUDIO_BYTES = 250 * 1024 * 1024

// Chooses the configured transcription provider based on available secrets.
export function resolveTranscriptionProvider(): TranscriptionProvider {
  if (env.azureSpeechKey && env.azureSpeechRegion) return "azure-speech"
  return "none"
}

// Returns the max source-audio size in bytes for the selected provider.
export function getProviderMaxAudioBytes(provider: TranscriptionProvider): number | null {
  if (provider === "azure-speech") return AZURE_SPEECH_MAX_AUDIO_BYTES
  return null
}

// Parses and validates required start-route fields from the request body.
export function readStartRequest(body: any): StartRequest | null {
  const operationId = typeof body?.operationId === "string" ? body.operationId.trim() : ""
  const uploadToken = typeof body?.uploadToken === "string" ? body.uploadToken.trim() : ""
  const keyBase64 = typeof body?.keyBase64 === "string" ? body.keyBase64.trim() : ""
  if (!operationId || !uploadToken || !keyBase64) return null
  return {
    operationId,
    uploadToken,
    keyBase64,
    languageCode: typeof body?.language_code === "string" ? body.language_code.trim() || "nl" : "nl",
    mimeType: typeof body?.mime_type === "string" ? body.mime_type.trim() || "audio/m4a" : "audio/m4a",
    includeSummary: body?.include_summary !== false,
  }
}

// Computes duration from encrypted upload, retrying without mime hint if parsing fails.
export async function readDurationSeconds(params: {
  uploadPath: string
  keyBase64: string
  mimeType: string
  encryptedSizeBytes: number
}): Promise<number> {
  try {
    const durationStream = await fetchEncryptedUploadStream({ blobName: params.uploadPath })
    return await computeAudioDurationSecondsFromEncryptedUpload({
      encryptedStream: durationStream,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      encryptedSizeBytes: params.encryptedSizeBytes,
    })
  } catch {
    const fallbackDurationStream = await fetchEncryptedUploadStream({ blobName: params.uploadPath })
    return await computeAudioDurationSecondsFromEncryptedUpload({
      encryptedStream: fallbackDurationStream,
      keyBase64: params.keyBase64,
      mimeType: "",
      encryptedSizeBytes: params.encryptedSizeBytes,
    })
  }
}

// Runs transcription with the selected provider and returns transcript text.
export async function runTranscription(params: {
  provider: TranscriptionProvider
  uploadPath: string
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const transcriptionStream = await fetchEncryptedUploadStream({ blobName: params.uploadPath })
  if (params.provider === "azure-speech") {
    return await runAzureSpeechTranscriptionFromEncryptedUpload({
      encryptedStream: transcriptionStream,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      languageCode: params.languageCode,
    })
  }
  throw new Error("No transcription provider is configured")
}

// Marks a transcription operation as completed in storage.
export async function markOperationCompleted(params: { operationId: string; userId: string }): Promise<void> {
  await execute(
    `
    update public.transcription_operations
    set status = 'completed',
        completed_at = now()
    where operation_id = $1
      and user_id = $2
    `,
    [params.operationId, params.userId],
  )
}

// Marks a transcription operation as failed and stores the error message.
export async function markOperationFailed(params: { operationId: string; userId: string; errorMessage: string }): Promise<void> {
  await execute(
    `
    insert into public.transcription_operations (operation_id, user_id, status, failed_at, error_message)
    values ($1, $2, 'failed', now(), $3)
    on conflict (operation_id) do update
      set user_id = excluded.user_id,
          status = excluded.status,
          failed_at = now(),
          error_message = excluded.error_message
    `,
    [params.operationId, params.userId, params.errorMessage],
  )
}

