import { env } from "../../env"
import { Csa1DecryptStream, ensureValidAesKey } from "../csa1"
import {
  guessAudioUploadFileName,
  normalizeText,
  normalizeTranscriptSpacing,
  readStreamToBuffer,
} from "./shared"

// Checks whether a value is a plain JSON object.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

// Returns a short list of top-level keys for provider error messages.
function readObjectKeys(value: unknown): string[] {
  if (!isPlainObject(value)) return []
  return Object.keys(value).slice(0, 50)
}

// Returns a short JSON preview for provider error messages.
function buildJsonPreview(value: unknown): string {
  try {
    const json = JSON.stringify(value)
    if (typeof json !== "string") return ""
    return json.length > 500 ? `${json.slice(0, 500)}...` : json
  } catch {
    return ""
  }
}

// Normalizes the Azure region value from configuration.
function normalizeRegion(value: string): string {
  return normalizeText(value).toLowerCase()
}

// Maps shorthand language codes to Azure locale codes.
function normalizeAzureLocale(value: string): string {
  const trimmed = normalizeText(value)
  if (!trimmed) return "nl-NL"
  if (trimmed === "nl") return "nl-NL"
  if (trimmed === "en") return "en-US"
  if (trimmed === "fr") return "fr-FR"
  return trimmed
}

// Waits between transient retry attempts.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Returns whether an Azure status code is worth retrying.
function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

// Sends one batch transcription request to Azure Speech.
async function requestAzureSpeechTranscription(params: {
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
    diarization: { enabled: false },
  }

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const formData = new FormData()
      const audioBlob = new Blob([new Uint8Array(params.audioBuffer)], { type: params.contentType })
      formData.append("audio", audioBlob, guessAudioUploadFileName(params.contentType))
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
        if (attempt < 4 && shouldRetryStatus(response.status)) {
          await sleep(500 * attempt)
          continue
        }
        throw new Error(`Azure Speech batch transcription failed: status=${response.status}; response=${responseText || response.statusText}`)
      }

      return responseText ? JSON.parse(responseText) : null
    } catch (error: any) {
      const message = String(error?.message || error).toLowerCase()
      const isTransientNetworkError =
        message.includes("fetch") ||
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("econnreset") ||
        message.includes("etimedout")
      if (attempt < 4 && isTransientNetworkError) {
        await sleep(500 * attempt)
        continue
      }
      throw error
    }
  }

  throw new Error("Azure Speech batch transcription failed")
}

// Extracts a diarized transcript string from Azure Speech JSON.
function extractAzureSpeechTranscript(resultJson: any): { text: string; isDiarized: boolean } {
  const phrases = Array.isArray(resultJson?.phrases) ? resultJson.phrases : []
  const phraseText = phrases
    .map((item: any) => {
      const text = normalizeTranscriptSpacing(String(item?.text || ""))
      if (!text) return null
      return text
    })
    .filter(Boolean)

  if (phraseText.length > 0) {
    return { text: normalizeTranscriptSpacing(phraseText.join(" ")), isDiarized: false }
  }

  const combinedText = Array.isArray(resultJson?.combinedPhrases)
    ? resultJson.combinedPhrases
        .map((item: any) => normalizeTranscriptSpacing(String(item?.text || "")))
        .filter(Boolean)
        .join(" ")
    : ""

  return { text: combinedText, isDiarized: false }
}

// Runs batch transcription with Azure Speech for one encrypted upload.
export async function runAzureSpeechBatchTranscription(params: {
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

  const aesKey = ensureValidAesKey(params.keyBase64)
  const decryptedAudioStream = params.encryptedStream.pipe(new Csa1DecryptStream(aesKey))
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, 250 * 1024 * 1024)
  const resultJson = await requestAzureSpeechTranscription({
    region,
    key,
    locale: normalizeAzureLocale(params.languageCode),
    audioBuffer,
    contentType: normalizeText(params.mimeType).toLowerCase() || "application/octet-stream",
  })

  const transcript = extractAzureSpeechTranscript(resultJson)
  if (!transcript.text) {
    throw new Error(
      "No transcript returned. " +
        `Keys=${readObjectKeys(resultJson).join(",") || "none"}; ` +
        `Preview=${buildJsonPreview(resultJson) || "empty"}`,
    )
  }

  return transcript.text
}
