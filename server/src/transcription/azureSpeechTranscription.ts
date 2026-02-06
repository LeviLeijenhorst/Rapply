import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"
import { env } from "../env"

function normalizeText(value: string) {
  return String(value || "").trim()
}

function normalizeSpacing(value: string) {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

async function readStreamToBuffer(stream: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream as any) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > maxBytes) {
      throw new Error("Audio file is too large for transcription")
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

function normalizeRegion(value: string) {
  return normalizeText(value).toLowerCase()
}

function normalizeLanguage(value: string) {
  const trimmed = normalizeText(value)
  if (!trimmed) return "nl-NL"
  if (trimmed === "nl") return "nl-NL"
  if (trimmed === "en") return "en-US"
  if (trimmed === "fr") return "fr-FR"
  return trimmed
}

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

  const aesKey = ensureValidAesKey(keyBase64)
  const decryptedAudioStream = encryptedStream.pipe(new Csa1DecryptStream(aesKey))

  const maxBytes = 50 * 1024 * 1024
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, maxBytes)

  const contentType = normalizeText(mimeType) || "audio/mpeg"
  const language = normalizeLanguage(languageCode)
  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(
    language,
  )}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": contentType,
      Accept: "application/json",
    },
    body: audioBuffer,
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Azure Speech transcription failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const displayText = normalizeSpacing(String(json?.DisplayText || ""))
  if (displayText) {
    return `[00:00.0] speaker_1: ${displayText}`
  }

  throw new Error("No transcript returned")
}
