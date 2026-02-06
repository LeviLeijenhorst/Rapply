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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function safeObjectKeys(value: unknown): string[] {
  if (!isPlainObject(value)) return []
  return Object.keys(value).slice(0, 50)
}

function safeJsonPreview(value: unknown): string {
  try {
    const json = JSON.stringify(value)
    if (typeof json !== "string") return ""
    return json.length > 500 ? json.slice(0, 500) + "â€¦" : json
  } catch {
    return ""
  }
}

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

  const maxBytes = 200 * 1024 * 1024
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, maxBytes)

  const contentType = normalizeText(mimeType) || "audio/mpeg"
  const language = normalizeLanguage(languageCode)
  console.log("[azure-speech] request", {
    language,
    contentType,
    audioBytes: audioBuffer.length,
  })
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
    body: audioBuffer as any,
  })

  const textBody = await response.text().catch(() => "")
  console.log("[azure-speech] response", {
    status: response.status,
    ok: response.ok,
    bodyPreview: textBody ? textBody.slice(0, 200) : "",
  })
  if (!response.ok) {
    throw new Error(`Azure Speech transcription failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const displayText = normalizeSpacing(String(json?.DisplayText || ""))
  if (displayText) {
    return `[00:00.0] speaker_1: ${displayText}`
  }

  const responseKeys = safeObjectKeys(json)
  const recognitionStatus = normalizeText(String(json?.RecognitionStatus || ""))
  const preview = safeJsonPreview(json)
  throw new Error(
    "No transcript returned. " +
      "Status=" +
      (recognitionStatus || "missing") +
      "; ContentType=" +
      contentType +
      "; Keys=" +
      (responseKeys.length ? responseKeys.join(",") : "none") +
      "; Preview=" +
      (preview || "empty"),
  )
}
