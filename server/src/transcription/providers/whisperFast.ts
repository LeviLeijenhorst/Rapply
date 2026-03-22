import { env } from "../../env"
import { Csa1DecryptStream, ensureValidAesKey } from "../csa1"
import type { TranscriptionProviderResult } from "../operationTypes"
import {
  guessAudioUploadFileName,
  normalizeText,
  normalizeTranscriptSpacing,
  readStreamToBuffer,
} from "./shared"

type WhisperFastResponse = {
  text?: unknown
  transcript?: unknown
  result?: {
    text?: unknown
    transcript?: unknown
  }
}

function buildAuthorizationHeaders(): Record<string, string> {
  const apiKey = normalizeText(env.selfHostedWhisperApiKey)
  if (!apiKey) return {}
  return {
    Authorization: `Bearer ${apiKey}`,
  }
}

function readTranscriptFromResponse(payload: WhisperFastResponse | null): string {
  return normalizeTranscriptSpacing(
    normalizeText(payload?.text || payload?.transcript || payload?.result?.text || payload?.result?.transcript),
  )
}

// Runs batch transcription against a Whisper Fast worker.
export async function runWhisperFastBatchTranscription(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const endpoint = normalizeText(env.selfHostedWhisperEndpoint)
  if (!endpoint) {
    throw new Error("Whisper Fast endpoint is not configured")
  }

  const aesKey = ensureValidAesKey(params.keyBase64)
  const decryptedAudioStream = params.encryptedStream.pipe(new Csa1DecryptStream(aesKey))
  const audioBuffer = await readStreamToBuffer(decryptedAudioStream, 250 * 1024 * 1024)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.max(5_000, env.selfHostedWhisperTimeoutMs))

  try {
    const formData = new FormData()
    formData.append(
      "audio",
      new Blob([new Uint8Array(audioBuffer)], {
        type: normalizeText(params.mimeType).toLowerCase() || "application/octet-stream",
      }),
      guessAudioUploadFileName(params.mimeType),
    )
    formData.append("language", normalizeText(params.languageCode) || "nl")

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...buildAuthorizationHeaders(),
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

    const transcript = readTranscriptFromResponse(payload)
    if (!transcript) {
      throw new Error("Whisper Fast transcription failed: missing transcript")
    }

    return transcript
  } finally {
    clearTimeout(timeout)
  }
}

// Starts a WhisperFast transcription from a pre-decrypted audio buffer.
export async function startWhisperFastTranscription(params: {
  operationId: string
  audioBuffer: Buffer
  mimeType: string
  languageCode: string
}): Promise<TranscriptionProviderResult> {
  const endpoint = normalizeText(env.selfHostedWhisperEndpoint)
  if (!endpoint) {
    throw new Error("WhisperFast endpoint is not configured")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.max(5_000, env.selfHostedWhisperTimeoutMs))

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
      headers: { ...buildAuthorizationHeaders() },
      body: formData,
      signal: controller.signal,
    })

    const responseText = await response.text().catch(() => "")
    if (!response.ok) {
      throw new Error(`WhisperFast transcription failed: status=${response.status}; response=${responseText || response.statusText}`)
    }

    let payload: WhisperFastResponse | null = null
    try {
      payload = responseText ? (JSON.parse(responseText) as WhisperFastResponse) : null
    } catch {
      payload = null
    }

    const transcript = readTranscriptFromResponse(payload)
    if (!transcript) {
      throw new Error("WhisperFast transcription failed: missing transcript")
    }

    return { status: "completed", transcript }
  } finally {
    clearTimeout(timeout)
  }
}
