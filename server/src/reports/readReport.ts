import type { Report } from "../types/Report"
import { readId, readOptionalId, readOptionalText, readUnixMs } from "../routes/parsers/scalars"

type ReportInputPayload = Record<string, unknown>
type ReportState = Report["state"]

const reportStates: ReadonlySet<ReportState> = new Set(["incomplete", "needs_review", "complete"])

// Normalizes the incoming report payload into a predictable object shape.
function readReportPayload(value: unknown): ReportInputPayload {
  return (value || {}) as ReportInputPayload
}

// Preserves older payloads that still send sessionId instead of sourceSessionId.
function readSourceSessionId(payload: ReportInputPayload): string | null {
  if (payload.sourceSessionId === null) return null
  return readOptionalId(payload.sourceSessionId ?? payload.sessionId) ?? null
}

// Reuses an explicit report id when present and otherwise derives one from the source session.
function readReportId(payload: ReportInputPayload): string {
  const explicitId = readOptionalText(payload.id, true)
  if (explicitId) return explicitId
  return `report-${readId(payload.sourceSessionId ?? payload.sessionId, "report.sourceSessionId")}`
}

// Accepts both the current reportText field and the older text field.
function readReportText(payload: ReportInputPayload): string {
  return readOptionalText(payload.reportText ?? payload.text, true) ?? ""
}

// Falls back to updatedAt when older payloads omit createdAt.
function readCreatedAtUnixMs(payload: ReportInputPayload): number {
  return readUnixMs(payload.createdAtUnixMs ?? payload.updatedAtUnixMs, "report.createdAtUnixMs")
}

// Restricts report state to the current persisted values.
export function readOptionalReportState(value: unknown): ReportState | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim() as ReportState
  return reportStates.has(trimmed) ? trimmed : undefined
}

// Parses a request payload into the stored report shape.
export function readReport(value: unknown): Report {
  const payload = readReportPayload(value)

  return {
    id: readReportId(payload),
    clientId: payload.clientId === null ? null : readOptionalId(payload.clientId) ?? null,
    trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId) ?? null,
    sourceSessionId: readSourceSessionId(payload),
    title: readOptionalText(payload.title, true) ?? "",
    reportType: readOptionalText(payload.reportType, true) ?? "session_report",
    state: readOptionalReportState(payload.state) ?? "needs_review",
    reportText: readReportText(payload),
    reportDate: readOptionalText(payload.reportDate, true) ?? null,
    firstSickDay: readOptionalText(payload.firstSickDay, true) ?? null,
    wvpWeekNumber: readOptionalText(payload.wvpWeekNumber, true) ?? null,
    createdAtUnixMs: readCreatedAtUnixMs(payload),
    updatedAtUnixMs: readUnixMs(payload.updatedAtUnixMs, "report.updatedAtUnixMs"),
  }
}
