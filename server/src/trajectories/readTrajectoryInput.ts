import type { Trajectory } from "../types/Trajectory"
import { readId, readOptionalNumber, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

function readOptionalPlanOfAction(value: unknown): Trajectory["planOfAction"] | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "object") return undefined
  const payload = value as Record<string, unknown>
  const documentId = readOptionalText(payload.documentId, true)
  if (typeof documentId !== "string") return null
  return { documentId }
}

export function readTrajectoryInput(value: unknown): Trajectory {
  const payload = (value || {}) as Record<string, unknown>
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "trajectory.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "trajectory.updatedAtUnixMs")
  return {
    id: readId(payload.id, "trajectory.id"),
    clientId: readId(payload.clientId, "trajectory.clientId"),
    name: readText(payload.name, "trajectory.name"),
    serviceType: readOptionalText(payload.serviceType ?? payload.dienstType, true) ?? "Werkfit maken",
    uwvContactName: readOptionalText(payload.uwvContactName, true) ?? null,
    uwvContactPhone: readOptionalText(payload.uwvContactPhone, true) ?? null,
    uwvContactEmail: readOptionalText(payload.uwvContactEmail, true) ?? null,
    orderNumber: readOptionalText(payload.orderNumber, true) ?? null,
    startDate: readOptionalText(payload.startDate, true) ?? null,
    planOfAction: readOptionalPlanOfAction(payload.planOfAction ?? payload.planVanAanpak) ?? null,
    maxHours: readOptionalNumber(payload.maxHours) ?? 41,
    maxAdminHours: readOptionalNumber(payload.maxAdminHours) ?? 3,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
