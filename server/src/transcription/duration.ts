import { parseStream } from "music-metadata"
import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

export async function computeAudioDurationSecondsFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
}): Promise<number> {
  const { encryptedStream, keyBase64, mimeType } = params
  const key = ensureValidAesKey(keyBase64)
  const decryptedStream = encryptedStream.pipe(new Csa1DecryptStream(key))

  const metadata = await parseStream(decryptedStream as any, { mimeType }, { duration: true })
  const durationSeconds = typeof metadata.format?.duration === "number" ? metadata.format.duration : 0
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Failed to determine audio duration")
  }
  return durationSeconds
}

