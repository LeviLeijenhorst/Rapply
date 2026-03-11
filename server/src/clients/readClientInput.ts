import type { Client } from "../types/Client"
import { readId, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

export function readClientInput(value: unknown): Client {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "client.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "client.updatedAtUnixMs")
  return {
    id: readId(payload.id, "client.id"),
    name: readText(payload.name, "client.name"),
    clientDetails: readOptionalText(payload.clientDetails, true) ?? "",
    employerDetails: readOptionalText(payload.employerDetails, true) ?? "",
    createdAtUnixMs,
    updatedAtUnixMs,
    isArchived: typeof payload.isArchived === "boolean" ? payload.isArchived : false,
  }
}
