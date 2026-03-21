import { writeEncryptedFile, readEncryptedFile, listFiles } from "@/screens/EncryptedStorage"
import { generateSummaryFromTranscript, transcribeViaEncryptedUpload } from "./transcriptionUpload"
import { logger } from "@/utils/logger"

function slugifyCoacheeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_")
}

function getRecordingBaseDirectory(coacheeName: string | undefined, recordingId: string) {
  const coacheeId = coacheeName?.trim().length ? slugifyCoacheeName(coacheeName) : "loose_recordings"
  return {
    coacheeId,
    baseDirectory: `Rapply/coachees/${coacheeId}/${recordingId}`,
  }
}

function inferMimeTypeFromUri(uri: string) {
  const extension = uri.split(".").pop()?.toLowerCase()
  if (extension === "mp3") return "audio/mpeg"
  if (extension === "wav") return "audio/wav"
  if (extension === "webm") return "audio/webm"
  if (extension === "ogg") return "audio/ogg"
  return "audio/mp4"
}

export type TranscriptionStatus = "idle" | "transcribing" | "done" | "error"

export async function writeTranscriptionStatus(coacheeName: string | undefined, recordingId: string, status: TranscriptionStatus, errorMessage?: string) {
  const { baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
  const payload = JSON.stringify({ status, updatedAt: Date.now(), error: errorMessage || null })
  await writeEncryptedFile(baseDirectory, "status.json.enc", payload, "text")
}

export async function readTranscriptionStatus(coacheeName: string | undefined, recordingId: string): Promise<TranscriptionStatus> {
  try {
    const { baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
    const txt = await readEncryptedFile(baseDirectory, "status.json.enc")
    const data = JSON.parse(txt) as { status?: TranscriptionStatus }
    return (data.status as TranscriptionStatus) || "idle"
  } catch {
    return "idle"
  }
}

export type SummaryStatus = "idle" | "generating" | "done" | "error"

export async function writeSummaryStatus(coacheeName: string | undefined, recordingId: string, status: SummaryStatus, errorMessage?: string) {
  const { baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
  const payload = JSON.stringify({ status, updatedAt: Date.now(), error: errorMessage || null })
  await writeEncryptedFile(baseDirectory, "summary_status.json.enc", payload, "text")
}

export async function readSummaryStatus(coacheeName: string | undefined, recordingId: string): Promise<SummaryStatus> {
  try {
    const { baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
    const txt = await readEncryptedFile(baseDirectory, "summary_status.json.enc")
    const data = JSON.parse(txt) as { status?: SummaryStatus }
    return (data.status as SummaryStatus) || "idle"
  } catch {
    return "idle"
  }
}

async function transcribeRecordingViaEncryptedUpload(params: { recordingId: string; sourceUri: string }): Promise<{ transcript: string }> {
  const { recordingId, sourceUri } = params
  try {
    logger.debug("[transcription] Starting encrypted upload transcription")
    const result = await transcribeViaEncryptedUpload({
      recordingId,
      sourceUri,
      languageCode: "nl",
      mimeType: inferMimeTypeFromUri(sourceUri),
    })
    return result
  } catch (error: any) {
    logger.error("[transcription] Upload error")
    throw new Error(error?.message || "Transcription failed")
  }
}

export async function startTranscription(params: {
  coacheeName?: string
  recordingId: string
  sourceUri: string
}) {
  const { coacheeName, recordingId, sourceUri } = params
  logger.debug("[transcription] startTranscription called")
  try {
    await writeTranscriptionStatus(coacheeName, recordingId, "transcribing")
    await writeSummaryStatus(coacheeName, recordingId, "generating")
    const { baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
    const { transcript } = await transcribeRecordingViaEncryptedUpload({ recordingId, sourceUri })
    await writeEncryptedFile(baseDirectory, "transcript.txt.enc", transcript, "text")
    await writeTranscriptionStatus(coacheeName, recordingId, "done")
    try {
      const summary = await generateSummaryFromTranscript({ transcript, recordingId })
      await writeEncryptedFile(baseDirectory, "summary.txt.enc", summary, "text")
      await writeSummaryStatus(coacheeName, recordingId, "done")
    } catch (summaryError: any) {
      logger.error("[transcription] summary generation error")
      await writeSummaryStatus(coacheeName, recordingId, "error", summaryError?.message || "Unknown error")
    }
  } catch (err: any) {
    logger.error("[transcription] startTranscription error")
    await writeTranscriptionStatus(coacheeName, recordingId, "error", err?.message || "Unknown error")
    try {
      await writeSummaryStatus(coacheeName, recordingId, "error", err?.message || "Unknown error")
    } catch {}
    throw err
  }
}

export async function transcriptFileExists(coacheeName: string | undefined, recordingId: string): Promise<boolean> {
  const { baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
  const files = await listFiles(baseDirectory)
  return files.includes("transcript.txt.enc")
}

const ensureSummaryInFlight = new Set<string>()

export async function ensureSummaryExists(coacheeName: string | undefined, recordingId: string): Promise<boolean> {
  const { coacheeId, baseDirectory } = getRecordingBaseDirectory(coacheeName, recordingId)
  const key = `${coacheeId}/${recordingId}`
  if (ensureSummaryInFlight.has(key)) return false
  ensureSummaryInFlight.add(key)
  try {
    const files = await listFiles(baseDirectory)
    if (files.includes("summary.txt.enc")) return true
    await writeSummaryStatus(coacheeName, recordingId, "error", "Missing summary")
    return false
  } catch {
    try {
      await writeSummaryStatus(coacheeName, recordingId, "error")
    } catch {}
    return false
  } finally {
    ensureSummaryInFlight.delete(key)
  }
}

