import { env } from "../env"
import { isEmailAllowlisted } from "./emailAllowlist"
import type { BillingStatus } from "./store"

// Intent: getFixedTranscriptionTotalSeconds
export function getFixedTranscriptionTotalSeconds(): number {
  const totalMinutes = Number(env.fixedTranscriptionTotalMinutes)
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 0
  return Math.floor(totalMinutes * 60)
}

// Intent: isFixedTranscriptionEmail
export function isFixedTranscriptionEmail(email: string | null): boolean {
  return isEmailAllowlisted(email, env.fixedTranscriptionEmails)
}

// Intent: applyFixedTranscriptionToBillingStatus
export function applyFixedTranscriptionToBillingStatus(status: BillingStatus): BillingStatus {
  const totalSeconds = getFixedTranscriptionTotalSeconds()
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
