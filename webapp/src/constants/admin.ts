export const adminAccountEmail = 'contact@jnlsolutions.nl'

export function normalizeEmail(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase()
}

export function isAdminEmail(value: string | null | undefined): boolean {
  return normalizeEmail(value) === adminAccountEmail
}
