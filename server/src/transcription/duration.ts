import { parseStream } from "music-metadata"
import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

const CSA1_OVERHEAD_BYTES = 32

function readDurationSeconds(metadata: any, decryptedSizeBytes?: number): number {
  const value = typeof metadata?.format?.duration === "number" ? metadata.format.duration : 0
  if (Number.isFinite(value) && value > 0) return value

  const bitrate = typeof metadata?.format?.bitrate === "number" ? metadata.format.bitrate : 0
  if (
    Number.isFinite(bitrate) &&
    bitrate > 0 &&
    typeof decryptedSizeBytes === "number" &&
    Number.isFinite(decryptedSizeBytes) &&
    decryptedSizeBytes > 0
  ) {
    // Some MP4/M4A recordings do not expose container duration, but bitrate is available.
    // In that case derive duration from size and bitrate to keep transcription unblocked.
    const estimated = (decryptedSizeBytes * 8) / bitrate
    if (Number.isFinite(estimated) && estimated > 0) return estimated
  }

  return 0
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

  let metadata: any
  try {
    metadata = await parseStream(
      decryptedStream as any,
      {
        ...(mimeType ? { mimeType } : {}),
        size: decryptedSizeBytes,
      },
      { duration: true },
    )
  } catch (parseError: any) {
    console.error("[duration] parseStream failed", {
      mimeType,
      encryptedSizeBytes,
      decryptedSizeBytes,
      errorMessage: String(parseError?.message || parseError),
    })
    throw parseError
  }

  const durationSeconds = readDurationSeconds(metadata, decryptedSizeBytes)
  const rawDuration = typeof metadata?.format?.duration
  if (durationSeconds <= 0) {
    console.error("[duration] no valid duration from metadata", {
      mimeType,
      encryptedSizeBytes,
      decryptedSizeBytes,
      rawDuration,
      formatDuration: metadata?.format?.duration,
      formatBitrate: metadata?.format?.bitrate,
      formatContainer: metadata?.format?.container,
    })
    throw new Error("Failed to determine audio duration")
  }
  return durationSeconds
}
