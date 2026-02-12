import { parseStream } from "music-metadata"
import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

const CSA1_OVERHEAD_BYTES = 32

function readDurationSeconds(metadata: any): number {
  const value = typeof metadata?.format?.duration === "number" ? metadata.format.duration : 0
  return Number.isFinite(value) && value > 0 ? value : 0
}

export async function computeAudioDurationSecondsFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  encryptedSizeBytes?: number
}): Promise<number> {
  const { encryptedStream, keyBase64, mimeType, encryptedSizeBytes } = params
  const key = ensureValidAesKey(keyBase64)
  const decryptedStream = encryptedStream.pipe(new Csa1DecryptStream(key))
  const decryptedSizeBytes =
    typeof encryptedSizeBytes === "number" && Number.isFinite(encryptedSizeBytes) && encryptedSizeBytes > CSA1_OVERHEAD_BYTES
      ? Math.floor(encryptedSizeBytes - CSA1_OVERHEAD_BYTES)
      : undefined

  const metadata = await parseStream(
    decryptedStream as any,
    {
      ...(mimeType ? { mimeType } : {}),
      size: decryptedSizeBytes,
    },
    { duration: true },
  )
  const durationSeconds = readDurationSeconds(metadata)
  if (durationSeconds <= 0) {
    throw new Error("Failed to determine audio duration")
  }
  return durationSeconds
}

