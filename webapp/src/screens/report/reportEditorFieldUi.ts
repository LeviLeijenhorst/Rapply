import type { JsonValue, ReportFieldType } from '@/storage/types'

export type FieldUiVariant =
  | 'plain_text'
  | 'single_line'
  | 'numeric'
  | 'date'
  | 'split_name'
  | 'split_address'
  | 'multi_select'
  | 'repeatable_rows'
  | 'split_tariff'
  | 'multi_select_numeric'
  | 'activities_rows'
  | 'single_choice_numeric'
  | 'single_choice_with_custom_reason'
  | 'activiteiten_en_keuzes'
  | 'akkoord_met_toelichting'
  | 'uren_motivering'
  | 'tarief_motivering'
  | 'maanden_object'

export type RepeatableActivityRow = {
  hours: string
  activity: string
}

export type TariffSplitValue = {
  amount: string
  motivation: string
}

export type AddressSplitValue = {
  visitPostcode: string
  visitPlace: string
  postalPostcode: string
  postalPlace: string
}

export const REINTEGRATIE_ACTIVITEITEN_OPTIES = [
  'Versterken werknemersvaardigheden',
  'Verbeteren persoonlijke effectiviteit',
  'In beeld brengen arbeidsmarktpositie',
] as const

const sectionTitleOverrides: Record<string, string> = {
  '1': 'Gegevens cli\u00ebnt',
  '2': 'Gegevens UWV',
  '3': 'Gegevens re-integratiebedrijf',
  '4': 'Wat is het ordernummer?',
  '5': 'Re-integratieactiviteiten en begeleidingsuren',
  '6': 'Doorlooptijd',
  '7': 'Visie op dienstverlening',
  '8': 'Specialistisch uurtarief',
}

const defaultCollapsedSectionTitles = new Set([
  'Gegevens cli\u00ebnt',
  'Gegevens UWV',
  'Gegevens re-integratiebedrijf',
  'Wat is het ordernummer?',
])

export function asObject(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, JsonValue>
}

export function asText(value: JsonValue): string {
  if (typeof value === 'string') return value
  if (value === null || typeof value === 'undefined') return ''
  return JSON.stringify(value)
}

export function readSingleChoiceOptions(fieldId: string): Array<{ value: number; label: string }> {
  const map: Record<string, Array<{ value: number; label: string }>> = {
    rp_werkfit_8_1: [
      { value: 1, label: 'Ja' },
      { value: 2, label: 'Nee' },
    ],
    er_werkfit_4_2: [
      { value: 1, label: "Beëindiging re-integratiedienst 'Werkfit maken' naar aanleiding van evaluatiemoment" },
      { value: 2, label: 'Voortijdige terugmelding' },
      { value: 3, label: "Beëindiging re-integratiedienst 'Werkfit maken'" },
    ],
    er_werkfit_6_1: [
      { value: 1, label: 'Ziekte langer dan 4 weken (klant met een Ziektewet-uitkering)' },
      { value: 2, label: 'Ziekte langer dan 13 weken (klant met een arbeidsongeschiktheidsuitkering)' },
      { value: 3, label: 'Verhuizing van de klant' },
      { value: 4, label: 'Overlijden van de klant' },
      { value: 5, label: 'Bezwaar of beroep tegen het werkplan, Plan van aanpak of re-integratieplan' },
      { value: 6, label: 'Anders' },
    ],
    er_werkfit_7_3: [
      { value: 1, label: 'De klant is werkfit en kan aan het werk' },
      { value: 2, label: 'De klant is niet werkfit' },
    ],
    er_werkfit_8_2: [
      { value: 1, label: 'Ja' },
      { value: 2, label: 'Nee' },
    ],
  }
  return map[fieldId] || []
}

export function readDefaultSectionTitle(sectionKey: string, fallbackTitle: string): string {
  return sectionTitleOverrides[sectionKey] || fallbackTitle || `Rubriek ${sectionKey}`
}

export function isDefaultCollapsedSection(sectionTitle: string): boolean {
  return defaultCollapsedSectionTitles.has(String(sectionTitle || '').trim())
}

export function stripNumberPrefix(label: string): string {
  return String(label || '')
    .replace(/^\s*\d+(?:\.\d+)?\s*/, '')
    .replace(/^\s*[-:.]\s*/, '')
    .trim()
}

export function readNumberFromLabel(label: string): string {
  const match = String(label || '').match(/^(\d+(?:\.\d+)?)/)
  return match?.[1] || ''
}

export function capitalizeFirstLetter(value: string): string {
  const text = String(value || '')
  const trimmedStart = text.match(/^\s*/)?.[0] || ''
  const rest = text.slice(trimmedStart.length)
  if (!rest) return text
  return `${trimmedStart}${rest.charAt(0).toUpperCase()}${rest.slice(1)}`
}

export function formatInitialsForEditing(nextValue: string, previousValue: string): string {
  const nextRaw = String(nextValue || '')
  const prevRaw = String(previousValue || '')
  if (nextRaw.length < prevRaw.length) {
    if (prevRaw.endsWith('.') && nextRaw === prevRaw.slice(0, -1)) {
      return prevRaw.slice(0, -2).toUpperCase()
    }
    return nextRaw.toUpperCase()
  }
  const letters = nextRaw.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (!letters) return ''
  return letters
    .split('')
    .map((letter) => `${letter}.`)
    .join('')
}

export function normalizeInitialsForSave(value: string): string {
  const letters = String(value || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (!letters) return ''
  return letters
    .split('')
    .map((letter) => `${letter}.`)
    .join('')
}

export function decomposeNameField(fullName: string): { initials: string; surname: string } {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return { initials: '', surname: '' }
  const normalizePlainInitials = (token: string): string => {
    const raw = String(token || '').trim()
    const onlyLetters = raw.replace(/[^a-zA-Z]/g, '')
    if (!onlyLetters) return ''
    const looksLikeInitials = /^[A-Z]+$/.test(onlyLetters) && onlyLetters.length <= 6
    if (!looksLikeInitials) return ''
    return normalizeInitialsForSave(onlyLetters)
  }

  const firstSpaceIndex = cleaned.indexOf(' ')
  if (firstSpaceIndex < 0) {
    const normalizedInitials = normalizePlainInitials(cleaned)
    if (normalizedInitials) return { initials: normalizedInitials, surname: '' }
    if (cleaned.includes('.') || cleaned.length <= 2) return { initials: cleaned, surname: '' }
    return { initials: '', surname: cleaned }
  }
  const firstToken = cleaned.slice(0, firstSpaceIndex).trim()
  const normalizedInitials = normalizePlainInitials(firstToken)
  if (normalizedInitials) {
    return {
      initials: normalizedInitials,
      surname: cleaned.slice(firstSpaceIndex + 1).trim(),
    }
  }
  if (!firstToken.includes('.') && firstToken.length > 2) {
    const nameParts = cleaned.split(' ').filter(Boolean)
    const surnameOnly = nameParts.length > 1 ? nameParts.slice(1).join(' ') : cleaned
    return { initials: '', surname: surnameOnly }
  }
  return {
    initials: firstToken,
    surname: cleaned.slice(firstSpaceIndex + 1).trim(),
  }
}

export function composeNameField(initials: string, surname: string, normalizeForSave: boolean): string {
  const normalizedInitials = normalizeForSave ? normalizeInitialsForSave(initials) : String(initials || '').trim()
  const normalizedSurname = normalizeForSave ? capitalizeFirstLetter(String(surname || '').trim()) : String(surname || '').trim()
  return `${normalizedInitials} ${normalizedSurname}`.trim()
}

export function isBsnDraftValidForSave(value: string): boolean {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return true
  return digits.length === 8 || digits.length === 9
}

export function normalizeNumericInput(value: string): string {
  return String(value || '').replace(/[^\d]/g, '')
}

export function shouldCapitalizeField(numberKey: string, label: string): boolean {
  const sectionKey = String(numberKey || '').split('.')[0]
  if (!['1', '2', '3'].includes(sectionKey)) return false
  const normalizedLabel = String(label || '').toLowerCase()
  if (normalizedLabel.includes('e-mail') || normalizedLabel.includes('email') || normalizedLabel.includes('telefoon')) return false
  if (numberKey === '1.2') return false
  return true
}

export function serializeMultiSelectDeterministic(values: string[]): string {
  const selected = new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
  return REINTEGRATIE_ACTIVITEITEN_OPTIES.filter((option) => selected.has(option)).join(' | ')
}

export function deserializeMultiSelect(value: string): string[] {
  const selected = new Set(
    String(value || '')
      .split(/\s*(?:\||;|,|\n)\s*/)
      .map((part) => String(part || '').trim())
      .filter(Boolean),
  )
  return REINTEGRATIE_ACTIVITEITEN_OPTIES.filter((option) => selected.has(option))
}

export function serializeRepeatableRows(rows: RepeatableActivityRow[]): string {
  return rows
    .map((row) => ({ hours: normalizeNumericInput(row.hours), activity: String(row.activity || '').trim() }))
    .filter((row) => row.hours || row.activity)
    .map((row) => {
      if (row.activity && row.hours) return `${row.activity} (${row.hours} uur)`
      if (row.activity) return row.activity
      return `${row.hours} uur`
    })
    .join('; ')
}

export function deserializeRepeatableRows(value: string): RepeatableActivityRow[] {
  const rows = String(value || '')
    .split(/\s*;\s*/)
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s*\(\s*([0-9]+)\s*(?:uur|uren)?\s*\)\s*$/i)
      if (match) {
        return {
          activity: String(match[1] || '').trim(),
          hours: String(match[2] || '').trim(),
        }
      }
      const hours = normalizeNumericInput(part)
      const activity = String(part.replace(/[0-9]+/g, '') || '').replace(/[()]/g, '').trim()
      return { hours, activity }
    })
    .filter((row) => row.hours || row.activity)
  return rows.length > 0 ? rows : [{ hours: '', activity: '' }]
}

export function serializeTariffSplit(value: TariffSplitValue): string {
  const amount = normalizeNumericInput(value.amount)
  const motivation = String(value.motivation || '').trim()
  if (!amount && !motivation) return ''
  return `Uurtarief: ${amount}. Motivatie: ${motivation}`.trim()
}

export function deserializeTariffSplit(value: string): TariffSplitValue {
  const text = String(value || '')
  const amountMatch = text.match(/(?:uurtarief|tarief)[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i) || text.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
  const motivationMatch = text.match(/(?:motivatie|motivering)\s*:\s*([\s\S]+)/i)
  return {
    amount: String(amountMatch?.[1] || '').replace(/[^\d]/g, ''),
    motivation: String(motivationMatch?.[1] || '').trim(),
  }
}

export function serializeAddressSplit(value: AddressSplitValue): string {
  const visitPostcode = String(value.visitPostcode || '').trim()
  const visitPlace = String(value.visitPlace || '').trim()
  const postalPostcode = String(value.postalPostcode || '').trim()
  const postalPlace = String(value.postalPlace || '').trim()
  if (!visitPostcode && !visitPlace && !postalPostcode && !postalPlace) return ''
  return `Bezoek postcode: ${visitPostcode}; Bezoek plaats: ${visitPlace}; Post postcode: ${postalPostcode}; Post plaats: ${postalPlace}`
}

export function deserializeAddressSplit(value: string): AddressSplitValue {
  const text = String(value || '').trim()
  if (!text) {
    return { visitPostcode: '', visitPlace: '', postalPostcode: '', postalPlace: '' }
  }
  const visitPostcode = text.match(/bezoek\s+postcode\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  const visitPlace = text.match(/bezoek\s+plaats\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  const postalPostcode = text.match(/post\s+postcode\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  const postalPlace = text.match(/post\s+plaats\s*:\s*([^;]+)/i)?.[1]?.trim() || ''
  if (visitPostcode || visitPlace || postalPostcode || postalPlace) {
    return { visitPostcode, visitPlace, postalPostcode, postalPlace }
  }
  const genericPostcodeMatch = text.match(/\b\d{4}\s?[A-Za-z]{2}\b/)
  const genericPostcode = genericPostcodeMatch?.[0] || ''
  const genericPlace = text.replace(genericPostcode, '').trim()
  return {
    visitPostcode: genericPostcode,
    visitPlace: genericPlace,
    postalPostcode: genericPostcode,
    postalPlace: genericPlace,
  }
}

export function readFieldVariant(params: { fieldId?: string; numberKey: string; fieldType: ReportFieldType }): FieldUiVariant {
  const { fieldId = '', numberKey, fieldType } = params
  if (fieldId === 'rp_werkfit_5_1') return 'multi_select_numeric'
  if (fieldId === 'rp_werkfit_5_3') return 'activities_rows'
  if (fieldId === 'rp_werkfit_8_1' || fieldId === 'er_werkfit_4_2' || fieldId === 'er_werkfit_7_3') return 'single_choice_numeric'
  if (fieldId === 'er_werkfit_6_1') return 'single_choice_with_custom_reason'
  if (fieldId === 'er_werkfit_7_1') return 'activiteiten_en_keuzes'
  if (fieldId === 'er_werkfit_8_2') return 'akkoord_met_toelichting'
  if (fieldId === 'rp_werkfit_8_2') return 'uren_motivering'
  if (fieldId === 'rp_werkfit_8_3') return 'tarief_motivering'
  if (fieldId === 'rp_werkfit_6_1') return 'maanden_object'

  if (numberKey === '1.1') return 'split_name'
  if (numberKey === '3.4') return 'split_address'
  if (numberKey === '5.1') return 'multi_select'
  if (numberKey === '5.3') return 'repeatable_rows'
  if (numberKey === '6.1' || numberKey === '1.2' || numberKey === '8.1') return 'numeric'
  if (fieldType === 'programmatic') return 'single_line'
  return 'plain_text'
}

