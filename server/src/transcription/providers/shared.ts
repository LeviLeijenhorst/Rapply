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
