import type { RecoveryPolicy } from "../../encryption/e2ee"
import { readRequiredNumber, readText } from "./scalars"

const allowedE2eeObjectTypes = new Set([
  "client",
  "session",
  "note",
  "written_report",
  "template",
  "practice_settings",
  "audio_blob",
  "audio_stream",
])

// Parses optional E2EE recovery policy values from request input.
export function readOptionalRecoveryPolicy(value: unknown): RecoveryPolicy | null {
  if (value === undefined || value === null) return null
  const text = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (text === "self_service" || text === "custodian_only" || text === "hybrid") {
    return text
  }
  throw new Error("Invalid recoveryPolicy")
}

// Ensures an incoming E2EE object type is one of the supported values.
export function readRequiredObjectType(value: unknown): string {
  const objectType = readText(value, "objectType")
  if (!allowedE2eeObjectTypes.has(objectType)) {
    throw new Error("Invalid objectType")
  }
  return objectType
}

// Validates Argon2 settings against hard safety boundaries.
export function validateArgon2Params(params: { argon2TimeCost: number; argon2MemoryCostKib: number; argon2Parallelism: number }): void {
  const argon2TimeCost = readRequiredNumber(params.argon2TimeCost, "argon2TimeCost")
  const argon2MemoryCostKib = readRequiredNumber(params.argon2MemoryCostKib, "argon2MemoryCostKib")
  const argon2Parallelism = readRequiredNumber(params.argon2Parallelism, "argon2Parallelism")
  if (!Number.isInteger(argon2TimeCost) || argon2TimeCost < 1 || argon2TimeCost > 10) {
    throw new Error("Invalid argon2TimeCost")
  }
  if (!Number.isInteger(argon2MemoryCostKib) || argon2MemoryCostKib < 16 * 1024 || argon2MemoryCostKib > 2 * 1024 * 1024) {
    throw new Error("Invalid argon2MemoryCostKib")
  }
  if (!Number.isInteger(argon2Parallelism) || argon2Parallelism < 1 || argon2Parallelism > 16) {
    throw new Error("Invalid argon2Parallelism")
  }
}
