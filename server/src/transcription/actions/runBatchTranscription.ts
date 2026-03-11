import { TranscriptionError } from "../../errors/TranscriptionError"
import { runAzureSpeechBatchTranscription } from "../providers/azureSpeech"
import { runSpeechmaticsBatchTranscription } from "../providers/speechmatics"
import { fetchEncryptedUploadStream } from "../storage"
import type { TranscriptionProvider } from "../routes/types"

// Runs batch transcription for one stored upload with the selected provider.
export async function runBatchTranscription(params: {
  provider: TranscriptionProvider
  uploadPath: string
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const encryptedUploadStream = await fetchEncryptedUploadStream({ blobName: params.uploadPath })

  if (params.provider === "azure-speech-fast" || params.provider === "azure-speech-realtime") {
    return await runAzureSpeechBatchTranscription({
      encryptedStream: encryptedUploadStream,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      languageCode: params.languageCode,
    })
  }

  if (params.provider === "speechmatics-batch" || params.provider === "speechmatics-realtime") {
    return await runSpeechmaticsBatchTranscription({
      encryptedStream: encryptedUploadStream,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      languageCode: params.languageCode,
    })
  }

  throw new TranscriptionError("No transcription provider is configured")
}
