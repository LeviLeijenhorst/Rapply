import type { PipelineTemplate } from '@/api/pipeline/pipelineApi'
import type { JsonValue, StructuredReport, StructuredReportField } from '@/storage/types'

function normalizeWhitespace(value: string): string {
  return String(value || '').replace(/\u00a0/g, ' ').trim()
}

function answerToText(answer: JsonValue): string {
  if (typeof answer === 'string') return normalizeWhitespace(answer)
  if (answer === null || typeof answer === 'undefined') return ''
  return JSON.stringify(answer)
}

function parseJsonObjectFromAnswer(answer: JsonValue): Record<string, JsonValue> | null {
  if (answer && typeof answer === 'object' && !Array.isArray(answer)) return answer as Record<string, JsonValue>
  if (typeof answer !== 'string') return null
  const raw = normalizeWhitespace(answer)
  if (!raw.startsWith('{') || !raw.endsWith('}')) return null
  try {
    const parsed = JSON.parse(raw) as JsonValue
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, JsonValue>
  } catch {
    return null
  }
}

function parseLegacyActivityDistribution(value: string): Array<{ activiteit: string; uren: number }> {
  return String(value || '')
    .split(/\s*;\s*/)
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s*\(\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:uur|uren)?\s*\)\s*$/i)
      if (!match) return { activiteit: part, uren: 0 }
      return { activiteit: normalizeWhitespace(match[1]), uren: parseNormalizedDecimal(match[2]) }
    })
}

function parseNormalizedDecimal(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric * 100) / 100
}

function formatNormalizedDecimal(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  return String(value.toFixed(2)).replace(/\.?0+$/, '')
}

function parseAddressComposite(value: string): {
  visitPostcode: string
  visitPlace: string
  postalPostcode: string
  postalPlace: string
} {
  const normalized = String(value || '').trim()
  const visitPostcode = normalized.match(/bezoek\s+postcode\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  const visitPlace = normalized.match(/bezoek\s+plaats\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  const postalPostcode = normalized.match(/post\s+postcode\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  const postalPlace = normalized.match(/post\s+plaats\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  return { visitPostcode, visitPlace, postalPostcode, postalPlace }
}

function decomposeNameForExport(value: string): { initials: string; surname: string } {
  const normalized = normalizeWhitespace(value).replace(/\s+/g, ' ')
  if (!normalized) return { initials: '', surname: '' }
  const parts = normalized.split(' ').filter(Boolean)
  if (parts.length === 1) return { initials: '', surname: parts[0] }
  const first = parts[0] || ''
  const rest = parts.slice(1).join(' ').trim()
  const onlyLetters = first.replace(/[^a-zA-Z]/g, '')
  const looksLikeInitials = first.includes('.') || (onlyLetters.length > 0 && onlyLetters.length <= 4 && first.toUpperCase() === first)
  const initials = looksLikeInitials
    ? onlyLetters
        .toUpperCase()
        .split('')
        .map((ch) => `${ch}.`)
        .join('')
    : `${(onlyLetters.charAt(0) || '').toUpperCase()}.`
  return { initials, surname: rest || normalized }
}

function readAnswer(fields: Record<string, StructuredReportField>, fieldId: string): JsonValue {
  return fields[fieldId]?.answer ?? ''
}

function asObject(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, JsonValue>
}

function asArray(value: JsonValue): JsonValue[] {
  return Array.isArray(value) ? value : []
}

function readNumericChoiceText(fieldId: string, value: number): string {
  const mappings: Record<string, Record<number, string>> = {
    rp_werkfit_8_1: { 1: 'Ja', 2: 'Nee' },
    er_werkfit_4_2: {
      1: "Be\u00ebindiging re-integratiedienst 'Werkfit maken' naar aanleiding van het evaluatiemoment",
      2: 'Voortijdige terugmelding',
      3: "Be\u00ebindiging re-integratiedienst 'Werkfit maken'",
    },
    er_werkfit_6_1: {
      1: 'Ziekte langer dan 4 weken (klant met een Ziektewet-uitkering)',
      2: 'Ziekte langer dan 13 weken (klant met een arbeidsongeschiktheidsuitkering)',
      3: 'Verhuizing van de klant',
      4: 'Overlijden van de klant',
      5: 'Bezwaar of beroep tegen het werkplan, Plan van aanpak of re-integratieplan',
      6: 'Anders',
    },
    er_werkfit_7_3: {
      1: 'De klant is werkfit en kan aan het werk',
      2: 'De klant is niet werkfit',
    },
    er_werkfit_8_2: { 1: 'Ja', 2: 'Nee' },
  }
  return mappings[fieldId]?.[value] || String(value)
}

export function buildStructuredReportText(template: PipelineTemplate, report: StructuredReport): string {
  return template.fields
    .map((templateField) => {
      const answer = answerToText(readAnswer(report.fields, templateField.fieldId))
      if (!answer) return ''
      return `### ${templateField.exportNumberKey} ${templateField.label}\n${answer}`
    })
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

export function buildStructuredExportContext(template: PipelineTemplate, report: StructuredReport): Record<string, string> {
  const context: Record<string, string> = {}
  for (const field of template.fields) {
    const raw = readAnswer(report.fields, field.fieldId)
    const asText = answerToText(raw)
    if (!asText) continue
    const numberKey = field.exportNumberKey.replace('.', '_')
    context[numberKey] = asText
    context[field.fieldId] = asText
  }

  const rp53 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'rp_werkfit_5_3'))
  const rp53Rows = rp53 ? asArray(rp53.activiteiten) : parseLegacyActivityDistribution(answerToText(readAnswer(report.fields, 'rp_werkfit_5_3')))
  if (rp53Rows.length > 0) {
    let total = 0
    for (let index = 0; index < 5; index += 1) {
      const row = asObject(rp53Rows[index] ?? null)
      const activiteit = row ? normalizeWhitespace(String(row.activiteit ?? '')) : normalizeWhitespace(String((rp53Rows[index] as any)?.activiteit ?? ''))
      const uren = row ? parseNormalizedDecimal(row.uren ?? 0) : parseNormalizedDecimal((rp53Rows[index] as any)?.uren ?? 0)
      context[`5_3_${index + 1}_re_integratieactiviteit`] = activiteit
      context[`5_3_${index + 1}_aantal_begeleidingsuren`] = formatNormalizedDecimal(uren)
      if (Number.isFinite(uren)) total += uren
    }
    context['5_3_totaal_aantal_begeleidingsuren'] = formatNormalizedDecimal(parseNormalizedDecimal(total))
  }

  const er71 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'er_werkfit_7_1'))
  const er71Rows = er71 ? asArray(er71.activiteiten) : parseLegacyActivityDistribution(answerToText(readAnswer(report.fields, 'er_werkfit_7_1')))
  if (er71Rows.length > 0) {
    let total = 0
    for (let index = 0; index < 5; index += 1) {
      const row = asObject(er71Rows[index] ?? null)
      const activiteit = row ? normalizeWhitespace(String(row.activiteit ?? '')) : normalizeWhitespace(String((er71Rows[index] as any)?.activiteit ?? ''))
      const uren = row ? parseNormalizedDecimal(row.uren ?? 0) : parseNormalizedDecimal((er71Rows[index] as any)?.uren ?? 0)
      context[`7_1_${index + 1}_re_integratieactiviteit`] = activiteit
      context[`7_1_${index + 1}_aantal_begeleidingsuren`] = formatNormalizedDecimal(uren)
      if (Number.isFinite(uren)) total += uren
    }
    context['7_1_totaal_aantal_begeleidingsuren'] = formatNormalizedDecimal(parseNormalizedDecimal(total))
  }

  const rp82 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'rp_werkfit_8_2'))
  if (rp82) {
    context['8_2_aantal_uren'] = formatNormalizedDecimal(parseNormalizedDecimal(rp82.uren ?? ''))
    context['8_2_motivering'] = normalizeWhitespace(String(rp82.motivering ?? ''))
  } else {
    const raw = answerToText(readAnswer(report.fields, 'rp_werkfit_8_2'))
    const hoursMatch = raw.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
    const motivationMatch = raw.match(/(?:motivering|motivatie)\s*:\s*([\s\S]+)/i)
    context['8_2_aantal_uren'] = formatNormalizedDecimal(parseNormalizedDecimal(hoursMatch?.[1] || ''))
    context['8_2_motivering'] = normalizeWhitespace(String(motivationMatch?.[1] || ''))
  }

  const rp83 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'rp_werkfit_8_3'))
  if (rp83) {
    const tarief = String(rp83.tarief ?? '')
    const motivering = normalizeWhitespace(String(rp83.motivering ?? ''))
    context['8_3a'] = tarief
    context['8_3b'] = motivering
    context['8_3_uurtarief_exclusief_btw'] = tarief
    context['8_3_motivering'] = motivering
  } else {
    const raw = answerToText(readAnswer(report.fields, 'rp_werkfit_8_3'))
    const rateMatch = raw.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
    const motivationMatch = raw.match(/(?:motivering|motivatie)\s*:\s*([\s\S]+)/i)
    context['8_3a'] = String(rateMatch?.[1] || '').replace(',', '.')
    context['8_3b'] = normalizeWhitespace(String(motivationMatch?.[1] || ''))
    context['8_3_uurtarief_exclusief_btw'] = context['8_3a']
    context['8_3_motivering'] = context['8_3b']
  }

  const er42 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'er_werkfit_4_2'))
  if (er42 && typeof er42.keuze === 'number') context['er_werkfit_4_2_keuze_tekst'] = readNumericChoiceText('er_werkfit_4_2', er42.keuze)
  const er61 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'er_werkfit_6_1'))
  if (er61 && typeof er61.reden === 'number') context['er_werkfit_6_1_reden_tekst'] = readNumericChoiceText('er_werkfit_6_1', er61.reden)
  const er73 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'er_werkfit_7_3'))
  if (er73 && typeof er73.resultaat === 'number') context['er_werkfit_7_3_resultaat_tekst'] = readNumericChoiceText('er_werkfit_7_3', er73.resultaat)
  const er82 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'er_werkfit_8_2'))
  if (er82 && typeof er82.akkoord === 'number') context['er_werkfit_8_2_akkoord_tekst'] = readNumericChoiceText('er_werkfit_8_2', er82.akkoord)

  const rp51 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'rp_werkfit_5_1'))
  if (rp51 && Array.isArray(rp51.keuzes)) context['rp_werkfit_5_1_keuzes'] = JSON.stringify(rp51.keuzes)

  const rp81 = parseJsonObjectFromAnswer(readAnswer(report.fields, 'rp_werkfit_8_1'))
  if (rp81 && typeof rp81.keuze === 'number') context['rp_werkfit_8_1_keuze'] = String(rp81.keuze)

  if (er42 && typeof er42.keuze === 'number') context['er_werkfit_4_2_keuze'] = String(er42.keuze)
  if (er61 && typeof er61.reden === 'number') {
    context['er_werkfit_6_1_reden'] = String(er61.reden)
    context['er_werkfit_6_1_custom_reason'] = normalizeWhitespace(String(er61.customReason ?? ''))
  }
  if (er73 && typeof er73.resultaat === 'number') context['er_werkfit_7_3_resultaat'] = String(er73.resultaat)
  if (er82 && typeof er82.akkoord === 'number') context['er_werkfit_8_2_akkoord'] = String(er82.akkoord)

  const rawName =
    answerToText(readAnswer(report.fields, 'rp_werkfit_1_1')) ||
    answerToText(readAnswer(report.fields, 'er_werkfit_1_1')) ||
    answerToText(readAnswer(report.fields, '1_1'))
  const name = decomposeNameForExport(rawName)
  if (name.initials) {
    context['1_1_voorletters'] = name.initials
    context['voorletters'] = name.initials
  }
  if (name.surname) {
    context['1_1_achternaam'] = name.surname
    context['achternaam'] = name.surname
  }
  if (name.initials || name.surname) {
    context['voorletters_en_achternaam'] = [name.initials, name.surname].filter(Boolean).join(' ').trim()
  }

  const address = parseAddressComposite(answerToText(readAnswer(report.fields, 'rp_werkfit_3_4')))
  context['3_4_bezoek_postcode'] = address.visitPostcode
  context['3_4_bezoek_plaats'] = address.visitPlace
  context['3_4_post_postcode'] = address.postalPostcode
  context['3_4_post_plaats'] = address.postalPlace

  return context
}
