import { env } from "../../env"
import type { ProviderOperationPollResult, ProviderOperationStartResult } from "../operationTypes"
import { guessAudioUploadFileName, normalizeText, normalizeTranscriptSpacing } from "./shared"

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

// Reads the current Speechmatics batch job status.
async function readSpeechmaticsJobStatus(params: {
  apiBase: string
  apiKey: string
  jobId: string
}): Promise<"queued" | "running" | "completed" | "failed"> {
  const response = await fetch(`${params.apiBase}/jobs/${encodeURIComponent(params.jobId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
  })
  const bodyText = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Speechmatics job-status failed: status=${response.status}; response=${bodyText || response.statusText}`)
  }

  let payload: any = null
  try {
    payload = bodyText ? JSON.parse(bodyText) : null
  } catch {
    payload = null
  }

  const status = normalizeText(payload?.job?.status || payload?.status).toLowerCase()
  if (status === "done" || status === "completed") return "completed"
  if (status === "rejected" || status === "failed" || status === "error" || status === "expired") return "failed"
  if (status === "running" || status === "processing") return "running"
  return "queued"
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

  const parts: string[] = []

  for (const item of results) {
    const alternatives = Array.isArray(item?.alternatives) ? item.alternatives : []
    const alternative = alternatives[0] || {}
    const content = normalizeText(alternative?.content || item?.content || item?.word || item?.text)
    if (!content) continue

    const tokenType = normalizeText(item?.type).toLowerCase()
    const isPunctuation = tokenType === "punctuation" || /^[,.;:!?]+$/.test(content)
    appendTranscriptToken(parts, content, isPunctuation)
  }

  const plainText = normalizeTranscriptSpacing(parts.join(" "))
  if (!plainText) {
    return { text: "", isDiarized: false }
  }

  return {
    text: plainText,
    isDiarized: false,
  }
}

export async function startSpeechmaticsTranscription(params: {
  audioBuffer: Buffer
  mimeType: string
  languageCode: string
}): Promise<ProviderOperationStartResult> {
  const apiKey = normalizeText(env.speechmaticsApiKey)
  if (!apiKey) {
    throw new Error("Speechmatics API key is not configured")
  }

  const apiBase = normalizeBatchApiBase(env.speechmaticsBatchApiUrl)

  const jobId = await createSpeechmaticsJob({
    apiBase,
    apiKey,
    audioBuffer: params.audioBuffer,
    contentType: normalizeText(params.mimeType).toLowerCase() || "application/octet-stream",
    language: normalizeSpeechmaticsLanguage(params.languageCode),
  })

  return {
    status: "queued",
    externalJobId: jobId,
    externalStatusPath: `${apiBase}/jobs/${encodeURIComponent(jobId)}`,
    externalResultPath: `${apiBase}/jobs/${encodeURIComponent(jobId)}/transcript`,
  }
}

export async function pollSpeechmaticsTranscription(params: {
  externalJobId: string
}): Promise<ProviderOperationPollResult> {
  const apiKey = normalizeText(env.speechmaticsApiKey)
  if (!apiKey) {
    throw new Error("Speechmatics API key is not configured")
  }

  const apiBase = normalizeBatchApiBase(env.speechmaticsBatchApiUrl)
  const status = await readSpeechmaticsJobStatus({
    apiBase,
    apiKey,
    jobId: params.externalJobId,
  })

  if (status === "queued" || status === "running") {
    return { status }
  }
  if (status === "failed") {
    return {
      status: "failed",
      errorMessage: "Speechmatics transcription failed",
    }
  }

  const transcript = extractSpeechmaticsTranscript(
    await fetchSpeechmaticsTranscript({
      apiBase,
      apiKey,
      jobId: params.externalJobId,
    }),
  )
  if (!normalizeText(transcript.text)) {
    return {
      status: "failed",
      errorMessage: "No transcript returned",
    }
  }

  return {
    status: "completed",
    transcript: transcript.text,
  }
}
