import type { BillingStatus } from "../billing/store"

// Billing is controlled from admin pricing controls; env-based email overrides are disabled.
export function applyEmailBillingOverrides(status: BillingStatus, email: string | null): BillingStatus {
  void email
  return status
}

// Admin-granted seconds are stored in DB; no env-based override is applied.
export function getNonExpiringTotalSecondsOverrideForEmail(email: string | null): number | undefined {
  void email
  return undefined
}
