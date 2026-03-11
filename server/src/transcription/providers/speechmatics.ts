import { env } from "../../env"
import { Csa1DecryptStream, ensureValidAesKey } from "../csa1"
import {
  guessAudioUploadFileName,
  normalizeText,
  normalizeTranscriptSpacing,
  readStreamToBuffer,
} from "./shared"

type SpeechmaticsJobResponse = {
  id?: string
  job?: { id?: string }
}

// Maps verbose locale values to Speechmatics language codes.
function normalizeSpeechmaticsLanguage(value: string): string {
  const trimmed = normalizeText(value).toLowerCase()
  if (!trimmed || trimmed === "nl-nl") return "nl"
  if (trimmed === "en-us") return "en"
  if (trimmed === "fr-fr") return "fr"
  return trimmed
}

// Normalizes the Speechmatics batch API base URL.
function normalizeBatchApiBase(value: string): string {
  const trimmed = normalizeText(value)
  return trimmed.replace(/\/+$/g, "") || "https://asr.api.speechmatics.com/v2"
}

// Waits between polling attempts.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Returns whether a Speechmatics status code is worth retrying.
function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500
}

// Extracts the job id from a Speechmatics response payload.
function readJobId(payload: SpeechmaticsJobResponse | null): string {
  return normalizeText(payload?.id || payload?.job?.id)
}

// Creates one Speechmatics batch transcription job.
async function createSpeechmaticsJob(params: {
  apiBase: string
  apiKey: string
  audioBuffer: Buffer
  contentType: string
  language: string
}): Promise<string> {
  const formData = new FormData()
  formData.append(
    "config",
    JSON.stringify({
      type: "transcription",
      transcription_config: {
        language: params.language,
        diarization: "speaker",
      },
    }),
  )
  formData.append(
    "data_file",
    new Blob([new Uint8Array(params.audioBuffer)], { type: params.contentType || "application/octet-stream" }),
    guessAudioUploadFileName(params.contentType),
  )

  const response = await fetch(`${params.apiBase}/jobs?type=transcription`, {
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

  let payload: SpeechmaticsJobResponse | null = null
  try {
    payload = responseText ? (JSON.parse(responseText) as SpeechmaticsJobResponse) : null
  } catch {
    payload = null
  }

  const jobId = readJobId(payload)
  if (!jobId) {
    throw new Error("Speechmatics create-job failed: missing job id")
  }

  return jobId
}

// Polls Speechmatics until a batch transcription job finishes or fails.
async function waitForSpeechmaticsJob(params: {
  apiBase: string
  apiKey: string
  jobId: string
}): Promise<void> {
  const deadline = Date.now() + 20 * 60_000

  for (let attempt = 1; Date.now() < deadline; attempt += 1) {
    const response = await fetch(`${params.apiBase}/jobs/${encodeURIComponent(params.jobId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
      },
    })
    const bodyText = await response.text().catch(() => "")
    if (!response.ok) {
      if (attempt < 8 && shouldRetryStatus(response.status)) {
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

    const status = normalizeText(payload?.job?.status || payload?.status).toLowerCase()
    if (status === "done" || status === "completed") return
    if (status === "rejected" || status === "failed" || status === "error" || status === "expired") {
      throw new Error(`Speechmatics transcription failed: status=${status || "unknown"}`)
    }

    await sleep(Math.min(1200 + attempt * 250, 4000))
  }

  throw new Error("Speechmatics transcription timed out")
}

// Downloads the final Speechmatics transcript payload.
async function fetchSpeechmaticsTranscript(params: {
  apiBase: string
  apiKey: string
  jobId: string
}): Promise<any> {
  let lastError: Error | null = null

  for (const format of ["json-v2", "json"]) {
    const response = await fetch(
      `${params.apiBase}/jobs/${encodeURIComponent(params.jobId)}/transcript?format=${encodeURIComponent(format)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
        },
      },
    )
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

// Appends a transcript token while keeping punctuation attached.
function appendTranscriptToken(parts: string[], token: string, isPunctuation: boolean): void {
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

// Extracts a diarized transcript string from Speechmatics JSON.
function extractSpeechmaticsTranscript(resultJson: any): { text: string; isDiarized: boolean } {
  const results = Array.isArray(resultJson?.results) ? resultJson.results : []
  if (results.length === 0) {
    const plainText =
      normalizeTranscriptSpacing(normalizeText(resultJson?.metadata?.transcript)) ||
      normalizeTranscriptSpacing(normalizeText(resultJson?.transcript)) ||
      normalizeTranscriptSpacing(normalizeText(resultJson?.text))
    return { text: plainText, isDiarized: false }
  }

  const lines: Array<{ speaker: string; parts: string[] }> = []

  for (const item of results) {
    const alternatives = Array.isArray(item?.alternatives) ? item.alternatives : []
    const alternative = alternatives[0] || {}
    const content = normalizeText(alternative?.content || item?.content || item?.word || item?.text)
    if (!content) continue

    const speakerRaw = normalizeText(alternative?.speaker || item?.speaker)
    const speakerNumber = Number.isFinite(Number(speakerRaw)) ? Number(speakerRaw) + 1 : null
    const speaker = speakerNumber ? `speaker_${speakerNumber}` : "speaker_1"
    const tokenType = normalizeText(item?.type).toLowerCase()
    const isPunctuation = tokenType === "punctuation" || /^[,.;:!?]+$/.test(content)
    const previousLine = lines[lines.length - 1]

    if (!previousLine || previousLine.speaker !== speaker) {
      const nextLine = { speaker, parts: [] as string[] }
      appendTranscriptToken(nextLine.parts, content, isPunctuation)
      lines.push(nextLine)
      continue
    }

    appendTranscriptToken(previousLine.parts, content, isPunctuation)
  }

  const diarizedLines = lines
    .map((line) => `${line.speaker}: ${normalizeTranscriptSpacing(line.parts.join(" "))}`)
    .filter(Boolean)

  if (diarizedLines.length === 0) {
    return { text: "", isDiarized: false }
  }

  return {
    text: diarizedLines.join("\n"),
    isDiarized: diarizedLines.some((line) => line.startsWith("speaker_2:") || line.startsWith("speaker_3:")),
  }
}

// Runs batch transcription with Speechmatics for one encrypted upload.
export async function runSpeechmaticsBatchTranscription(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const apiKey = normalizeText(env.speechmaticsApiKey)
  if (!apiKey) {
    throw new Error("Speechmatics API key is not configured")
  }

  const aesKey = ensureValidAesKey(params.keyBase64)
  const decryptedAudioStream = params.encryptedStream.pipe(new Csa1DecryptStream(aesKey))
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, 250 * 1024 * 1024)
  const apiBase = normalizeBatchApiBase(env.speechmaticsBatchApiUrl)

  const jobId = await createSpeechmaticsJob({
    apiBase,
    apiKey,
    audioBuffer,
    contentType: normalizeText(params.mimeType).toLowerCase() || "application/octet-stream",
    language: normalizeSpeechmaticsLanguage(params.languageCode),
  })
  await waitForSpeechmaticsJob({ apiBase, apiKey, jobId })

  const transcript = extractSpeechmaticsTranscript(
    await fetchSpeechmaticsTranscript({
      apiBase,
      apiKey,
      jobId,
    }),
  )
  if (!normalizeText(transcript.text)) {
    throw new Error("No transcript returned")
  }

  return transcript.isDiarized ? transcript.text : `[00:00.0] speaker_1: ${transcript.text}`
}
