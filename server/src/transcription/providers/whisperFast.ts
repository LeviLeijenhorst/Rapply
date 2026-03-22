import { env } from "../../env"
import type { ProviderOperationPollResult, ProviderOperationStartResult } from "../operationTypes"
import {
  buildAuthorizationHeaders,
  guessAudioUploadFileName,
  normalizeText,
  readAsyncInferencePaths,
  readTranscriptFromPayload,
} from "./shared"

type WhisperFastResponse = {
  Id?: unknown
  id?: unknown
  Status?: unknown
  status?: unknown
  StatusPath?: unknown
  statusPath?: unknown
  ResultPath?: unknown
  resultPath?: unknown
  text?: unknown
  transcript?: unknown
  result?: {
    text?: unknown
    transcript?: unknown
  }
}

function readConfiguredEndpoint(): string {
  const endpoint = normalizeText(env.whisperFastEndpoint)
  if (!endpoint) {
    throw new Error("Whisper Fast endpoint is not configured")
  }
  return endpoint
}

function readAsyncStatus(payload: WhisperFastResponse | null): "queued" | "running" | "completed" | "failed" {
  const normalizedStatus = normalizeText(payload?.Status || payload?.status).toLowerCase()
  if (normalizedStatus === "queue" || normalizedStatus === "queued" || normalizedStatus === "pending") return "queued"
  if (normalizedStatus === "running" || normalizedStatus === "processing" || normalizedStatus === "inprogress") return "running"
  if (normalizedStatus === "completed" || normalizedStatus === "success" || normalizedStatus === "done") return "completed"
  if (normalizedStatus === "failed" || normalizedStatus === "error" || normalizedStatus === "cancelled") return "failed"
  return "running"
}

export async function startWhisperFastTranscription(params: {
  operationId: string
  audioBuffer: Buffer
  mimeType: string
  languageCode: string
}): Promise<ProviderOperationStartResult> {
  const endpoint = readConfiguredEndpoint()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.max(5_000, env.whisperFastTimeoutMs))

  try {
    const formData = new FormData()
    formData.append(
      "audio",
      new Blob([new Uint8Array(params.audioBuffer)], {
        type: normalizeText(params.mimeType).toLowerCase() || "application/octet-stream",
      }),
      guessAudioUploadFileName(params.mimeType),
    )
    formData.append("language", normalizeText(params.languageCode) || "nl")

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...buildAuthorizationHeaders(env.whisperFastApiKey),
        Prefer: "respond-async",
        "X-Inference-Id": params.operationId,
      },
      body: formData,
      signal: controller.signal,
    })

    const responseText = await response.text().catch(() => "")
    if (!response.ok) {
      throw new Error(`Whisper Fast transcription failed: status=${response.status}; response=${responseText || response.statusText}`)
    }

    let payload: WhisperFastResponse | null = null
    try {
      payload = responseText ? (JSON.parse(responseText) as WhisperFastResponse) : null
    } catch {
      payload = null
    }

    const transcript = readTranscriptFromPayload(payload)
    if (transcript) {
      return {
        status: "completed",
        transcript,
      }
    }

    const asyncPaths = readAsyncInferencePaths({ endpoint, payload })
    if (!asyncPaths) {
      throw new Error("Whisper Fast transcription failed: missing transcript or async paths")
    }

    return {
      status: "queued",
      externalJobId: asyncPaths.externalJobId,
      externalStatusPath: asyncPaths.externalStatusPath,
      externalResultPath: asyncPaths.externalResultPath,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function pollWhisperFastTranscription(params: {
  externalJobId: string
  externalStatusPath: string
  externalResultPath: string
}): Promise<ProviderOperationPollResult> {
  const statusResponse = await fetch(params.externalStatusPath, {
    method: "GET",
    headers: {
      ...buildAuthorizationHeaders(env.whisperFastApiKey),
      "X-Inference-Id": params.externalJobId,
    },
  })
  const statusText = await statusResponse.text().catch(() => "")
  if (!statusResponse.ok) {
    throw new Error(`Whisper Fast status failed: status=${statusResponse.status}; response=${statusText || statusResponse.statusText}`)
  }

  let statusPayload: WhisperFastResponse | null = null
  try {
    statusPayload = statusText ? (JSON.parse(statusText) as WhisperFastResponse) : null
  } catch {
    statusPayload = null
  }

  const status = readAsyncStatus(statusPayload)
  if (status === "queued" || status === "running") {
    return { status }
  }
  if (status === "failed") {
    return {
      status: "failed",
      errorMessage: normalizeText(statusText) || "Whisper Fast transcription failed",
    }
  }

  const resultResponse = await fetch(params.externalResultPath, {
    method: "GET",
    headers: {
      ...buildAuthorizationHeaders(env.whisperFastApiKey),
      "X-Inference-Id": params.externalJobId,
    },
  })
  const resultText = await resultResponse.text().catch(() => "")
  if (!resultResponse.ok) {
    throw new Error(`Whisper Fast result failed: status=${resultResponse.status}; response=${resultText || resultResponse.statusText}`)
  }

  let resultPayload: WhisperFastResponse | null = null
  try {
    resultPayload = resultText ? (JSON.parse(resultText) as WhisperFastResponse) : null
  } catch {
    resultPayload = null
  }

  const transcript = readTranscriptFromPayload(resultPayload)
  if (!transcript) {
    return {
      status: "failed",
      errorMessage: "Whisper Fast transcription failed: missing transcript",
    }
  }

  return {
    status: "completed",
    transcript,
  }
}
