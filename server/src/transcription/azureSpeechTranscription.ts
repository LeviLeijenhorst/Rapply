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
  const formData = new FormData()
  const audioBytes = new Uint8Array(params.audioBuffer)
  const audioBlob = new Blob([audioBytes], { type: params.contentType })
  formData.append("audio", audioBlob, "audio.wav")
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
    throw new Error(
      `Azure Speech fast transcription failed: status=${response.status}; response=${responseText || response.statusText}`,
    )
  }
  return responseText ? JSON.parse(responseText) : null
}

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
  const contentType = normalizeText(mimeType).toLowerCase()
  if (!contentType.startsWith("audio/wav")) {
    throw new Error("Azure Speech transcription requires audio/wav")
  }

  const aesKey = ensureValidAesKey(keyBase64)
  const decryptedAudioStream = encryptedStream.pipe(new Csa1DecryptStream(aesKey))

  const maxBytes = 250 * 1024 * 1024
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, maxBytes)
  const locale = normalizeLanguage(languageCode)
  const resultJson = await requestFastTranscription({ region, key, locale, audioBuffer, contentType: "audio/wav" })
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
