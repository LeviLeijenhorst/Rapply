import { env } from "../env"
import type { BillingStatus } from "./store"

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function getFixedTranscriptionTotalSeconds(): number {
  const totalMinutes = Number(env.fixedTranscriptionTotalMinutes)
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 0
  return Math.floor(totalMinutes * 60)
}

export function isFixedTranscriptionEmail(email: string | null): boolean {
  const normalizedEmail = email ? normalizeEmail(email) : ""
  const allowedEmails = env.fixedTranscriptionEmails.map((allowedEmail) => normalizeEmail(allowedEmail))
  const isAllowed = !!email && allowedEmails.includes(normalizedEmail)
  console.log("[billing] fixed transcription check", { email, normalizedEmail, allowedEmails, isAllowed })
  return isAllowed
}

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
