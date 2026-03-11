import type { SnippetType } from '../../types/snippet'

export function classifySnippetType(field: string): SnippetType {
  const normalized = String(field || '').toLowerCase()
  const legacyReportFields = [
    'startsituatie_client',
    'uitgevoerde_activiteiten',
    'voortgang_klant',
    'belemmeringen_beperkingen',
    'ontwikkeling_werknemersvaardigheden',
    'arbeidsmarktorientatie',
    'onderbouwing_werkfitheid',
    'mening_klant_werkfitheid',
    'advies_vervolg',
    'reden_beeindiging',
  ]

  if (legacyReportFields.includes(normalized)) return 'report'
  if (normalized.startsWith('rp_werkfit_') || normalized.startsWith('er_werkfit_')) return 'report'
  if (normalized === 'general') return 'knowledge'
  if (normalized.includes('uwv') || normalized.includes('report') || normalized.includes('rapport')) return 'report'
  return 'knowledge'
}
