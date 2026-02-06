import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

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
      throw new Error(`Audio file is too large for transcription (max ${maxBytes} bytes)`)
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

function pickText(response: any): string {
  const text = normalizeText(String(response?.text || response?.transcript || response?.transcription || response?.result?.text || response?.data?.text || ""))
  return text
}

function formatTimestamp(seconds: number) {
  const s = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(s / 60)
  const remainingSeconds = s - minutes * 60
  const mm = String(minutes).padStart(2, "0")
  const ss = remainingSeconds.toFixed(1).padStart(4, "0")
  return `${mm}:${ss}`
}

function normalizeSpeakerLabel(value: unknown) {
  const text = normalizeText(String(value || ""))
  return text || "speaker_1"
}

function buildTranscriptFromSegments(response: any): string {
  const segments = Array.isArray(response?.segments) ? response.segments : Array.isArray(response?.result?.segments) ? response.result.segments : null
  if (!segments) return ""

  const lines: string[] = []
  for (const segment of segments) {
    const start = typeof segment?.start === "number" ? segment.start : Number(segment?.start)
    const text = normalizeSpacing(String(segment?.text || segment?.transcript || segment?.content || ""))
    if (!text) continue

    const speaker =
      segment?.speaker !== undefined
        ? normalizeSpeakerLabel(segment.speaker)
        : segment?.speaker_id !== undefined
          ? normalizeSpeakerLabel(`speaker_${Number(segment.speaker_id) + 1}`)
          : "speaker_1"

    lines.push(`[${formatTimestamp(start)}] ${speaker}: ${text}`)
  }

  return lines.join("\n").trim()
}

export async function runVoxtralTranscriptionFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
  apiKey: string
  model: string
}): Promise<string> {
  const apiKey = normalizeText(params.apiKey)
  if (!apiKey) {
    throw new Error("Mistral API key is not configured")
  }

  const model = normalizeText(params.model)
  if (!model) {
    throw new Error("Mistral transcription model is not configured")
  }

  const key = ensureValidAesKey(params.keyBase64)
  const decryptedAudioStream = params.encryptedStream.pipe(new Csa1DecryptStream(key))
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, 200 * 1024 * 1024)

  const FormDataConstructor = (globalThis as any).FormData
  const BlobConstructor = (globalThis as any).Blob
  if (!FormDataConstructor || !BlobConstructor) {
    throw new Error("Server runtime does not support FormData/Blob")
  }

  const mimeType = normalizeText(params.mimeType) || "audio/mpeg"
  const form = new FormDataConstructor()
  const blob = new BlobConstructor([audioBuffer], { type: mimeType })
  form.append("file", blob, "audio")
  form.append("model", model)
  form.append("response_format", "verbose_json")
  form.append("diarization", "true")
  form.append("timestamp_granularities[]", "segment")
  const languageCode = normalizeText(params.languageCode)
  if (languageCode) {
    form.append("language", languageCode)
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

  const json = textBody ? JSON.parse(textBody) : null
  const diarized = buildTranscriptFromSegments(json)
  if (diarized) {
    return diarized
  }

  const text = pickText(json)
  if (!text) {
    throw new Error("No transcript returned")
  }
  return `[00:00.0] speaker_1: ${normalizeSpacing(text)}`
}
