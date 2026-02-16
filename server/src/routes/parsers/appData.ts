import type { Coachee, Note, Session, Template, WrittenReport } from "../../appData"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readText, readUnixMs } from "./scalars"

// Parses an optional session transcription status enum value.
export function readOptionalTranscriptionStatus(value: unknown): Session["transcriptionStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "idle" || trimmed === "transcribing" || trimmed === "generating" || trimmed === "done" || trimmed === "error") {
    return trimmed
  }
  return undefined
}

// Parses a coachee payload from request input.
export function readCoachee(value: unknown): Coachee {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "coachee.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "coachee.updatedAtUnixMs")
  return {
    id: readId(payload.id, "coachee.id"),
    name: readText(payload.name, "coachee.name"),
    createdAtUnixMs,
    updatedAtUnixMs,
    isArchived: typeof payload.isArchived === "boolean" ? payload.isArchived : false,
  }
}

// Parses a session payload from request input.
export function readSession(value: unknown): Session {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "session.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "session.updatedAtUnixMs")
  const kind = readText(payload.kind, "session.kind") as Session["kind"]
  return {
    id: readId(payload.id, "session.id"),
    coacheeId: payload.coacheeId === null ? null : readOptionalId(payload.coacheeId) ?? null,
    title: readText(payload.title, "session.title"),
    kind,
    audioBlobId: readOptionalText(payload.audioBlobId, true) ?? null,
    audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds) ?? null,
    uploadFileName: readOptionalText(payload.uploadFileName, true) ?? null,
    transcript: readOptionalText(payload.transcript, true) ?? null,
    summary: readOptionalText(payload.summary, true) ?? null,
    transcriptionStatus: readOptionalTranscriptionStatus(payload.transcriptionStatus) ?? "idle",
    transcriptionError: readOptionalText(payload.transcriptionError, true) ?? null,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

// Parses a note payload from request input.
export function readNote(value: unknown): Note {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "note.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "note.updatedAtUnixMs")
  return {
    id: readId(payload.id, "note.id"),
    sessionId: readId(payload.sessionId, "note.sessionId"),
    title: typeof payload.title === "string" ? payload.title.trim() : "",
    text: readText(payload.text, "note.text"),
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

// Parses a written report payload from request input.
export function readWrittenReport(value: unknown): WrittenReport {
  const payload = (value || {}) as any
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "writtenReport.updatedAtUnixMs")
  return {
    sessionId: readId(payload.sessionId, "writtenReport.sessionId"),
    text: readText(payload.text, "writtenReport.text"),
    updatedAtUnixMs,
  }
}

// Parses one template section payload from request input.
export function readTemplateSection(value: unknown, index: number): Template["sections"][number] {
  const payload = (value || {}) as any
  return {
    id: readId(payload.id, `template.sections[${index}].id`),
    title: readText(payload.title, `template.sections[${index}].title`),
    description: readOptionalText(payload.description, true) ?? "",
  }
}

// Parses a template payload from request input.
export function readTemplate(value: unknown): Template {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "template.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "template.updatedAtUnixMs")
  if (!Array.isArray(payload.sections)) {
    throw new Error("Missing template.sections")
  }
  return {
    id: readId(payload.id, "template.id"),
    name: readText(payload.name, "template.name"),
    description: readOptionalText(payload.description, true) ?? "",
    sections: payload.sections.map((section: unknown, index: number) => readTemplateSection(section, index)),
    isSaved: typeof payload.isSaved === "boolean" ? payload.isSaved : false,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

