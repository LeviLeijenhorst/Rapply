import * as Crypto from "expo-crypto"
import { Directory, File, Paths } from "expo-file-system"
import * as FileSystemLegacy from "expo-file-system/legacy"
import { Buffer } from "buffer"
import { requireNativeModule } from "expo"
import { postToSecureApi } from "./secureApi"
import { logger } from "@/utils/logger"
import { requireUserId } from "./auth"

const ExpoSegmentedAudioNative = requireNativeModule<any>("ExpoSegmentedAudio") as any

function toFileSystemPath(uri: string) {
  return uri.startsWith("file://") ? uri.slice(7) : uri
}

async function createRandomKeyBase64() {
  const randomBytes = await Crypto.getRandomBytesAsync(32)
  return Buffer.from(randomBytes).toString("base64")
}

async function createTemporaryEncryptedAudioFilePath(recordingId: string) {
  const safeRecordingId = (recordingId || "recording").trim().replace(/[^a-z0-9_\-]/gi, "_")
  const dir = new Directory(Paths.cache, "CoachScribe/transcription_uploads")
  if (!dir.exists) {
    dir.create({ intermediates: true })
  }
  const file = new File(dir, `upload_${safeRecordingId}_${Date.now()}.csa1`)
  return file.uri
}

async function uploadEncryptedFileToUploadUrl(params: { uploadUrl: string; uploadHeaders: Record<string, string>; fileUri: string }) {
  const fileUri = params.fileUri
  const uploadUrl = String(params.uploadUrl || "").trim()
  const uploadHeaders = (params.uploadHeaders || {}) as Record<string, string>
  if (!uploadUrl) {
    throw new Error("Missing uploadUrl")
  }

  let result: any
  try {
    result = await FileSystemLegacy.uploadAsync(uploadUrl, fileUri, {
      httpMethod: "PUT",
      uploadType: FileSystemLegacy.FileSystemUploadType.BINARY_CONTENT,
      headers: { ...uploadHeaders, "Content-Type": "application/octet-stream" },
    })
  } catch (error: any) {
    throw error
  }

  if (result.status !== 200 && result.status !== 201) {
    const body = String(result.body || "").slice(0, 400)
    throw new Error(`Storage upload failed (${result.status}): ${body || "Unknown error"}`)
  }
}

export async function transcribeViaEncryptedUpload(params: {
  recordingId: string
  sourceUri: string
  languageCode: string
  mimeType: string
}) {
  const { recordingId, sourceUri, languageCode, mimeType } = params

  await requireUserId()

  logger.debug("[transcription] preflight start")
  const preflight = await postToSecureApi("/transcription/preflight", {})
  const allowed = !!preflight?.allowed
  if (!allowed) {
    throw new Error("Not enough seconds remaining for transcription")
  }
  const operationId = String(preflight?.operationId || "").trim()
  const uploadToken = String(preflight?.uploadToken || "").trim()
  const uploadPath = String(preflight?.uploadPath || "").trim()
  const uploadUrl = String(preflight?.uploadUrl || "").trim()
  const uploadHeaders = (preflight?.uploadHeaders || {}) as Record<string, string>
  if (!operationId || !uploadToken || !uploadPath) {
    throw new Error("Transcription preflight failed")
  }
  if (!uploadUrl) {
    throw new Error("Transcription preflight missing uploadUrl")
  }

  const keyBase64 = await createRandomKeyBase64()
  const encryptedUri = await createTemporaryEncryptedAudioFilePath(recordingId)

  try {
    const ok = await ExpoSegmentedAudioNative.encryptFile(toFileSystemPath(sourceUri), toFileSystemPath(encryptedUri), keyBase64)
    if (!ok) throw new Error("Failed to encrypt audio for upload")

    logger.debug("[transcription] storage upload start")
    await uploadEncryptedFileToUploadUrl({
      fileUri: encryptedUri,
      uploadUrl,
      uploadHeaders,
    })

    logger.debug("[transcription] start request")
    const result = await postToSecureApi("/transcription/start", {
      operationId,
      uploadToken,
      keyBase64,
      language_code: languageCode,
      mime_type: mimeType,
    })

    const transcript = String(result?.text || result?.transcript || "")
    const summary = String(result?.summary || "")
    if (!transcript.trim()) throw new Error("No transcript returned")
    if (!summary.trim()) throw new Error("No summary returned")
    return { transcript, summary }
  } catch (error: any) {
    logger.error("[transcription] transcribeViaEncryptedUpload failed", { message: String(error?.message || error || "") })
    throw error
  } finally {
    try {
      const f = new File(encryptedUri)
      if (f.exists) {
        f.delete()
      }
    } catch {}
  }
}


