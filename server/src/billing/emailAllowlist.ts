// Normalizes an email value for case-insensitive allowlist checks.
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

// Returns true when an email exists in a configured allowlist.
export function isEmailAllowlisted(email: string | null, allowlist: string[]): boolean {
  const normalizedEmail = email ? normalizeEmail(email) : ""
  if (!normalizedEmail) return false
  return allowlist.some((allowedEmail) => normalizeEmail(allowedEmail) === normalizedEmail)
}
