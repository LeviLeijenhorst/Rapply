import * as Crypto from "expo-crypto"
import { Directory, File, Paths } from "expo-file-system"
import * as FileSystemLegacy from "expo-file-system/legacy"
import { Buffer } from "buffer"
import { requireNativeModule } from "expo"
import { getSupabaseAccessToken, getSupabasePublishableKey, getSupabaseUrl, getSupabaseUserId } from "@/config/supabase"
import { postToSecureApi } from "./secureApi"
import { logger } from "@/utils/logger"

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

function encodePath(value: string) {
  return String(value || "")
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")
}

async function uploadEncryptedFileToSupabaseStorage(params: { bucket: string; path: string; fileUri: string }) {
  const { bucket, path, fileUri } = params
  const supabaseUrl = getSupabaseUrl()
  const apikey = getSupabasePublishableKey()
  const accessToken = await getSupabaseAccessToken()

  const url = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`

  let result: any
  try {
    result = await FileSystemLegacy.uploadAsync(url, fileUri, {
      httpMethod: "POST",
      uploadType: FileSystemLegacy.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey,
        "Content-Type": "application/octet-stream",
      },
    })
  } catch (error: any) {
    const message = String(error?.message || error || "")
    if (__DEV__ && message.includes("Network request failed") && url.startsWith("http://127.0.0.1:54321/")) {
      throw new Error("Geen verbinding met Supabase Storage. Run op je PC: adb reverse tcp:54321 tcp:54321.")
    }
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

  await getSupabaseUserId()

  logger.debug("[transcription] preflight start")
  const preflight = await postToSecureApi("/transcription/preflight", {})
  const allowed = !!preflight?.allowed
  if (!allowed) {
    throw new Error("Not enough seconds remaining for transcription")
  }
  const operationId = String(preflight?.operationId || "").trim()
  const uploadToken = String(preflight?.uploadToken || "").trim()
  const uploadPath = String(preflight?.uploadPath || "").trim()
  if (!operationId || !uploadToken || !uploadPath) {
    throw new Error("Transcription preflight failed")
  }

  const keyBase64 = await createRandomKeyBase64()
  const encryptedUri = await createTemporaryEncryptedAudioFilePath(recordingId)

  try {
    const ok = await ExpoSegmentedAudioNative.encryptFile(toFileSystemPath(sourceUri), toFileSystemPath(encryptedUri), keyBase64)
    if (!ok) throw new Error("Failed to encrypt audio for upload")

    logger.debug("[transcription] storage upload start")
    await uploadEncryptedFileToSupabaseStorage({
      bucket: "transcription-uploads",
      path: uploadPath,
      fileUri: encryptedUri,
    })

    logger.debug("[transcription] start request")
    const result = await postToSecureApi("/transcription/start", {
      operationId,
      uploadToken,
      keyBase64,
      language_code: languageCode,
      mime_type: mimeType,
    })

    const text = String(result?.text || result?.transcript || "")
    if (!text.trim()) throw new Error("No transcript returned")
    return text
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


