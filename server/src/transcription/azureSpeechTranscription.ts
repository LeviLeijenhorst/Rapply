import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"
import { env } from "../env"

// Intent: normalizeText
function normalizeText(value: string) {
  return String(value || "").trim()
}

// Intent: normalizeSpacing
function normalizeSpacing(value: string) {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

// Intent: guessUploadFileName
function guessUploadFileName(contentType: string): string {
  const normalized = normalizeText(contentType).toLowerCase()
  if (normalized.includes("mpeg") || normalized.includes("mp3")) return "audio.mp3"
  if (normalized.includes("mp4") || normalized.includes("m4a") || normalized.includes("aac")) return "audio.mp4"
  if (normalized.includes("ogg") || normalized.includes("opus")) return "audio.ogg"
  if (normalized.includes("webm")) return "audio.webm"
  if (normalized.includes("flac")) return "audio.flac"
  if (normalized.includes("wav")) return "audio.wav"
  return "audio.bin"
}

// Intent: isPlainObject
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

// Intent: safeObjectKeys
function safeObjectKeys(value: unknown): string[] {
  if (!isPlainObject(value)) return []
  return Object.keys(value).slice(0, 50)
}

// Intent: safeJsonPreview
function safeJsonPreview(value: unknown): string {
  try {
    const json = JSON.stringify(value)
    if (typeof json !== "string") return ""
    return json.length > 500 ? json.slice(0, 500) + "â€¦" : json
  } catch {
    return ""
  }
}

// Intent: readStreamToBuffer
async function readStreamToBuffer(stream: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream as any) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > maxBytes) {
      throw new Error(`Audio file is too large for transcription (max ${maxBytes} bytes)`)
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

// Intent: normalizeRegion
function normalizeRegion(value: string) {
  return normalizeText(value).toLowerCase()
}

// Intent: normalizeLanguage
function normalizeLanguage(value: string) {
  const trimmed = normalizeText(value)
  if (!trimmed) return "nl-NL"
  if (trimmed === "nl") return "nl-NL"
  if (trimmed === "en") return "en-US"
  if (trimmed === "fr") return "fr-FR"
  return trimmed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetrySpeechStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

// Intent: requestFastTranscription
async function requestFastTranscription(params: {
  region: string
  key: string
  locale: string
  audioBuffer: Buffer
  contentType: string
}): Promise<any> {
  const url = `https://${params.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`
  const definition = {
    locales: [params.locale],
    profanityFilterMode: "Masked",
    diarization: {
      maxSpeakers: 6,
      enabled: true,
    },
  }
  const maxAttempts = 4
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const formData = new FormData()
      const audioBytes = new Uint8Array(params.audioBuffer)
      const audioBlob = new Blob([audioBytes], { type: params.contentType })
      formData.append("audio", audioBlob, guessUploadFileName(params.contentType))
      formData.append("definition", JSON.stringify(definition))
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": params.key,
        },
        body: formData,
      })
      const responseText = await response.text().catch(() => "")
      if (!response.ok) {
        const message = `Azure Speech fast transcription failed: status=${response.status}; response=${responseText || response.statusText}`
        if (attempt < maxAttempts && shouldRetrySpeechStatus(response.status)) {
          await sleep(500 * attempt)
          continue
        }
        throw new Error(message)
      }
      return responseText ? JSON.parse(responseText) : null
    } catch (error: any) {
      const message = String(error?.message || error)
      const normalizedMessage = message.toLowerCase()
      const isTransientNetwork =
        normalizedMessage.includes("fetch") ||
        normalizedMessage.includes("network") ||
        normalizedMessage.includes("timeout") ||
        normalizedMessage.includes("econnreset") ||
        normalizedMessage.includes("etimedout")
      if (attempt < maxAttempts && isTransientNetwork) {
        await sleep(500 * attempt)
        continue
      }
      lastError = error instanceof Error ? error : new Error(message)
      break
    }
  }

  throw lastError || new Error("Azure Speech fast transcription failed")
}

// Intent: extractTranscript
function extractTranscript(resultJson: any): { text: string; isDiarized: boolean } {
  const phrases = Array.isArray(resultJson?.phrases) ? resultJson.phrases : []
  const diarizedLines = phrases
    .map((item: any) => {
      const speakerRaw = item?.speaker
      const speakerNumber = Number.isFinite(Number(speakerRaw)) ? Number(speakerRaw) + 1 : null
      const speaker = speakerNumber ? `speaker_${speakerNumber}` : ""
      const text = normalizeSpacing(String(item?.text || ""))
      if (!speaker || !text) return null
      return `${speaker}: ${text}`
    })
    .filter(Boolean)
  if (diarizedLines.length) {
    return { text: diarizedLines.join("\n"), isDiarized: true }
  }
  const combined = Array.isArray(resultJson?.combinedPhrases)
    ? resultJson.combinedPhrases
        .map((item: any) => normalizeSpacing(String(item?.text || "")))
        .filter(Boolean)
        .join(" ")
    : ""
  return { text: combined, isDiarized: false }
}

// Intent: runAzureSpeechTranscriptionFromEncryptedUpload
export async function runAzureSpeechTranscriptionFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const key = normalizeText(env.azureSpeechKey)
  if (!key) {
    throw new Error("Azure Speech key is not configured")
  }
  const region = normalizeRegion(env.azureSpeechRegion)
  if (!region) {
    throw new Error("Azure Speech region is not configured")
  }

  const { encryptedStream, keyBase64, mimeType, languageCode } = params
  const contentType = normalizeText(mimeType).toLowerCase() || "application/octet-stream"

  const aesKey = ensureValidAesKey(keyBase64)
  const decryptedAudioStream = encryptedStream.pipe(new Csa1DecryptStream(aesKey))

  const maxBytes = 250 * 1024 * 1024
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, maxBytes)
  const locale = normalizeLanguage(languageCode)
  const resultJson = await requestFastTranscription({ region, key, locale, audioBuffer, contentType })
  const transcriptResult = extractTranscript(resultJson)
  if (!transcriptResult.text) {
    const preview = safeJsonPreview(resultJson)
    const keys = safeObjectKeys(resultJson)
    throw new Error(
      "No transcript returned. " +
        "Keys=" +
        (keys.length ? keys.join(",") : "none") +
        "; Preview=" +
        (preview || "empty"),
    )
  }
  if (transcriptResult.isDiarized) {
    return transcriptResult.text
  }
  return `[00:00.0] speaker_1: ${transcriptResult.text}`
}

