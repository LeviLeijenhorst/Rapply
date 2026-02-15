import { env } from "../env"
import { isEmailAllowlisted } from "./emailAllowlist"
import type { BillingStatus } from "./store"

export const unlimitedTranscriptionRemainingSeconds = 2_000_000_000

// Intent: isUnlimitedTranscriptionEmail
export function isUnlimitedTranscriptionEmail(email: string | null): boolean {
  return isEmailAllowlisted(email, env.unlimitedTranscriptionEmails)
}

// Intent: applyUnlimitedTranscriptionToBillingStatus
export function applyUnlimitedTranscriptionToBillingStatus(status: BillingStatus): BillingStatus {
  return {
    ...status,
    includedSeconds: unlimitedTranscriptionRemainingSeconds,
    cycleRemainingSeconds: unlimitedTranscriptionRemainingSeconds,
    nonExpiringTotalSeconds: unlimitedTranscriptionRemainingSeconds,
    nonExpiringRemainingSeconds: unlimitedTranscriptionRemainingSeconds,
    remainingSeconds: unlimitedTranscriptionRemainingSeconds,
  }
}
