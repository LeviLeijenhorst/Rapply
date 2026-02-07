import { env } from "../env"
import type { BillingStatus } from "./store"

export const unlimitedTranscriptionRemainingSeconds = Number.MAX_SAFE_INTEGER

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isUnlimitedTranscriptionEmail(email: string | null): boolean {
  if (!email) return false
  const normalizedEmail = normalizeEmail(email)
  return env.unlimitedTranscriptionEmails.some((allowedEmail) => normalizeEmail(allowedEmail) === normalizedEmail)
}

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
