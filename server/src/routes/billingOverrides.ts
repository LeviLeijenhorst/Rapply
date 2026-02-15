import type { BillingStatus } from "../billing/store"
import { applyFixedTranscriptionToBillingStatus, getFixedTranscriptionTotalSeconds, isFixedTranscriptionEmail } from "../billing/fixedTranscription"
import { applyTestTranscriptionToBillingStatus, getTestTranscriptionTotalSeconds, isTestTranscriptionEmail } from "../billing/testTranscription"
import { applyUnlimitedTranscriptionToBillingStatus, isUnlimitedTranscriptionEmail, unlimitedTranscriptionRemainingSeconds } from "../billing/unlimitedTranscription"

// Applies per-email billing overrides for test, fixed, or unlimited plans.
export function applyEmailBillingOverrides(status: BillingStatus, email: string | null): BillingStatus {
  if (isUnlimitedTranscriptionEmail(email)) {
    return applyUnlimitedTranscriptionToBillingStatus(status)
  }
  if (isFixedTranscriptionEmail(email)) {
    return applyFixedTranscriptionToBillingStatus(status)
  }
  if (isTestTranscriptionEmail(email)) {
    return applyTestTranscriptionToBillingStatus(status)
  }
  return status
}

// Resolves non-expiring total-second override for allowlisted emails.
export function getNonExpiringTotalSecondsOverrideForEmail(email: string | null): number | undefined {
  if (isUnlimitedTranscriptionEmail(email)) {
    return unlimitedTranscriptionRemainingSeconds
  }
  if (isFixedTranscriptionEmail(email)) {
    const totalSeconds = getFixedTranscriptionTotalSeconds()
    return totalSeconds > 0 ? totalSeconds : undefined
  }
  if (isTestTranscriptionEmail(email)) {
    const totalSeconds = getTestTranscriptionTotalSeconds()
    return totalSeconds > 0 ? totalSeconds : undefined
  }
  return undefined
}
