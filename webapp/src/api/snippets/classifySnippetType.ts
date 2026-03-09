import type { SnippetType } from '../../types/snippet'

export function classifySnippetType(field: string): SnippetType {
  const normalized = String(field || '').toLowerCase()
  const reportFields = [
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

  if (reportFields.includes(normalized)) return 'report'
  if (normalized.includes('uwv') || normalized.includes('report') || normalized.includes('rapport')) return 'report'
  return 'knowledge'
}
