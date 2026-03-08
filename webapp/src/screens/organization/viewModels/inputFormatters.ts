export function capitalizeFirstLetter(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function normalizePhoneValue(value: string): string {
  const raw = String(value || '')
  let sanitized = raw.replace(/[^\d+]/g, '')
  const hasLeadingPlus = sanitized.startsWith('+')
  sanitized = sanitized.replace(/\+/g, '')
  return `${hasLeadingPlus ? '+' : ''}${sanitized}`
}

export function normalizeEmailValue(value: string): string {
  return String(value || '').trim().toLowerCase()
}

export function normalizeHouseNumberValue(value: string): string {
  return String(value || '')
    .replace(/[^0-9a-zA-Z]/g, '')
    .toUpperCase()
}

export function normalizePostalCodeValue(value: string): string {
  return String(value || '')
    .replace(/[^0-9a-zA-Z]/g, '')
    .toUpperCase()
}
