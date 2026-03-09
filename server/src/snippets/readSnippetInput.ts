import type { Snippet } from "../types/Snippet"
import { readId, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

export function readOptionalSnippetStatus(value: unknown): Snippet["approvalStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "pending" || trimmed === "approved" || trimmed === "rejected") return trimmed
  return undefined
}

export function readSnippetInput(value: unknown): Snippet {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "snippet.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "snippet.updatedAtUnixMs")
  return {
    id: readId(payload.id, "snippet.id"),
    clientId: readId(payload.clientId, "snippet.clientId"),
    trajectoryId: readId(payload.trajectoryId, "snippet.trajectoryId"),
    sourceSessionId: readId(payload.sourceSessionId ?? payload.itemId, "snippet.sourceSessionId"),
    snippetType: readText(payload.snippetType ?? payload.field, "snippet.snippetType"),
    text: readText(payload.text, "snippet.text"),
    snippetDate: readUnixMs(payload.snippetDate ?? payload.date, "snippet.snippetDate"),
    approvalStatus: readOptionalSnippetStatus(payload.approvalStatus ?? payload.status) ?? "pending",
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
