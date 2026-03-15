import type { Session } from "../types/Session"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

function readSummaryField(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = readOptionalText(payload[key], true)
    if (value) return value
  }
  return ""
}

export function readOptionalStructuredSessionSummary(value: unknown): Session["summaryStructured"] | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "object") return undefined
  const payload = value as Record<string, unknown>
  return {
    doelstelling: readSummaryField(payload, ["doelstelling", "kernpunten"]),
    belastbaarheid: readSummaryField(payload, ["belastbaarheid", "situatie"]),
    belemmeringen: readSummaryField(payload, ["belemmeringen", "aandachtspunten"]),
    voortgang: readSummaryField(payload, ["voortgang", "afspraken"]),
    arbeidsmarktorientatie: readSummaryField(payload, ["arbeidsmarktorientatie", "arbeidsorientatie", "vervolg"]),
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
  if (
    trimmed === "recording" ||
    trimmed === "uploaded_audio" ||
    trimmed === "written_recap" ||
    trimmed === "spoken_recap" ||
    trimmed === "uploaded_document" ||
    trimmed === "intake"
  ) {
    return trimmed
  }
  if (trimmed === "upload") return "uploaded_audio"
  if (trimmed === "written" || trimmed === "notes") return "written_recap"
  if (trimmed === "document" || trimmed === "uploaded-document") return "uploaded_document"
  if (trimmed === "spoken-recap") return "spoken_recap"
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
    clientId:
      (payload.clientId ?? payload.coacheeId) === null
        ? null
        : readOptionalId(payload.clientId ?? payload.coacheeId) ?? null,
    trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId) ?? null,
    title: readText(payload.title, "session.title"),
    inputType,
    sourceText: readOptionalText(payload.sourceText, true) ?? null,
    sourceMimeType: readOptionalText(payload.sourceMimeType, true) ?? null,
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
