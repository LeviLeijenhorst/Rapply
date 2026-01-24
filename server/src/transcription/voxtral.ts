import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function formatTimestampMmSsTenths(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const totalTenths = Math.floor(safeSeconds * 10 + 1e-6)
  const minutes = Math.floor(totalTenths / 600)
  const secs = Math.floor((totalTenths % 600) / 10)
  const tenths = totalTenths % 10
  return `${pad2(minutes)}:${pad2(secs)}.${tenths}`
}

function normalizeSpacing(value: string) {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function sniffAudioHeader(buffer: Buffer): { kind: string; hint: string } {
  const head = buffer.subarray(0, Math.min(buffer.length, 64))
  const ascii = head.toString("ascii")
  if (ascii.startsWith("RIFF")) return { kind: "wav", hint: "RIFF" }
  if (ascii.startsWith("OggS")) return { kind: "ogg", hint: "OggS" }
  if (ascii.startsWith("fLaC")) return { kind: "flac", hint: "fLaC" }
  if (ascii.startsWith("ID3")) return { kind: "mp3", hint: "ID3" }
  const ftypIdx = ascii.indexOf("ftyp")
  if (ftypIdx !== -1) return { kind: "mp4/m4a", hint: "ftyp" }
  const hex = head.subarray(0, 16).toString("hex")
  return { kind: "unknown", hint: hex }
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

type VoxtralSegment = {
  start?: number
  end?: number
  text?: string
  start_time?: number
  end_time?: number
  startTime?: number
  endTime?: number
  content?: string
}

function formatSegmentsToCoachScribeLines(segments: VoxtralSegment[]) {
  const lines: string[] = []
  for (const seg of segments) {
    const startRaw =
      typeof seg?.start === "number"
        ? seg.start
        : typeof seg?.start_time === "number"
          ? seg.start_time
          : typeof seg?.startTime === "number"
            ? seg.startTime
            : null
    const start = typeof startRaw === "number" && Number.isFinite(startRaw) ? startRaw : null
    const text = normalizeSpacing(String(seg?.text || seg?.content || ""))
    if (!text) continue
    const ts = formatTimestampMmSsTenths(start ?? 0)
    lines.push(`[${ts}] speaker_1: ${text}`)
  }
  if (lines.length > 0) return lines.join("\n")
  return ""
}

function pickFirstNonEmptyString(values: unknown[]): string {
  for (const v of values) {
    const s = typeof v === "string" ? v : ""
    const t = s.trim()
    if (t) return t
  }
  return ""
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
    return json.length > 500 ? json.slice(0, 500) + "…" : json
  } catch {
    return ""
  }
}

export async function runVoxtralTranscriptionFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
  apiKey: string
  model: string
}): Promise<string> {
  const apiKey = String(params.apiKey || "").trim()
  if (!apiKey) {
    throw new Error("Mistral API key is not configured")
  }

  const model = String(params.model || "").trim()
  if (!model) {
    throw new Error("Mistral transcription model is not configured")
  }

  const { encryptedStream, keyBase64, mimeType, languageCode } = params

  const key = ensureValidAesKey(keyBase64)
  const decryptedAudioStream = encryptedStream.pipe(new Csa1DecryptStream(key))

  const maxBytes = 50 * 1024 * 1024
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, maxBytes)

  const FormDataConstructor = (globalThis as any).FormData
  const BlobConstructor = (globalThis as any).Blob
  if (!FormDataConstructor || !BlobConstructor) {
    throw new Error("Server runtime does not support FormData/Blob")
  }

  const rawMimeType = String(mimeType || "")
  const normalizedMimeType = rawMimeType === "audio/m4a" ? "audio/mp4" : String(rawMimeType || "audio/mp4")
  const extension =
    normalizedMimeType === "audio/mpeg"
      ? "mp3"
      : normalizedMimeType === "audio/wav"
        ? "wav"
        : normalizedMimeType === "audio/webm"
          ? "webm"
          : normalizedMimeType === "audio/ogg"
            ? "ogg"
    : "m4a"

  const form = new FormDataConstructor()
  const blob = new BlobConstructor([audioBuffer], { type: normalizedMimeType })
  form.append("file", blob, `audio.${extension}`)
  form.append("model", model)
  const requestedLanguageCode = String(languageCode || "").trim()
  const shouldSendLanguage =
    requestedLanguageCode === "en" ||
    requestedLanguageCode === "en-US" ||
    requestedLanguageCode === "en-GB" ||
    requestedLanguageCode === "fr" ||
    requestedLanguageCode === "fr-FR"
  if (shouldSendLanguage) {
    form.append("language", requestedLanguageCode)
  }

  const response = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: form as any,
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Mistral transcription failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const finishReason = typeof json?.finish_reason === "string" ? json.finish_reason : null

  const text = normalizeSpacing(
    pickFirstNonEmptyString([
      json?.text,
      json?.transcript,
      json?.transcription,
      json?.result?.text,
      json?.data?.text,
      json?.output?.text,
    ]),
  )

  const segmentsRaw =
    Array.isArray(json?.segments)
      ? json.segments
      : Array.isArray(json?.result?.segments)
        ? json.result.segments
        : Array.isArray(json?.data?.segments)
          ? json.data.segments
          : null
  const segments = Array.isArray(segmentsRaw) ? (segmentsRaw as VoxtralSegment[]) : []

  const formattedFromSegments = formatSegmentsToCoachScribeLines(segments)
  if (formattedFromSegments) return formattedFromSegments

  if (text) {
    return `[00:00.0] speaker_1: ${text}`
  }

  const meta = {
    responseKeys: safeObjectKeys(json),
    responseType: typeof json?.object === "string" ? json.object : null,
    hasTextField: typeof json?.text === "string",
    textLength: typeof json?.text === "string" ? json.text.length : null,
    segmentsCount: segments.length,
    firstSegmentKeys: segments.length > 0 ? safeObjectKeys(segments[0] as any) : [],
    finishReason,
    mimeType: normalizedMimeType,
    audioHeader: sniffAudioHeader(audioBuffer),
    requestedLanguageCode: requestedLanguageCode || null,
    languageSent: shouldSendLanguage,
  }
  throw new Error("No transcript returned")
}

