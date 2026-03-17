import type { Snippet } from "../types/Snippet"
import { readId, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"
import { sanitizeSnippetText } from "./sanitizeSnippetText"

// Parses an optional snippet approval status from unknown input.
export function readOptionalSnippetStatus(value: unknown): Snippet["approvalStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "pending" || trimmed === "approved" || trimmed === "rejected") return trimmed
  return undefined
}

function readSnippetFieldIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const labels: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const normalized = String(item || "").trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

// Parses and validates a snippet payload from request input.
export function readSnippet(value: unknown): Snippet {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "snippet.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "snippet.updatedAtUnixMs")
  const sourceSessionId = readOptionalText(payload.sourceSessionId ?? payload.itemId, true) ?? ""
  const fieldIds = readSnippetFieldIds(payload.fieldIds ?? payload.fields)
  const fieldId = readText(payload.fieldId ?? payload.field ?? payload.snippetType ?? fieldIds[0], "snippet.fieldId")
  const snippetType = readText(payload.snippetType ?? fieldId ?? fieldIds[0], "snippet.snippetType")
  const normalizedFieldIds = fieldIds.length > 0 ? fieldIds : [fieldId]
  const sanitizedText = sanitizeSnippetText(readText(payload.text, "snippet.text"))
  return {
    id: readId(payload.id, "snippet.id"),
    clientId: readId(payload.clientId, "snippet.clientId"),
    trajectoryId: readOptionalText(payload.trajectoryId, true) ?? null,
    sourceSessionId,
    sourceInputId: sourceSessionId || null,
    fieldIds: normalizedFieldIds,
    snippetType,
    fieldId,
    text: sanitizedText,
    snippetDate: readUnixMs(payload.snippetDate ?? payload.date, "snippet.snippetDate"),
    approvalStatus: readOptionalSnippetStatus(payload.approvalStatus ?? payload.status) ?? "pending",
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
