import { runAzureSpeechTranscriptionFromEncryptedUpload } from "../../../transcription/azureSpeechTranscription"
import { runSpeechmaticsTranscriptionFromEncryptedUpload } from "../../../transcription/speechmaticsTranscription"
import { fetchEncryptedUploadStream } from "../../../transcription/storage"
import { TranscriptionError } from "../../../errors/TranscriptionError"
import type { TranscriptionProvider } from "../types"

export async function runTranscription(params: {
  provider: TranscriptionProvider
  uploadPath: string
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const transcriptionStream = await fetchEncryptedUploadStream({ blobName: params.uploadPath })

  if (params.provider === "azure-speech-fast" || params.provider === "azure-speech-realtime") {
    return await runAzureSpeechTranscriptionFromEncryptedUpload({
      encryptedStream: transcriptionStream,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      languageCode: params.languageCode,
    })
  }

  if (params.provider === "speechmatics-batch" || params.provider === "speechmatics-realtime") {
    return await runSpeechmaticsTranscriptionFromEncryptedUpload({
      encryptedStream: transcriptionStream,
      keyBase64: params.keyBase64,
      mimeType: params.mimeType,
      languageCode: params.languageCode,
    })
  }

  throw new TranscriptionError("No transcription provider is configured")
}
