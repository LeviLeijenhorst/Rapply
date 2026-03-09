import type { Activity, ActivityTemplate, Client, Note, Session, Snippet, Template, Trajectory, WrittenReport } from "../../appData"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readText, readUnixMs } from "./scalars"

function normalizeTemplateName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function inferTemplateCategoryFromName(name: string): Template["category"] {
  const normalized = normalizeTemplateName(name)
  if (!normalized) return "ander-verslag"
  if (normalized === "intake" || normalized === "intakeverslag") return "gespreksverslag"
  if (
    normalized === "voortgangsgesprek" ||
    normalized === "voortgangsgespreksverslag" ||
    normalized === "voortgangsrapportage"
  ) {
    return "gespreksverslag"
  }
  if (
    normalized === "terugkoppelingsrapportclient" ||
    normalized === "terugkoppelingsrapportvoorclient" ||
    normalized === "terugkoppelingclient" ||
    normalized === "terugkoppelingsrapportwerknemer" ||
    normalized === "terugkoppelingsrapportvoorwerknemer" ||
    normalized === "terugkoppelingwerknemer"
  ) {
    return "gespreksverslag"
  }
  return "ander-verslag"
}

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

// Parses an optional session transcription status enum value.
export function readOptionalTranscriptionStatus(value: unknown): Session["transcriptionStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "idle" || trimmed === "transcribing" || trimmed === "generating" || trimmed === "done" || trimmed === "error") {
    return trimmed
  }
  return undefined
}

export function readOptionalSessionType(value: unknown): Session["kind"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "recording" || trimmed === "upload" || trimmed === "written" || trimmed === "notes" || trimmed === "intake") {
    return trimmed
  }
  return undefined
}

export function readOptionalActivityStatus(value: unknown): Activity["status"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "planned" || trimmed === "executed") return trimmed
  return undefined
}

export function readOptionalActivitySource(value: unknown): Activity["source"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "manual" || trimmed === "ai_detected") return trimmed
  return undefined
}

export function readOptionalSnippetStatus(value: unknown): Snippet["status"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "pending" || trimmed === "approved" || trimmed === "rejected") return trimmed
  return undefined
}

function readOptionalPlanVanAanpak(value: unknown): Trajectory["planVanAanpak"] | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "object") return undefined
  const payload = value as Record<string, unknown>
  const documentId = readOptionalText(payload.documentId, true)
  if (typeof documentId !== "string") return null
  return { documentId }
}

// Parses a client payload from request input.
export function readClient(value: unknown): Client {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "client.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "client.updatedAtUnixMs")
  return {
    id: readId(payload.id, "client.id"),
    name: readText(payload.name, "client.name"),
    clientDetails: readOptionalText(payload.clientDetails, true) ?? "",
    employerDetails: readOptionalText(payload.employerDetails, true) ?? "",
    firstSickDay: readOptionalText(payload.firstSickDay, true) ?? "",
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
  const kind = readOptionalSessionType(payload.kind) ?? readText(payload.kind, "session.kind") as Session["kind"]
  return {
    id: readId(payload.id, "session.id"),
    clientId: payload.clientId === null ? null : readOptionalId(payload.clientId) ?? null,
    trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId) ?? null,
    title: readText(payload.title, "session.title"),
    kind,
    audioBlobId: readOptionalText(payload.audioBlobId, true) ?? null,
    audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds) ?? null,
    uploadFileName: readOptionalText(payload.uploadFileName, true) ?? null,
    transcript: readOptionalText(payload.transcript, true) ?? null,
    summary: readOptionalText(payload.summary, true) ?? null,
    summaryStructured: readOptionalStructuredSessionSummary(payload.summaryStructured) ?? null,
    reportDate: readOptionalText(payload.reportDate, true) ?? null,
    wvpWeekNumber: readOptionalText(payload.wvpWeekNumber, true) ?? null,
    reportFirstSickDay: readOptionalText(payload.reportFirstSickDay, true) ?? null,
    transcriptionStatus: readOptionalTranscriptionStatus(payload.transcriptionStatus) ?? "idle",
    transcriptionError: readOptionalText(payload.transcriptionError, true) ?? null,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

export function readTrajectory(value: unknown): Trajectory {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "trajectory.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "trajectory.updatedAtUnixMs")
  return {
    id: readId(payload.id, "trajectory.id"),
    clientId: readId(payload.clientId, "trajectory.clientId"),
    name: readText(payload.name, "trajectory.name"),
    dienstType: readOptionalText(payload.dienstType, true) ?? "Werkfit maken",
    uwvContactName: readOptionalText(payload.uwvContactName, true) ?? null,
    uwvContactPhone: readOptionalText(payload.uwvContactPhone, true) ?? null,
    uwvContactEmail: readOptionalText(payload.uwvContactEmail, true) ?? null,
    orderNumber: readOptionalText(payload.orderNumber, true) ?? null,
    startDate: readOptionalText(payload.startDate, true) ?? null,
    planVanAanpak: readOptionalPlanVanAanpak(payload.planVanAanpak) ?? null,
    maxHours: readOptionalNumber(payload.maxHours) ?? 41,
    maxAdminHours: readOptionalNumber(payload.maxAdminHours) ?? 3,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

export function readSnippet(value: unknown): Snippet {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "snippet.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "snippet.updatedAtUnixMs")
  return {
    id: readId(payload.id, "snippet.id"),
    trajectoryId: readId(payload.trajectoryId, "snippet.trajectoryId"),
    itemId: readId(payload.itemId, "snippet.itemId"),
    field: readText(payload.field, "snippet.field"),
    text: readText(payload.text, "snippet.text"),
    date: readUnixMs(payload.date, "snippet.date"),
    status: readOptionalSnippetStatus(payload.status) ?? "pending",
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

export function readActivity(value: unknown): Activity {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "activity.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "activity.updatedAtUnixMs")
  return {
    id: readId(payload.id, "activity.id"),
    trajectoryId: readId(payload.trajectoryId, "activity.trajectoryId"),
    sessionId: payload.sessionId === null ? null : readOptionalId(payload.sessionId) ?? null,
    templateId: payload.templateId === null ? null : readOptionalId(payload.templateId) ?? null,
    name: readText(payload.name, "activity.name"),
    category: readText(payload.category, "activity.category"),
    status: readOptionalActivityStatus(payload.status) ?? "planned",
    plannedHours: readOptionalNumber(payload.plannedHours) ?? null,
    actualHours: readOptionalNumber(payload.actualHours) ?? null,
    source: readOptionalActivitySource(payload.source) ?? "manual",
    isAdmin: typeof payload.isAdmin === "boolean" ? payload.isAdmin : false,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

export function readActivityTemplate(value: unknown): ActivityTemplate {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "activityTemplate.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "activityTemplate.updatedAtUnixMs")
  return {
    id: readId(payload.id, "activityTemplate.id"),
    name: readText(payload.name, "activityTemplate.name"),
    description: readOptionalText(payload.description, true) ?? "",
    category: readText(payload.category, "activityTemplate.category"),
    defaultHours: readOptionalNumber(payload.defaultHours) ?? 0,
    isAdmin: typeof payload.isAdmin === "boolean" ? payload.isAdmin : false,
    organizationId: readOptionalText(payload.organizationId, true) ?? null,
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
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
  const name = readText(payload.name, "template.name")
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "template.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "template.updatedAtUnixMs")
  const category =
    payload.category === "gespreksverslag" || payload.category === "ander-verslag" ? payload.category : inferTemplateCategoryFromName(name)
  if (!Array.isArray(payload.sections)) {
    throw new Error("Missing template.sections")
  }
  return {
    id: readId(payload.id, "template.id"),
    name,
    category,
    description: readOptionalText(payload.description, true) ?? "",
    sections: payload.sections.map((section: unknown, index: number) => readTemplateSection(section, index)),
    isSaved: typeof payload.isSaved === "boolean" ? payload.isSaved : false,
    isDefault: typeof payload.isDefault === "boolean" ? payload.isDefault : false,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

