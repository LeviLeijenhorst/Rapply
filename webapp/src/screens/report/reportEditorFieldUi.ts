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

const templateSectionTitleOverrides: Record<string, Record<string, string>> = {
  reintegratieplanwerkfitmaken: {
    '1': 'Gegevens cli\u00ebnt',
    '2': 'Gegevens UWV',
    '3': 'Gegevens re-integratiebedrijf',
    '4': 'Ordernummer',
    '5': 'Re-integratieactiviteiten en begeleidingsuren',
    '6': 'Doorlooptijd',
    '7': 'Visie op dienstverlening',
    '8': 'Specialistisch uurtarief',
  },
  eindrapportagewerkfitmaken: {
    '1': 'Gegevens klant',
    '2': 'Gegevens UWV',
    '3': 'Gegevens re-integratiebedrijf',
    '4': 'Aanleiding voor de eindrapportage',
    '5': 'Be\u00ebindiging re-integratiedienst naar aanleiding van het evaluatiemoment',
    '6': 'Be\u00ebindiging wegens voortijdige terugmelding',
    '7': 'Be\u00ebindiging re-integratiedienst',
    '8': 'Oordeel klant',
  },
}

const templateFieldLabelOverrides: Record<string, Record<string, string>> = {
  reintegratieplanwerkfitmaken: {
    '4.1': 'Wat is het ordernummer?',
    '3.4': 'Postcode en plaats (van het bezoekadres)',
    '7.2': 'Wat is uw visie op de re-integratiemogelijkheden van de cli\u00ebnt?',
    '7.3': 'Wat verwacht u van de inzet en het resultaat van de re-integratiedienst?',
  },
  eindrapportagewerkfitmaken: {
    '1.1': 'Voorletters en achternaam',
    '1.2': 'Burgerservicenummer',
    '2.1': 'Naam contactpersoon UWV',
    '3.1': 'Naam organisatie',
    '3.2': 'Naam contactpersoon',
    '4.1': 'Wat is het ordernummer?',
    '4.2': 'Van welke eindsituatie is sprake?',
    '5.1': 'Waarom be\u00ebindigt u de re-integratiedienst naar aanleiding van het evaluatiemoment? Is de klant het hiermee eens?',
    '5.2': 'Wat is uw advies voor het vervolg van de dienstverlening?',
    '6.1': 'Wat is de reden van de voortijdige terugmelding?',
    '6.2': 'Geef een toelichting op de reden van de voortijdige terugmelding.',
    '6.3': 'Een voortijdige terugmelding moet altijd vooraf worden besproken met de klant en met UWV. Met wie bij UWV heeft u dit besproken?',
    '7.1': 'Welke re-integratieactiviteiten heeft u voor de klant uitgevoerd? En hoeveel begeleidingsuren heeft u ingezet per activiteit?',
    '7.2': 'Welke vorderingen heeft de klant gemaakt?',
    '7.3': 'Wat is het bereikte resultaat?',
    '7.4': 'Geef aan waaruit blijkt dat de klant werkfit is, of wat de reden is dat de klant niet werkfit is.',
    '7.5': 'Is de klant naar zijn eigen mening werkfit? Waaruit blijkt dat?',
    '7.6': 'Wat is uw vervolgadvies en welke bemiddeling en/of begeleiding heeft de klant nog nodig?',
    '7.7': 'Toelichting op advies',
    '7.8': 'Wat vindt de klant van dit advies?',
    '8.1': 'Hoe heeft de klant de door u ingezette re-integratieactiviteiten ervaren?',
    '8.2': 'Is de klant akkoord met het aantal door u ingezette en verantwoorde begeleidingsuren?',
  },
}

const defaultCollapsedSectionTitles = new Set([
  'Gegevens cli\u00ebnt',
  'Gegevens UWV',
  'Gegevens re-integratiebedrijf',
  'Ordernummer',
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
      { value: 1, label: "Be\u00ebindiging re-integratiedienst 'Werkfit maken' naar aanleiding van het evaluatiemoment" },
      { value: 2, label: 'Voortijdige terugmelding' },
      { value: 3, label: "Be\u00ebindiging re-integratiedienst 'Werkfit maken'" },
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

function normalizeTemplateKey(templateIdOrName: string): string {
  return String(templateIdOrName || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function readDefaultSectionTitle(sectionKey: string, fallbackTitle: string, templateIdOrName = ''): string {
  const templateOverrides = templateSectionTitleOverrides[normalizeTemplateKey(templateIdOrName)] || {}
  return templateOverrides[sectionKey] || fallbackTitle || `Rubriek ${sectionKey}`
}

export function readDisplayFieldLabel(numberKey: string, fallbackLabel: string, templateIdOrName = ''): string {
  const templateOverrides = templateFieldLabelOverrides[normalizeTemplateKey(templateIdOrName)] || {}
  return templateOverrides[numberKey] || fallbackLabel
}

export function readSingleChoiceValueKey(fieldId: string): string {
  const map: Record<string, string> = {
    rp_werkfit_8_1: 'keuze',
    er_werkfit_4_2: 'keuze',
    er_werkfit_6_1: 'reden',
    er_werkfit_7_3: 'resultaat',
    er_werkfit_8_2: 'akkoord',
  }
  return map[fieldId] || 'keuze'
}

export function readConditionalHiddenFieldIds(params: { rp81Choice?: number | null; er42Choice?: number | null }): string[] {
  const hidden = new Set<string>()
  if (params.rp81Choice === 2) {
    hidden.add('rp_werkfit_8_2')
    hidden.add('rp_werkfit_8_3')
  }
  if (params.er42Choice === 1) {
    hidden.add('er_werkfit_6_1')
    hidden.add('er_werkfit_6_2')
    hidden.add('er_werkfit_6_3')
  }
  if (params.er42Choice === 2) {
    hidden.add('er_werkfit_5_1')
    hidden.add('er_werkfit_5_2')
  }
  if (params.er42Choice === 3) {
    hidden.add('er_werkfit_5_1')
    hidden.add('er_werkfit_5_2')
    hidden.add('er_werkfit_6_1')
    hidden.add('er_werkfit_6_2')
    hidden.add('er_werkfit_6_3')
  }
  return Array.from(hidden)
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

export function normalizeHoursInput(value: string): string {
  const normalized = String(value || '').replace(/,/g, '.')
  const filtered = normalized.replace(/[^\d.]/g, '')
  const firstDotIndex = filtered.indexOf('.')
  if (firstDotIndex < 0) return filtered.slice(0, 2)
  const before = filtered.slice(0, firstDotIndex).replace(/\./g, '').slice(0, 2)
  const after = filtered.slice(firstDotIndex + 1).replace(/\./g, '').slice(0, 2)
  const safeBefore = before || '0'
  if (filtered.endsWith('.') && after.length === 0) return `${safeBefore}.`
  return `${safeBefore}.${after}`
}

export function parseHoursToNumber(value: JsonValue): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0
  const normalized = normalizeHoursInput(String(value || ''))
  const parsed = Number(normalized.replace(/^\.$/, ''))
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100) / 100
}

export function shouldShowAkkoordToelichting(akkoordValue: number | null | undefined): boolean {
  return akkoordValue === 2
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
    .map((row) => ({ hours: normalizeHoursInput(row.hours), activity: String(row.activity || '').trim() }))
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
      const match = part.match(/^(.*?)\s*\(\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:uur|uren)?\s*\)\s*$/i)
      if (match) {
        return {
          activity: String(match[1] || '').trim(),
          hours: normalizeHoursInput(String(match[2] || '').trim()),
        }
      }
      const hours = normalizeHoursInput(part)
      const activity = String(part.replace(/[0-9]+(?:[.,][0-9]+)?/g, '') || '').replace(/[()]/g, '').trim()
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
  if (fieldId === 'rp_werkfit_3_4') return 'split_address'
  if (numberKey === '5.1') return 'multi_select'
  if (numberKey === '5.3') return 'repeatable_rows'
  if (numberKey === '6.1' || numberKey === '1.2' || numberKey === '8.1') return 'numeric'
  if (fieldType === 'programmatic') return 'single_line'
  return 'plain_text'
}
