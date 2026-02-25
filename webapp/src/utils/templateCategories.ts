function normalizeTemplateName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function isGespreksverslagTemplateName(name: string): boolean {
  const normalized = normalizeTemplateName(name)
  if (!normalized) return false

  if (normalized === 'intake' || normalized === 'intakeverslag') return true
  if (
    normalized === 'voortgangsgesprek' ||
    normalized === 'voortgangsgespreksverslag' ||
    normalized === 'voortgangsrapportage'
  ) {
    return true
  }
  if (
    normalized === 'terugkoppelingsrapportclient' ||
    normalized === 'terugkoppelingsrapportvoorclient' ||
    normalized === 'terugkoppelingclient' ||
    normalized === 'terugkoppelingsrapportwerknemer' ||
    normalized === 'terugkoppelingsrapportvoorwerknemer' ||
    normalized === 'terugkoppelingwerknemer'
  ) {
    return true
  }

  return false
}
