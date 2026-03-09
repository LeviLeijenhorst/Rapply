import { computeAudioDurationSecondsFromEncryptedUpload } from "../../../transcription/duration"
import { fetchEncryptedUploadStream } from "../../../transcription/storage"

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
