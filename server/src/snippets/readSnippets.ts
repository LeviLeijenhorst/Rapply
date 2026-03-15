import type { Snippet } from "../types/Snippet"
import { readId, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

// Parses an optional snippet approval status from unknown input.
export function readOptionalSnippetStatus(value: unknown): Snippet["approvalStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "pending" || trimmed === "approved" || trimmed === "rejected") return trimmed
  return undefined
}

// Parses and validates a snippet payload from request input.
export function readSnippet(value: unknown): Snippet {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "snippet.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "snippet.updatedAtUnixMs")
  const sourceSessionId = readOptionalText(payload.sourceSessionId ?? payload.itemId, true) ?? ""
  const fieldId = readText(payload.fieldId ?? payload.field ?? payload.snippetType, "snippet.fieldId")
  const snippetType = readText(payload.snippetType ?? fieldId, "snippet.snippetType")
  return {
    id: readId(payload.id, "snippet.id"),
    clientId: readId(payload.clientId, "snippet.clientId"),
    trajectoryId: readOptionalText(payload.trajectoryId, true) ?? null,
    sourceSessionId,
    sourceInputId: sourceSessionId || null,
    snippetType,
    fieldId,
    text: readText(payload.text, "snippet.text"),
    snippetDate: readUnixMs(payload.snippetDate ?? payload.date, "snippet.snippetDate"),
    approvalStatus: readOptionalSnippetStatus(payload.approvalStatus ?? payload.status) ?? "pending",
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
