import type { Report } from "../types/Report"
import { readId, readOptionalId, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

export function readOptionalReportState(value: unknown): Report["state"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "incomplete" || trimmed === "needs_review" || trimmed === "complete") return trimmed
  return undefined
}

export function readReportInput(value: unknown): Report {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs ?? payload.updatedAtUnixMs, "report.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "report.updatedAtUnixMs")
  const id = readOptionalText(payload.id, true) || `report-${readId(payload.sourceSessionId ?? payload.sessionId, "report.sourceSessionId")}`
  return {
    id,
    clientId: payload.clientId === null ? null : readOptionalId(payload.clientId) ?? null,
    trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId) ?? null,
    sourceSessionId: payload.sourceSessionId === null ? null : readOptionalId(payload.sourceSessionId ?? payload.sessionId) ?? null,
    title: readOptionalText(payload.title, true) ?? "",
    reportType: readOptionalText(payload.reportType, true) ?? "session_report",
    state: readOptionalReportState(payload.state) ?? "needs_review",
    reportText: readText(payload.reportText ?? payload.text, "report.reportText"),
    reportDate: readOptionalText(payload.reportDate, true) ?? null,
    firstSickDay: readOptionalText(payload.firstSickDay, true) ?? null,
    wvpWeekNumber: readOptionalText(payload.wvpWeekNumber, true) ?? null,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
