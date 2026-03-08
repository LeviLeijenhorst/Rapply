import type { Template, TemplateCategory } from '../storage/types'

export function normalizeTemplateName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function inferTemplateCategoryFromName(name: string): TemplateCategory {
  const normalized = normalizeTemplateName(name)
  if (!normalized) return 'ander-verslag'

  if (normalized === 'intake' || normalized === 'intakeverslag') return 'gespreksverslag'
  if (
    normalized === 'voortgangsgesprek' ||
    normalized === 'voortgangsgespreksverslag' ||
    normalized === 'voortgangsrapportage'
  ) {
    return 'gespreksverslag'
  }
  if (
    normalized === 'terugkoppelingsrapportclient' ||
    normalized === 'terugkoppelingsrapportvoorclient' ||
    normalized === 'terugkoppelingclient' ||
    normalized === 'terugkoppelingsrapportwerknemer' ||
    normalized === 'terugkoppelingsrapportvoorwerknemer' ||
    normalized === 'terugkoppelingwerknemer'
  ) {
    return 'gespreksverslag'
  }

  return 'ander-verslag'
}

export function isGespreksverslagTemplate(template: Pick<Template, 'name' | 'category'>): boolean {
  if (template.category === 'gespreksverslag') return true
  return inferTemplateCategoryFromName(template.name) === 'gespreksverslag'
}

export function isGespreksverslagTemplateName(name: string): boolean {
  return inferTemplateCategoryFromName(name) === 'gespreksverslag'
}
