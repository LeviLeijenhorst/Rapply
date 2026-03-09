import type { ActivityTemplate } from "../types/ActivityTemplate"
import { readId, readOptionalNumber, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

export function readActivityTemplateInput(value: unknown): ActivityTemplate {
  const payload = (value || {}) as Record<string, unknown>
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
