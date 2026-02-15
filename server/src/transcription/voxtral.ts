import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

// Trims text-like inputs to a normalized non-null string.
function normalizeText(value: string) {
  return String(value || "").trim()
}

// Normalizes punctuation spacing for cleaner transcript text.
function normalizeSpacing(value: string) {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

// Reads a stream fully into memory while enforcing a strict size cap.
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

// Formats a floating-point second value as mm:ss.s.
function formatTimestamp(seconds: number) {
  const s = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(s / 60)
  const remainingSeconds = s - minutes * 60
  const mm = String(minutes).padStart(2, "0")
  const ss = remainingSeconds.toFixed(1).padStart(4, "0")
  return `${mm}:${ss}`
}

// Normalizes provider speaker labels into a stable string key.
function normalizeSpeakerLabel(value: unknown) {
  const text = normalizeText(String(value || ""))
  return text || "speaker_1"
}

// Builds a diarized transcript from provider segment output.
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
          ? normalizeSpeakerLabel(segment.speaker_id)
          : segment?.speakerId !== undefined
            ? normalizeSpeakerLabel(segment.speakerId)
            : "speaker_1"

    lines.push(`[${formatTimestamp(start)}] ${speaker}: ${text}`)
  }

  return lines.join("\n").trim()
}

// Decrypts uploaded audio, submits it to Mistral, and returns diarized transcript text.
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
  form.append("diarize", "true")
  form.append("timestamp_granularities", "segment")

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
  const segmentsLength = Array.isArray(json?.segments) ? json.segments.length : null
  console.log("[transcription:mistral] response", { hasSegments: segmentsLength !== null, segmentsLength })
  if (!diarized) {
    throw new Error("Mistral transcription did not return diarized segments")
  }
  return diarized
}
