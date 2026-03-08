import { env } from "../env"
import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"

type SpeechmaticsJobResponse = {
  id?: string
  job?: { id?: string }
}

function normalizeText(value: unknown): string {
  return String(value || "").trim()
}

function normalizeSpacing(value: string): string {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

function normalizeLanguageCode(value: string): string {
  const trimmed = normalizeText(value).toLowerCase()
  if (!trimmed || trimmed === "nl-nl") return "nl"
  if (trimmed === "en-us") return "en"
  if (trimmed === "fr-fr") return "fr"
  return trimmed
}

function normalizeBatchApiBase(value: string): string {
  const trimmed = normalizeText(value)
  return trimmed.replace(/\/+$/g, "") || "https://asr.api.speechmatics.com/v2"
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
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

function readJobId(payload: SpeechmaticsJobResponse | null): string {
  return normalizeText(payload?.id || payload?.job?.id)
}

async function createSpeechmaticsJob(params: {
  apiBase: string
  apiKey: string
  audioBuffer: Buffer
  contentType: string
  language: string
}): Promise<string> {
  const config = {
    type: "transcription",
    transcription_config: {
      language: params.language,
      diarization: "speaker",
    },
  }

  const formData = new FormData()
  formData.append("config", JSON.stringify(config))
  formData.append(
    "data_file",
    new Blob([new Uint8Array(params.audioBuffer)], { type: params.contentType || "application/octet-stream" }),
    guessUploadFileName(params.contentType),
  )

  const url = `${params.apiBase}/jobs?type=transcription`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: formData,
  })

  const responseText = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Speechmatics create-job failed: status=${response.status}; response=${responseText || response.statusText}`)
  }

  let json: SpeechmaticsJobResponse | null = null
  try {
    json = responseText ? (JSON.parse(responseText) as SpeechmaticsJobResponse) : null
  } catch {
    json = null
  }

  const jobId = readJobId(json)
  if (!jobId) {
    throw new Error("Speechmatics create-job failed: missing job id")
  }
  return jobId
}

async function waitForSpeechmaticsJob(params: {
  apiBase: string
  apiKey: string
  jobId: string
}): Promise<void> {
  const deadline = Date.now() + 20 * 60_000
  let attempt = 0

  while (Date.now() < deadline) {
    attempt += 1
    const statusUrl = `${params.apiBase}/jobs/${encodeURIComponent(params.jobId)}`
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
      },
    })
    const bodyText = await response.text().catch(() => "")
    if (!response.ok) {
      if (shouldRetryStatus(response.status) && attempt < 8) {
        await sleep(Math.min(2000 + attempt * 400, 5000))
        continue
      }
      throw new Error(`Speechmatics job-status failed: status=${response.status}; response=${bodyText || response.statusText}`)
    }

    let payload: any = null
    try {
      payload = bodyText ? JSON.parse(bodyText) : null
    } catch {
      payload = null
    }

    const rawStatus = normalizeText(payload?.job?.status || payload?.status).toLowerCase()
    if (rawStatus === "done" || rawStatus === "completed") return
    if (rawStatus === "rejected" || rawStatus === "failed" || rawStatus === "error" || rawStatus === "expired") {
      throw new Error(`Speechmatics transcription failed: status=${rawStatus || "unknown"}`)
    }

    await sleep(Math.min(1200 + attempt * 250, 4000))
  }

  throw new Error("Speechmatics transcription timed out")
}

async function fetchSpeechmaticsTranscriptJson(params: {
  apiBase: string
  apiKey: string
  jobId: string
}): Promise<any> {
  const variants = ["json-v2", "json"]
  let lastError: Error | null = null

  for (const format of variants) {
    const transcriptUrl = `${params.apiBase}/jobs/${encodeURIComponent(params.jobId)}/transcript?format=${encodeURIComponent(format)}`
    const response = await fetch(transcriptUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
      },
    })
    const bodyText = await response.text().catch(() => "")
    if (!response.ok) {
      lastError = new Error(
        `Speechmatics transcript failed: status=${response.status}; format=${format}; response=${bodyText || response.statusText}`,
      )
      continue
    }
    if (!bodyText.trim()) return null
    try {
      return JSON.parse(bodyText)
    } catch (error: any) {
      lastError = new Error(`Speechmatics transcript parse failed: format=${format}; message=${String(error?.message || error)}`)
    }
  }

  throw lastError || new Error("Speechmatics transcript fetch failed")
}

function appendToken(parts: string[], token: string, isPunctuation: boolean): void {
  const cleaned = normalizeText(token)
  if (!cleaned) return
  if (parts.length === 0) {
    parts.push(cleaned)
    return
  }
  if (isPunctuation) {
    parts[parts.length - 1] = `${parts[parts.length - 1]}${cleaned}`
    return
  }
  parts.push(cleaned)
}

function extractTranscript(resultJson: any): { text: string; isDiarized: boolean } {
  const results = Array.isArray(resultJson?.results) ? resultJson.results : []
  if (results.length === 0) {
    const plain =
      normalizeSpacing(normalizeText(resultJson?.metadata?.transcript)) ||
      normalizeSpacing(normalizeText(resultJson?.transcript)) ||
      normalizeSpacing(normalizeText(resultJson?.text))
    return {
      text: plain,
      isDiarized: false,
    }
  }

  type SpeakerLine = { speaker: string; parts: string[] }
  const lines: SpeakerLine[] = []

  for (const item of results) {
    const tokenType = normalizeText(item?.type).toLowerCase()
    const alternatives = Array.isArray(item?.alternatives) ? item.alternatives : []
    const alternative = alternatives[0] || {}
    const content = normalizeText(alternative?.content || item?.content || item?.word || item?.text)
    if (!content) continue
    const speakerRaw = normalizeText(alternative?.speaker || item?.speaker)
    const speakerNumber = Number.isFinite(Number(speakerRaw)) ? Number(speakerRaw) + 1 : null
    const speaker = speakerNumber ? `speaker_${speakerNumber}` : "speaker_1"
    const isPunctuation = tokenType === "punctuation" || /^[,.;:!?]+$/.test(content)

    const previousLine = lines[lines.length - 1]
    if (!previousLine || previousLine.speaker !== speaker) {
      const nextLine = { speaker, parts: [] as string[] }
      appendToken(nextLine.parts, content, isPunctuation)
      lines.push(nextLine)
      continue
    }

    appendToken(previousLine.parts, content, isPunctuation)
  }

  const diarizedLines = lines
    .map((line) => `${line.speaker}: ${normalizeSpacing(line.parts.join(" "))}`)
    .filter((line) => normalizeText(line))

  if (diarizedLines.length > 0) {
    return {
      text: diarizedLines.join("\n"),
      isDiarized: diarizedLines.some((line) => line.startsWith("speaker_2:") || line.startsWith("speaker_3:")),
    }
  }

  return {
    text: "",
    isDiarized: false,
  }
}

export async function runSpeechmaticsTranscriptionFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const apiKey = normalizeText(env.speechmaticsApiKey)
  if (!apiKey) {
    throw new Error("Speechmatics API key is not configured")
  }

  const apiBase = normalizeBatchApiBase(env.speechmaticsBatchApiUrl)
  const contentType = normalizeText(params.mimeType).toLowerCase() || "application/octet-stream"
  const language = normalizeLanguageCode(params.languageCode)

  const aesKey = ensureValidAesKey(params.keyBase64)
  const decryptedAudioStream = params.encryptedStream.pipe(new Csa1DecryptStream(aesKey))
  const maxBytes = 250 * 1024 * 1024
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, maxBytes)

  const jobId = await createSpeechmaticsJob({
    apiBase,
    apiKey,
    audioBuffer,
    contentType,
    language,
  })

  await waitForSpeechmaticsJob({
    apiBase,
    apiKey,
    jobId,
  })

  const transcriptJson = await fetchSpeechmaticsTranscriptJson({
    apiBase,
    apiKey,
    jobId,
  })

  const transcriptResult = extractTranscript(transcriptJson)
  if (!normalizeText(transcriptResult.text)) {
    throw new Error("No transcript returned")
  }

  if (transcriptResult.isDiarized) {
    return transcriptResult.text
  }

  return `[00:00.0] speaker_1: ${transcriptResult.text}`
}
