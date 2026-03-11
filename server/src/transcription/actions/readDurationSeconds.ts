import { computeAudioDurationSecondsFromEncryptedUpload } from "../duration"
import { fetchEncryptedUploadStream } from "../storage"

// Reads the upload twice if needed to recover audio duration from weak metadata.
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
