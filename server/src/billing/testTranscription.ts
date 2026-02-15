import { env } from "../env"
import { isEmailAllowlisted } from "./emailAllowlist"
import type { BillingStatus } from "./store"

// Intent: getTestTranscriptionTotalSeconds
export function getTestTranscriptionTotalSeconds(): number {
  const totalHours = Number(env.testTranscriptionTotalHours)
  if (!Number.isFinite(totalHours) || totalHours <= 0) return 0
  return Math.floor(totalHours * 3600)
}

// Intent: isTestTranscriptionEmail
export function isTestTranscriptionEmail(email: string | null): boolean {
  return isEmailAllowlisted(email, env.testTranscriptionEmails)
}

// Intent: applyTestTranscriptionToBillingStatus
export function applyTestTranscriptionToBillingStatus(status: BillingStatus): BillingStatus {
  const totalSeconds = getTestTranscriptionTotalSeconds()
  if (totalSeconds <= 0) return status
  const nonExpiringTotalSeconds = totalSeconds
  const nonExpiringRemainingSeconds = Math.max(0, nonExpiringTotalSeconds - status.nonExpiringUsedSeconds)
  const remainingSeconds = status.cycleRemainingSeconds + nonExpiringRemainingSeconds
  return {
    ...status,
    nonExpiringTotalSeconds,
    nonExpiringRemainingSeconds,
    remainingSeconds,
  }
}
