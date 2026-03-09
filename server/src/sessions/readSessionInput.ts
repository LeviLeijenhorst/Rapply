import type { Session } from "../types/Session"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

function readOptionalStructuredSessionSummary(value: unknown): Session["summaryStructured"] | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "object") return undefined
  const payload = value as Record<string, unknown>
  return {
    doelstelling: readOptionalText(payload.doelstelling, true) ?? "",
    belastbaarheid: readOptionalText(payload.belastbaarheid, true) ?? "",
    belemmeringen: readOptionalText(payload.belemmeringen, true) ?? "",
    voortgang: readOptionalText(payload.voortgang, true) ?? "",
    arbeidsmarktorientatie: readOptionalText(payload.arbeidsmarktorientatie, true) ?? "",
  }
}

export function readOptionalTranscriptionStatus(value: unknown): Session["transcriptionStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "idle" || trimmed === "transcribing" || trimmed === "generating" || trimmed === "done" || trimmed === "error") {
    return trimmed
  }
  return undefined
}

export function readOptionalSessionInputType(value: unknown): Session["inputType"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "recording" || trimmed === "uploaded_audio" || trimmed === "written_recap" || trimmed === "intake") {
    return trimmed
  }
  if (trimmed === "upload") return "uploaded_audio"
  if (trimmed === "written" || trimmed === "notes") return "written_recap"
  return undefined
}

export function readSessionInput(value: unknown): Session {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "session.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "session.updatedAtUnixMs")
  const inputType =
    readOptionalSessionInputType(payload.inputType ?? payload.kind) ??
    (readText(payload.inputType ?? payload.kind, "session.inputType") as Session["inputType"])

  return {
    id: readId(payload.id, "session.id"),
    clientId: payload.clientId === null ? null : readOptionalId(payload.clientId) ?? null,
    trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId) ?? null,
    title: readText(payload.title, "session.title"),
    inputType,
    audioUploadId: readOptionalText(payload.audioUploadId ?? payload.audioBlobId, true) ?? null,
    audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds) ?? null,
    uploadFileName: readOptionalText(payload.uploadFileName, true) ?? null,
    transcriptText: readOptionalText(payload.transcriptText ?? payload.transcript, true) ?? null,
    summaryText: readOptionalText(payload.summaryText ?? payload.summary, true) ?? null,
    summaryStructured: readOptionalStructuredSessionSummary(payload.summaryStructured) ?? null,
    transcriptionStatus: readOptionalTranscriptionStatus(payload.transcriptionStatus) ?? "idle",
    transcriptionError: readOptionalText(payload.transcriptionError, true) ?? null,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
