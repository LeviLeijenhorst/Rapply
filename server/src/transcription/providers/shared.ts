type AsyncInferencePayload = {
  Id?: unknown
  id?: unknown
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

// Normalizes optional string input into a trimmed string.
export function normalizeText(value: unknown): string {
  return String(value || "").trim()
}

// Cleans transcript spacing without changing the spoken content.
export function normalizeTranscriptSpacing(value: string): string {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
}

// Picks a stable filename extension for provider multipart uploads.
export function guessAudioUploadFileName(contentType: string): string {
  const normalizedContentType = normalizeText(contentType).toLowerCase()
  if (normalizedContentType.includes("mpeg") || normalizedContentType.includes("mp3")) return "audio.mp3"
  if (normalizedContentType.includes("mp4") || normalizedContentType.includes("m4a") || normalizedContentType.includes("aac")) return "audio.mp4"
  if (normalizedContentType.includes("ogg") || normalizedContentType.includes("opus")) return "audio.ogg"
  if (normalizedContentType.includes("webm")) return "audio.webm"
  if (normalizedContentType.includes("flac")) return "audio.flac"
  if (normalizedContentType.includes("wav")) return "audio.wav"
  return "audio.bin"
}

// Reads a stream into memory and rejects payloads above the provider size limit.
export async function readStreamToBuffer(stream: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of stream as AsyncIterable<unknown>) {
    const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any)
    totalBytes += chunkBuffer.length
    if (totalBytes > maxBytes) {
      throw new Error(`Audio file is too large for transcription (max ${maxBytes} bytes)`)
    }
    chunks.push(chunkBuffer)
  }

  return Buffer.concat(chunks)
}

export function buildAuthorizationHeaders(apiKey: string): Record<string, string> {
  const normalizedApiKey = normalizeText(apiKey)
  if (!normalizedApiKey) return {}
  return {
    Authorization: `Bearer ${normalizedApiKey}`,
  }
}

export function resolveUrl(baseUrl: string, value: string): string {
  const normalizedBaseUrl = normalizeText(baseUrl)
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) return ""
  try {
    return new URL(normalizedValue, normalizedBaseUrl).toString()
  } catch {
    return normalizedValue
  }
}

export function readTranscriptFromPayload(payload: AsyncInferencePayload | null): string {
  return normalizeTranscriptSpacing(
    normalizeText(payload?.text || payload?.transcript || payload?.result?.text || payload?.result?.transcript),
  )
}

export function readAsyncInferencePaths(params: { endpoint: string; payload: AsyncInferencePayload | null }): {
  externalJobId: string
  externalStatusPath: string
  externalResultPath: string
} | null {
  const externalJobId = normalizeText(params.payload?.Id || params.payload?.id)
  const externalStatusPath = resolveUrl(params.endpoint, normalizeText(params.payload?.StatusPath || params.payload?.statusPath))
  const externalResultPath = resolveUrl(params.endpoint, normalizeText(params.payload?.ResultPath || params.payload?.resultPath))

  if (!externalJobId || !externalStatusPath || !externalResultPath) return null
  return {
    externalJobId,
    externalStatusPath,
    externalResultPath,
  }
}
