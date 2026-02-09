import { env } from "../env"
import type { BillingStatus } from "./store"

export const unlimitedTranscriptionRemainingSeconds = 2_000_000_000

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isUnlimitedTranscriptionEmail(email: string | null): boolean {
  const normalizedEmail = email ? normalizeEmail(email) : ""
  const allowedEmails = env.unlimitedTranscriptionEmails.map((allowedEmail) => normalizeEmail(allowedEmail))
  const isAllowed = !!email && allowedEmails.includes(normalizedEmail)
  console.log("[billing] unlimited transcription check", { email, normalizedEmail, allowedEmails, isAllowed })
  return isAllowed
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
