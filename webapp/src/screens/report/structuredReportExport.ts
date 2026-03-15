import type { PipelineTemplate } from '@/api/pipeline/pipelineApi'
import type { StructuredReport, StructuredReportField } from '@/storage/types'

function normalizeWhitespace(value: string): string {
  return String(value || '').replace(/\u00a0/g, ' ').trim()
}

function parseHours(value: string): string {
  const match = normalizeWhitespace(value).match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
  return String(match?.[1] || '').replace(',', '.')
}

function parseActivityDistribution(value: string): Array<{ activity: string; hours: string }> {
  return String(value || '')
    .split(/\s*;\s*/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s*\(\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:uur|uren)?\s*\)\s*$/i)
      if (match) {
        return {
          activity: normalizeWhitespace(match[1]),
          hours: String(match[2] || '').replace(',', '.'),
        }
      }
      const compactMatch = part.match(/^([0-9]+(?:[.,][0-9]+)?)\s*h(?:our|ours|uur|uren)?\s*:\s*(.*)$/i)
      if (compactMatch) {
        return {
          activity: normalizeWhitespace(compactMatch[2]),
          hours: String(compactMatch[1] || '').replace(',', '.'),
        }
      }
      const hours = parseHours(part)
      const activity = normalizeWhitespace(part.replace(/\(?\s*[0-9]+(?:[.,][0-9]+)?\s*(?:uur|uren)?\s*\)?/i, ''))
      return { activity, hours }
    })
    .filter((row) => row.activity || row.hours)
}

function parseSpecialistExpertise(value: string): { hours: string; motivation: string } {
  const normalized = String(value || '')
  const hoursMatch =
    normalized.match(/aantal\s+uren\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i) ||
    normalized.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
  const motivationMatch = normalized.match(/(?:motivering|motivatie)\s*:\s*([\s\S]+)/i)
  return {
    hours: String(hoursMatch?.[1] || '').replace(',', '.').trim(),
    motivation: normalizeWhitespace(String(motivationMatch?.[1] || '')),
  }
}

function parseSpecialistTariff(value: string): { hourlyRate: string; motivation: string } {
  const normalized = String(value || '')
  const hourlyRateMatch =
    normalized.match(/(?:uurtarief|tarief|eur)[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i) || normalized.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
  const motivationMatch = normalized.match(/(?:motivering|motivatie)\s*:\s*([\s\S]+)/i) || normalized.match(/motivering?\s*-\s*([\s\S]+)/i)
  return {
    hourlyRate: String(hourlyRateMatch?.[1] || '').replace(',', '.').trim(),
    motivation: normalizeWhitespace(String(motivationMatch?.[1] || '')),
  }
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
  if (visitPostcode || visitPlace || postalPostcode || postalPlace) {
    return { visitPostcode, visitPlace, postalPostcode, postalPlace }
  }
  const fallbackPostcode = normalized.match(/\b\d{4}\s?[A-Za-z]{2}\b/)?.[0] || ''
  const fallbackPlace = normalizeWhitespace(normalized.replace(fallbackPostcode, ''))
  return {
    visitPostcode: fallbackPostcode,
    visitPlace: fallbackPlace,
    postalPostcode: fallbackPostcode,
    postalPlace: fallbackPlace,
  }
}

function readAnswer(fields: Record<string, StructuredReportField>, fieldId: string): string {
  return normalizeWhitespace(String(fields[fieldId]?.answer || ''))
}

export function buildStructuredReportText(template: PipelineTemplate, report: StructuredReport): string {
  return template.fields
    .map((templateField) => {
      const answer = readAnswer(report.fields, templateField.fieldId)
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
    const answer = readAnswer(report.fields, field.fieldId)
    if (!answer) continue
    const numberKey = field.exportNumberKey.replace('.', '_')
    context[numberKey] = answer
    context[field.fieldId] = answer
  }

  const activityDistribution = context['5_3']
  if (activityDistribution) {
    const rows = parseActivityDistribution(activityDistribution)
    let total = 0
    for (let index = 0; index < 5; index += 1) {
      const row = rows[index]
      const rowNumber = index + 1
      context[`5_3_${rowNumber}_re_integratieactiviteit`] = row?.activity || ''
      context[`5_3_${rowNumber}_aantal_begeleidingsuren`] = row?.hours || ''
      const parsedHours = Number(row?.hours || '')
      if (Number.isFinite(parsedHours)) total += parsedHours
    }
    context['5_3_totaal_aantal_begeleidingsuren'] = total > 0 ? String(total).replace(/\.0$/, '') : ''
  }

  const specialistExpertise = context['8_2']
  if (specialistExpertise) {
    const parsed = parseSpecialistExpertise(specialistExpertise)
    context['8_2_aantal_uren'] = parsed.hours
    context['8_2_motivering'] = parsed.motivation
  }

  const specialistTariff = context['8_3']
  if (specialistTariff) {
    const parsed = parseSpecialistTariff(specialistTariff)
    context['8_3a'] = parsed.hourlyRate
    context['8_3b'] = parsed.motivation
    context['8_3_uurtarief_exclusief_btw'] = parsed.hourlyRate
    context['8_3_motivering'] = parsed.motivation
  }

  const compositeAddress = context['3_4']
  if (compositeAddress) {
    const parsed = parseAddressComposite(compositeAddress)
    context['3_4_bezoek_postcode'] = parsed.visitPostcode
    context['3_4_bezoek_plaats'] = parsed.visitPlace
    context['3_4_post_postcode'] = parsed.postalPostcode
    context['3_4_post_plaats'] = parsed.postalPlace
  }

  return context
}
