import type { Activity } from "../types/Activity"
import { readId, readOptionalId, readOptionalNumber, readText, readUnixMs } from "../routes/parsers/scalars"

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

export function readActivityInput(value: unknown): Activity {
  const payload = (value || {}) as Record<string, unknown>
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
