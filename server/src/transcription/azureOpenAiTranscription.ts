import { Csa1DecryptStream, ensureValidAesKey } from "./csa1"
import { env } from "../env"

function normalizeSpacing(value: string) {
  return String(value || "")
    .replace(/\s+([,.;:!?])/g, "")
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
      throw new Error("Audio file is too large for transcription")
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

function normalizeEndpoint(value: string) {
  return String(value || "").trim().replace(/\/+$/, "")
}

export async function runAzureOpenAiTranscriptionFromEncryptedUpload(params: {
  encryptedStream: NodeJS.ReadableStream
  keyBase64: string
  mimeType: string
  languageCode: string
}): Promise<string> {
  const endpoint = normalizeEndpoint(env.azureOpenAiEndpoint)
  if (!endpoint) {
    throw new Error("Azure OpenAI endpoint is not configured")
  }
  const apiKey = String(env.azureOpenAiKey || "").trim()
  if (!apiKey) {
    throw new Error("Azure OpenAI key is not configured")
  }
  const version = String(env.azureOpenAiTranscriptionVersion || "").trim()
  if (!version) {
    throw new Error("Azure OpenAI transcription version is not configured")
  }
  const deployment = String(env.azureOpenAiTranscriptionDeployment || "").trim()
  if (!deployment) {
    throw new Error("Azure OpenAI transcription deployment is not configured")
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
  const normalizedMimeType = rawMimeType == "audio/m4a" ? "audio/mp4" : String(rawMimeType || "audio/mp4")
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
  form.append("file", blob, udio.)
  form.append("model", env.azureOpenAiTranscriptionModel)

  const requestedLanguageCode = String(languageCode || "").trim()
  const shouldSendLanguage =
    requestedLanguageCode === "en" ||
    requestedLanguageCode === "en-US" ||
    requestedLanguageCode === "en-GB" ||
    requestedLanguageCode === "fr" ||
    requestedLanguageCode === "fr-FR" ||
    requestedLanguageCode === "nl" ||
    requestedLanguageCode === "nl-NL"
  if (shouldSendLanguage) {
    form.append("language", requestedLanguageCode)
  }

  const url = ${endpoint}/openai/deployments//audio/transcriptions?api-version=

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      Accept: "application/json",
    },
    body: form as any,
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(Azure OpenAI transcription failed: )
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const text = normalizeSpacing(String(json?.text || ""))
  if (text) {
    return [00:00.0] speaker_1: 
  }

  throw new Error("No transcript returned")
}
