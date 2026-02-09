import { env } from "../env"
import type { BillingStatus } from "./store"

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function getTestTranscriptionTotalSeconds(): number {
  const totalHours = Number(env.testTranscriptionTotalHours)
  if (!Number.isFinite(totalHours) || totalHours <= 0) return 0
  return Math.floor(totalHours * 3600)
}

export function isTestTranscriptionEmail(email: string | null): boolean {
  const normalizedEmail = email ? normalizeEmail(email) : ""
  const allowedEmails = env.testTranscriptionEmails.map((allowedEmail) => normalizeEmail(allowedEmail))
  const isAllowed = !!email && allowedEmails.includes(normalizedEmail)
  console.log("[billing] test transcription check", { email, normalizedEmail, allowedEmails, isAllowed })
  return isAllowed
}

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
