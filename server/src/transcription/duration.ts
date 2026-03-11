import { parseStream } from "music-metadata"
import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

const CSA1_OVERHEAD_BYTES = 32
const DEFAULT_FALLBACK_BITRATE_BPS = 128_000
const WAV_FALLBACK_BITRATE_BPS = 256_000
const WEBM_FALLBACK_BITRATE_BPS = 96_000

// Normalizes a MIME type before duration heuristics run.
function normalizeMimeType(mimeType: string): string {
  return String(mimeType || "")
    .toLowerCase()
    .split(";")[0]
    .trim()
}

// Returns the fallback bitrate used when metadata does not include one.
function getFallbackBitrateBpsForMimeType(mimeType: string): number {
  const normalized = normalizeMimeType(mimeType)
  if (normalized === "audio/wav" || normalized === "audio/x-wav") return WAV_FALLBACK_BITRATE_BPS
  if (normalized === "audio/webm" || normalized === "video/webm" || normalized === "audio/ogg") return WEBM_FALLBACK_BITRATE_BPS
  return DEFAULT_FALLBACK_BITRATE_BPS
}

// Reads duration from parsed metadata or derives it from bitrate and size.
function readDurationSecondsFromMetadata(metadata: any, decryptedSizeBytes?: number): number {
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

// Estimates duration from file size alone when metadata is incomplete.
function estimateDurationSecondsFromSizeOnly(params: { decryptedSizeBytes?: number; mimeType: string }): number {
  const { decryptedSizeBytes, mimeType } = params
  if (typeof decryptedSizeBytes !== "number" || !Number.isFinite(decryptedSizeBytes) || decryptedSizeBytes <= 0) {
    return 0
  }
  const fallbackBitrateBps = getFallbackBitrateBpsForMimeType(mimeType)
  const estimated = (decryptedSizeBytes * 8) / fallbackBitrateBps
  return Number.isFinite(estimated) && estimated > 0 ? estimated : 0
}

// Decrypts one upload and extracts its audio duration.
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

  const durationSeconds = readDurationSecondsFromMetadata(metadata, decryptedSizeBytes)
  const rawDuration = typeof metadata?.format?.duration
  if (durationSeconds <= 0) {
    const assumedBitrateBps = getFallbackBitrateBpsForMimeType(mimeType)
    const estimatedFromSizeOnly = estimateDurationSecondsFromSizeOnly({ decryptedSizeBytes, mimeType })
    if (estimatedFromSizeOnly > 0) {
      console.error("[duration] estimated duration from size-only fallback", {
        mimeType,
        encryptedSizeBytes,
        decryptedSizeBytes,
        estimatedDurationSeconds: estimatedFromSizeOnly,
        assumedBitrateBps,
        formatContainer: metadata?.format?.container,
      })
      return estimatedFromSizeOnly
    }

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
