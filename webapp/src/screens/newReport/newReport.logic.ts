import { sendClientChatMessage } from '@/api/chat/sendClientChatPromptMessage'
import type { LocalChatMessage } from '@/api/chat/types'
import { exportReportToWord } from '@/api/reports/exportReportToWord'
import { classifySnippetType } from '@/api/snippets/classifySnippetType'
import { generateInputSummary as generateSessionSummary } from '@/api/summaries/generateSessionSummaryFromTranscript'
import { resolveSummaryTemplateSections } from '@/api/summaries/resolveSummaryTemplateSections'
import { parseReportSections } from '@/types/reportStructure'

import type {
  MetadataKind,
  NewReportScreenProps,
  RapportagePageMode,
  ReportFieldGroup,
  UwvField,
  UwvFieldGroup,
} from '@/screens/newReport/newReport.types'

type Template = {
  id?: string
  name: string
  description?: string | null
  sections?: Array<{ title?: string; description?: string }>
}

type LocalAppData = any

type NormalizedNewReportScreenProps = {
  initialCoacheeId: string | null
  initialSessionId: string | null
  initialClientId: string | null
  initialInputId: string | null
  mode: RapportagePageMode
}

function readSnippetLabels(snippet: { fields?: string[]; field?: string }): string[] {
  const labels = [
    ...(Array.isArray(snippet.fields) ? snippet.fields : []),
    String(snippet.field || '').trim(),
  ]
    .map((value) => String(value || '').trim())
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
  return labels.length > 0 ? labels : ['general']
}

export function normalizeNewReportScreenProps(props: NewReportScreenProps): NormalizedNewReportScreenProps {
  return {
    initialCoacheeId: props.initialCoacheeId ?? props.initialClientId ?? null,
    initialSessionId: props.initialSessionId ?? props.initialInputId ?? null,
    initialClientId: props.initialClientId ?? props.initialCoacheeId ?? null,
    initialInputId: props.initialInputId ?? props.initialSessionId ?? null,
    mode: props.mode ?? 'controleren',
  }
}

export function normalizeMatchValue(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function formatDateLabel(createdAtUnixMs: number): string {
  return new Date(createdAtUnixMs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function extractNumberPrefix(rawTitle: string): string {
  const match = String(rawTitle || '').trim().match(/^(\d{1,2})(?:[._]\d+)?\b/)
  return match ? String(match[1]) : '0'
}

export function cleanLabel(raw: string): string {
  return String(raw || '').replace(/^\d{1,2}(?:[._]\d+)?\s*/, '').trim()
}

export function capitalizeFirstLetter(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function capitalizeFirstLetterLowerRest(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

export function formatInitials(value: string): string {
  const letters = String(value || '').replace(/[^a-zA-Z]/g, '').toUpperCase().split('')
  return letters.length === 0 ? '' : `${letters.join('.')}.`
}

export function sanitizeInitialsOnChange(previousValue: string, nextValue: string): string {
  const previous = String(previousValue || '')
  const next = String(nextValue || '')
  const previousLetters = previous.replace(/[^a-zA-Z]/g, '').toUpperCase()
  const nextLetters = next.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (next.length < previous.length && nextLetters.length === previousLetters.length && previousLetters.length > 0) {
    return formatInitials(previousLetters.slice(0, -1))
  }
  return formatInitials(nextLetters)
}

export function normalizeYesNo(value: string): 'ja' | 'nee' | '' {
  const normalized = normalizeMatchValue(value)
  if (normalized === 'ja') return 'ja'
  if (normalized === 'nee') return 'nee'
  return ''
}

export function sanitizeCurrencyInput(value: string): string {
  const replaced = String(value || '').replace(/\./g, ',')
  const cleaned = replaced.replace(/[^0-9,]/g, '')
  const [whole, ...fractionParts] = cleaned.split(',')
  if (fractionParts.length === 0) return whole
  return `${whole},${fractionParts.join('')}`
}

export function sanitizePhoneInput(value: string): string {
  const raw = String(value || '')
  let sanitized = raw.replace(/[^\d+]/g, '')
  const hasLeadingPlus = sanitized.startsWith('+')
  sanitized = sanitized.replace(/\+/g, '')
  return `${hasLeadingPlus ? '+' : ''}${sanitized}`
}

export function parseStreetAndHouseNumber(addressLine: string): { street: string; houseNumber: string } {
  const normalized = String(addressLine || '').trim()
  if (!normalized) return { street: '', houseNumber: '' }
  const match = normalized.match(/^(.*?)(\d+[a-zA-Z0-9\-\/]*)$/)
  if (!match) return { street: normalized, houseNumber: '' }
  return { street: String(match[1] || '').trim().replace(/,\s*$/, ''), houseNumber: String(match[2] || '').trim() }
}

export function parsePostalCodeAndCity(value: string): { postalCode: string; city: string } {
  const normalized = String(value || '').trim()
  if (!normalized) return { postalCode: '', city: '' }
  const match = normalized.match(/^([1-9][0-9]{3}\s?[A-Za-z]{2})[\s,]+(.+)$/)
  if (!match) return { postalCode: '', city: normalized }
  return { postalCode: String(match[1] || '').toUpperCase().replace(/\s+/g, ' ').trim(), city: String(match[2] || '').trim() }
}

export function toPlaceholderKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function stripSectionNumberPrefix(value: string): string {
  return String(value || '')
    .replace(/^\s*\d{1,2}(?:[._-]\d+)?\s*/, '')
    .replace(/^\s*[-:.)]\s*/, '')
    .trim()
}

export function extractNumberKeyFromHeading(title: string): string {
  const raw = String(title || '').trim()
  const directMatch = raw.match(/^(\d{1,2})\s*[._-]\s*([0-9a-z])\b/i)
  if (!directMatch) return ''
  return `${Number(directMatch[1])}.${String(directMatch[2]).toLowerCase()}`
}

export function buildGeneratedFieldMap(reportText: string): { byNumberKey: Map<string, string>; byLabel: Map<string, string> } {
  const byNumberKey = new Map<string, string>()
  const byLabel = new Map<string, string>()
  const sections = parseReportSections(reportText || '')
  for (const section of sections) {
    const title = String(section.title || '').trim()
    const value = String(section.content || '').trim()
    if (!title || !value) continue
    const numberKey = extractNumberKeyFromHeading(title)
    if (numberKey) byNumberKey.set(numberKey, value)
    const cleanedTitle = stripSectionNumberPrefix(title)
    if (cleanedTitle) byLabel.set(normalizeMatchValue(cleanedTitle), value)
  }
  return { byNumberKey, byLabel }
}

export function buildReportTextFromFields(groupedFields: UwvFieldGroup[], fieldValues: Record<string, string>): string {
  return groupedFields
    .map((group) => {
      const lines = group.fields
        .map((field) => {
          const value = String(fieldValues[field.key] || '').trim()
          if (!value) return ''
          return `### ${field.rawLabel || field.label}\n${value}`
        })
        .filter(Boolean)
      return lines.join('\n\n')
    })
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

export function isMainActivityMultichoice(label: string): boolean {
  return normalizeMatchValue(label).includes('welke hoofdactiviteiten zijn in het werkplan of plan van aanpak benoemd')
}

export function isSpecialistTariffQuestion(label: string): boolean {
  return normalizeMatchValue(label).includes('is er sprake van specialistisch uurtarief')
}

export function isActivityHoursDistribution(label: string): boolean {
  return normalizeMatchValue(label).includes('hoe verdeelt u de begeleidingsuren over de re integratieactiviteiten')
}

export function isSpecialistExpertiseDetail(label: string): boolean {
  return normalizeMatchValue(label).includes('motiveer welke specialistische expertise voor de client nodig is en hoeveel uren u adviseert')
}

export function isSpecialistTariffDetail(label: string): boolean {
  return normalizeMatchValue(label).includes('wat is het in rekening te brengen hogere uurtarief voor de specialistische expertise motiveer waarom dit tarief noodzakelijk is')
}

export function splitCoacheeName(name: string): { initials: string; surname: string; full: string } {
  const cleaned = String(name || '').trim()
  if (!cleaned) return { initials: '', surname: '', full: '' }
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) return { initials: '', surname: capitalizeFirstLetterLowerRest(parts[0]), full: capitalizeFirstLetter(cleaned) }
  const surname = capitalizeFirstLetterLowerRest(parts[parts.length - 1])
  const initials = formatInitials(parts.slice(0, -1).map((part) => part.charAt(0)).join(''))
  return { initials, surname, full: capitalizeFirstLetter(cleaned) }
}

export function extractBsn(value: string): string {
  const matches = String(value || '').match(/\b\d{8,9}\b/g) || []
  return matches.find((candidate) => candidate.length === 8 || candidate.length === 9) || ''
}

export function detectMetadataKind(label: string, numberPrefix: string): MetadataKind {
  const normalized = normalizeMatchValue(label)
  if (normalized.includes('voorletters')) return 'initials'
  if (normalized.includes('achternaam')) return 'surname'
  if (normalized.includes('burgerservicenummer') || normalized === 'bsn') return 'bsn'
  if (normalized.includes('ordernummer')) return 'order'
  if (normalized.includes('e mailadres') || normalized.includes('e-mailadres')) return 'email'
  if (normalized.includes('telefoonnummer')) return 'phone'
  if (normalized.includes('doorlooptijd')) return 'months'
  if (normalized.includes('naam contactpersoon re integratiebedrijf')) return 'name'
  if (normalized.includes('naam client') || normalized.includes('naam cliënt')) return 'name'
  if (['1', '2', '3', '4'].includes(numberPrefix) && normalized.includes('naam')) return 'name'
  if (['1', '2', '3', '4'].includes(numberPrefix) && normalized.includes('functie')) return 'name'
  return 'none'
}

export function replaceFieldLabel(field: UwvField): string {
  const normalizedRaw = normalizeMatchValue(field.rawLabel)
  const normalizedLabel = normalizeMatchValue(field.label)
  if (normalizedLabel.includes('welke hoofdactiviteiten zijn in het werkplan of plan van aanpak benoemd')) return 'Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?'
  if (normalizedLabel.includes('verdeling begeleidingsuren over de re integratieactiviteiten')) return 'Hoe verdeelt U de begeleidingsuren over de re-integratieactiviteiten?'
  if (normalizedLabel.includes('afwijkingen van werkplan of plan van aanpak')) return 'Als U met de invulling van de re-integratieactiviteiten afwijkt van het werkplan of Plan van aanpak, geef aan op welke onderdelen U ervan afwijkt en waarom.'
  if (normalizedLabel.includes('maximale individuele doorlooptijd')) return 'Wat is de maximale individuele doorlooptijd van de re-integratiedienst?'
  if (normalizedLabel.includes('verwachting client van inzet resultaat en begeleiding')) return 'Wat verwacht de cliënt van de inzet en het resultaat van de re-integratiedienst? En van de begeleiding door uw organisatie?'
  if (normalizedLabel.includes('visie op re integratiemogelijkheden van de client')) return 'Wat is uw visie op de re-integratiemogelijkheden van de cliënt?'
  if (normalizedLabel.includes('verwachting van inzet en resultaat van de re integratiedienst')) return 'Wat verwacht de cliënt van de inzet en het resultaat van de re-integratiedienst?'
  if (normalizedLabel.includes('is er sprake van specialistisch uurtarief')) return 'Is er sprake van specialistisch uurtarief?'
  if (normalizedLabel.includes('specialistische expertise motivering en aantal uren')) return 'Motiveer welke specialistische expertise voor de cliënt nodig is en hoeveel uren u adviseert.'
  if (normalizedLabel.includes('hoger specialistisch uurtarief en motivering')) return 'Wat is het in rekening te brengen (hogere) uurtarief voor de specialistische expertise? Motiveer waarom dit tarief noodzakelijk is.'
  if (normalizedRaw.includes('ondertekening contactpersoon re integratiebedrijf') && normalizedLabel.includes('naam')) return 'Naam contactpersoon re-integratiebedrijf'
  if ((normalizedRaw.includes('ondertekening client') || normalizedRaw.includes('ondertekening klant')) && normalizedLabel.includes('naam')) return 'Naam cliënt'
  return field.label
}

export function getGroupTitle(templateName: string, numberPrefix: string): string {
  const normalizedTemplateName = normalizeMatchValue(templateName).replace(/\s+/g, '')
  if (normalizedTemplateName === 'reintegratieplanwerkfitmaken') {
    if (numberPrefix === '1') return 'Gegevens cliënt'
    if (numberPrefix === '2') return 'Gegevens UWV'
    if (numberPrefix === '3') return 'Gegevens re-integratiebedrijf'
    if (numberPrefix === '4') return 'Ordernummer'
    if (numberPrefix === '5') return 'Re-integratieactiviteiten en begeleidingsuren'
    if (numberPrefix === '6') return 'Doorlooptijd'
    if (numberPrefix === '7') return 'Visie op dienstverlening'
    if (numberPrefix === '8') return 'Specialistisch uurtarief'
    if (numberPrefix === '10') return 'Ondertekening'
    return `Onderdeel ${numberPrefix}`
  }
  if (normalizedTemplateName === 'eindrapportagewerkfitmaken') {
    if (numberPrefix === '1') return 'Gegevens cliënt'
    if (numberPrefix === '2') return 'Gegevens UWV'
    if (numberPrefix === '3') return 'Gegevens re-integratiebedrijf'
    if (numberPrefix === '4') return 'Ordernummer'
    if (numberPrefix === '5') return 'Beindiging dienstverlening'
    if (numberPrefix === '6') return 'Voortijdige terugmelding'
    if (numberPrefix === '7') return 'Resultaten traject'
    if (numberPrefix === '8') return 'Ervaring cliënt'
    if (numberPrefix === '9' || numberPrefix === '10') return 'Ondertekening'
  }
  return `Onderdeel ${numberPrefix}`
}

export function isWerkfitTemplate(template: Pick<Template, 'name'>): boolean {
  const normalized = normalizeMatchValue(template.name)
  if (!normalized.includes('werkfit')) return false
  if (normalized.includes('eindrapportage')) return false
  return normalized.includes('re integratieplan') || normalized.includes('reintegratieplan')
}

export function formatOnBlur(kind: MetadataKind, value: string): string {
  if (kind === 'initials') return formatInitials(value)
  if (kind === 'surname') return capitalizeFirstLetterLowerRest(value)
  if (kind === 'name') return capitalizeFirstLetter(value)
  if (kind === 'email') return String(value || '').trim().toLowerCase()
  if (kind === 'bsn') return String(value || '').replace(/\D/g, '').slice(0, 9)
  if (kind === 'months') return String(value || '').replace(/\D/g, '')
  if (kind === 'phone') return sanitizePhoneInput(value)
  return value
}

export function sanitizeOnChange(kind: MetadataKind, value: string, previousValue = ''): string {
  if (kind === 'initials') return sanitizeInitialsOnChange(previousValue, value)
  if (kind === 'surname') return capitalizeFirstLetterLowerRest(value)
  if (kind === 'name') return capitalizeFirstLetter(value)
  if (kind === 'bsn') return String(value || '').replace(/\D/g, '').slice(0, 9)
  if (kind === 'months') return String(value || '').replace(/\D/g, '')
  if (kind === 'phone') return sanitizePhoneInput(value)
  return value
}

export function normalizeFieldValueForStorage(field: Pick<UwvField, 'metadataKind'>, value: string): string {
  const raw = String(value || '')
  if (field.metadataKind === 'months') return raw.replace(/\D/g, '')
  return raw
}

export function placeholderForField(field: UwvField): string {
  const normalized = normalizeMatchValue(field.label)
  const organizationField =
    normalized.includes('naam organisatie') ||
    normalized.includes('bezoekadres') ||
    normalized.includes('postadres') ||
    normalized.includes('postcode en plaats') ||
    normalized.includes('functie contactpersoon') ||
    normalized.includes('naam contactpersoon re integratiebedrijf') ||
    (field.metadataKind === 'name' && normalized.includes('naam contactpersoon')) ||
    field.metadataKind === 'email' ||
    field.metadataKind === 'phone'
  if (organizationField) return 'Automatisch invullen uit organisatiegegevens'

  const clientField =
    field.metadataKind === 'initials' ||
    field.metadataKind === 'surname' ||
    field.metadataKind === 'bsn' ||
    (field.metadataKind === 'name' && (normalized.includes('naam client') || normalized.includes('naam cliënt')))
  if (clientField) return 'Automatisch invullen uit cliëntgegevens'

  const clientYearField =
    field.metadataKind === 'order' ||
    field.metadataKind === 'months' ||
    normalized.includes('weeknummer') ||
    normalized.includes('eerste ziektedag') ||
    normalized.includes('datum') ||
    normalized.includes('naam contactpersoon uwv')
  if (clientYearField) return 'Automatisch invullen uit cliëntgegevens / jaargegevens'

  return ''
}

export function buildFieldsFromTemplate(template: Template | null): UwvField[] {
  if (!template?.name) return []
  const normalizedTemplateName = normalizeMatchValue(template.name).replace(/\s+/g, '')
  const normalizedTemplate = resolveSummaryTemplateSections({ name: template.name, sections: [] })
  const sections: Array<{ title?: string; description?: string }> = Array.isArray(normalizedTemplate.sections)
    ? normalizedTemplate.sections
    : []
  const fields: UwvField[] = []
  let hasInsertedAddressBlocks = false

  sections.forEach((section, index) => {
    const rawTitle = String(section.title || '').trim()
    if (!rawTitle) return

    const numberPrefix = extractNumberPrefix(rawTitle)
    const normalizedRaw = normalizeMatchValue(rawTitle)
    if (normalizedRaw.includes('handtekening')) return
    if (normalizedTemplateName === 'reintegratieplanwerkfitmaken' && numberPrefix === '9') return

    if (normalizedRaw.includes('voorletters en achternaam')) {
      fields.push({ key: `${index}-initials`, rawLabel: rawTitle, label: 'Voorletters', numberPrefix, metadataKind: 'initials', singleLine: true, type: 'text' })
      fields.push({ key: `${index}-surname`, rawLabel: rawTitle, label: 'Achternaam', numberPrefix, metadataKind: 'surname', singleLine: true, type: 'text' })
      return
    }

    let label = cleanLabel(rawTitle)
    const normalizedLabel = normalizeMatchValue(label)
    if (normalizedLabel.includes('ondertekening contactpersoon re integratiebedrijf') && normalizedLabel.includes('naam')) {
      label = 'Naam contactpersoon re-integratiebedrijf'
    }
    if ((normalizedLabel.includes('ondertekening client') || normalizedLabel.includes('ondertekening klant')) && normalizedLabel.includes('naam')) {
      label = 'Naam cliënt'
    }

    label = replaceFieldLabel({ key: `${index}-${label}`, rawLabel: rawTitle, label, numberPrefix, metadataKind: 'none', singleLine: false, type: 'text' })
    const normalizedResolvedLabel = normalizeMatchValue(label)

    const isAddressSourceLabel =
      normalizedResolvedLabel.includes('postadres') ||
      normalizedResolvedLabel.includes('bezoekadres') ||
      normalizedResolvedLabel.includes('postcode en plaats')
    const shouldInsertAddressBlocksForGroupThree =
      numberPrefix === '3' && (isAddressSourceLabel || normalizedTemplateName === 'eindrapportagewerkfitmaken')
    if (shouldInsertAddressBlocksForGroupThree) {
      if (!hasInsertedAddressBlocks) {
        hasInsertedAddressBlocks = true
        const addressFields = [
          'Postadres straatnaam',
          'Postadres huisnummer',
          'Postadres postcode',
          'Postadres plaats',
          'Bezoekadres straatnaam',
          'Bezoekadres huisnummer',
          'Bezoekadres postcode',
          'Bezoekadres plaats',
        ]
        addressFields.forEach((addressLabel, addressIndex) => {
          fields.push({
            key: `${index}-address-${addressIndex}`,
            rawLabel: rawTitle,
            label: addressLabel,
            numberPrefix,
            metadataKind: 'none',
            singleLine: true,
            type: 'text',
          })
        })
      }
      if (isAddressSourceLabel) return
    }

    const fieldType: 'text' | 'multichoice' = isMainActivityMultichoice(label) || isSpecialistTariffQuestion(label) ? 'multichoice' : 'text'

    const metadataKind = detectMetadataKind(label, numberPrefix)
    const forceSingleLineLabels = ['bezoekadres', 'postadres', 'postcode en plaats', 'functie contactpersoon']
    const isForceSingleLine = forceSingleLineLabels.some((item) => normalizeMatchValue(label).includes(item))
    const singleLine = fieldType === 'text' ? (metadataKind !== 'none' || isForceSingleLine) : false

    fields.push({
      key: `${index}-${label}`,
      rawLabel: rawTitle,
      label,
      numberPrefix,
      metadataKind,
      singleLine,
      type: fieldType,
      options: fieldType === 'multichoice'
        ? (isMainActivityMultichoice(label)
          ? ['Versterken werknemersvaardigheden', 'Verbeteren persoonlijke effectiviteit', 'In beeld brengen arbeidsmarktpositie']
          : ['Ja', 'Nee'])
        : undefined,
    })
  })

  return fields
}

export function buildFallbackReportFromTemplate(template: Template): string {
  if (!Array.isArray(template.sections) || template.sections.length === 0) return ''
  return template.sections
    .map((section: { title?: string; description?: string }) => `### ${String(section.title || '').trim() || 'Onderdeel'}\n${String(section.description || '').trim() || '-'}`)
    .join('\n\n')
    .trim()
}

export function buildTemplatePromptText(template: Template | null): string {
  if (!template) return ''
  const sections = Array.isArray(template.sections) ? template.sections : []
  const sectionLines = sections
    .map((section: { title?: string; description?: string }, index: number) => {
      const title = String(section.title || '').trim() || `Onderdeel ${index + 1}`
      const description = String(section.description || '').trim()
      return description ? `${index + 1}. ${title}: ${description}` : `${index + 1}. ${title}`
    })
    .join('\n')
  if (!sectionLines) return `Maak nu een volledig verslag op basis van dit verslagtype: ${template.name}.`
  return [
    `Maak nu een volledig verslag op basis van dit verslagtype: ${template.name}.`,
    'Gebruik exact de onderstaande koppen en volgorde.',
    'Voeg geen extra koppen toe en laat geen kop weg.',
    '',
    'Onderdelen met uitleg:',
    sectionLines,
  ].join('\n')
}

function detectWerkfitReportTypeContext(templateName: string): { reportType: string; perspective: 'forward-looking plan' | 'retrospective evaluation' | 'generic report' } {
  const normalized = normalizeMatchValue(templateName).replace(/\s+/g, '')
  if (normalized === 'reintegratieplanwerkfitmaken') {
    return { reportType: 'Re-integratieplan Werkfit maken', perspective: 'forward-looking plan' }
  }
  if (normalized === 'eindrapportagewerkfitmaken') {
    return { reportType: 'Eindrapportage Werkfit maken', perspective: 'retrospective evaluation' }
  }
  return { reportType: String(templateName || '').trim() || 'Onbekend rapporttype', perspective: 'generic report' }
}

export async function generateReportText(params: {
  selectedTemplate: Template
  sourceText: string
  fallbackReportText: string
}): Promise<string> {
  const { selectedTemplate, sourceText, fallbackReportText } = params
  let generatedReport = ''
  if (sourceText) {
    generatedReport = await generateSessionSummary({ transcript: sourceText, template: resolveSummaryTemplateSections(selectedTemplate as any) })
  }
  return generatedReport || fallbackReportText
}

export async function exportReportWord(params: {
  templateName: string
  reportText: string
  contextValues: Record<string, string>
}): Promise<boolean> {
  return exportReportToWord({
    templateName: params.templateName,
    reportText: params.reportText,
    contextValues: params.contextValues,
  })
}

export function buildAssistantReportContext(params: {
  groupedFields: ReportFieldGroup[]
  fieldValues: Record<string, string>
  normalizeFieldValueForStorage: (field: any, value: string) => string
}): string {
  const { groupedFields, fieldValues, normalizeFieldValueForStorage } = params
  return groupedFields
    .map((group) => {
      const lines = group.fields
        .map((field) => {
          const value = normalizeFieldValueForStorage(field, String(fieldValues[field.key] || '').trim())
          if (!value) return ''
          return `${field.label}: ${value}`
        })
        .filter(Boolean)
      if (lines.length === 0) return ''
      return `${group.title}\n${lines.join('\n')}`
    })
    .filter(Boolean)
    .join('\n\n')
}

export async function sendReportAssistantMessage(params: {
  chatMessages: Array<{ role: 'user' | 'assistant'; text: string }>
  reportContext: string
}): Promise<string> {
  const modelMessages: LocalChatMessage[] = [
    {
      role: 'system',
      text:
        'Je bent een AI-assistent voor loopbaan- en re-integratiecoaches. Gebruik alleen de meegeleverde context en de vraag van de gebruiker. Schrijf formeel en zakelijk Nederlands, spreek de gebruiker aan met "u", en geef korte concrete antwoorden.',
    },
    {
      role: 'system',
      text: `Context:\n${params.reportContext || 'Geen context beschikbaar.'}`,
    },
    ...params.chatMessages.map<LocalChatMessage>((message) => ({ role: message.role, text: message.text })),
  ]

  return sendClientChatMessage(modelMessages)
}

export function buildReportGenerationSourceText(params: {
  data: LocalAppData
  selectedTemplate: Template
  selectedCoacheeName: string
  selectedTrajectory: { id: string | null; name: string; dienstType: string; startDate: string; orderNumber: string; planVanAanpakDocumentId: string | null }
  selectedSessionIds: string[]
  selectedRapportageIds: string[]
  selectedNoteIds: string[]
}): string {
  const { data, selectedTemplate, selectedCoacheeName, selectedTrajectory, selectedSessionIds, selectedRapportageIds, selectedNoteIds } = params
  const selectedSessionAndReportIds = new Set<string>([...selectedSessionIds, ...selectedRapportageIds])
  const reportTypeContext = detectWerkfitReportTypeContext(selectedTemplate.name)
  const writtenBySessionId = new Map(data.writtenReports.map((item: any) => [item.sessionId, item.text]))

  const sessionBlocks = data.sessions
    .filter((session: any) => selectedSessionAndReportIds.has(session.id))
    .sort((a: any, b: any) => a.createdAtUnixMs - b.createdAtUnixMs)
    .map((session: any) => {
      const parts: string[] = []
      parts.push(`Titel: ${String(session.title || '').trim() || 'Item'}`)
      if (session.transcript) parts.push(`Transcript:\n${session.transcript}`)
      if (session.summary) parts.push(`Samenvatting:\n${session.summary}`)
      const written = writtenBySessionId.get(session.id)
      if (written) parts.push(`Geschreven rapport:\n${written}`)
      return parts.join('\n\n').trim()
    })

  const selectedNotes = new Set(selectedNoteIds)
  const noteBlocks = data.notes
    .filter((note: any) => selectedNotes.has(note.id))
    .sort((a: any, b: any) => a.updatedAtUnixMs - b.updatedAtUnixMs)
    .map((note: any) => {
      const linkedSession = data.sessions.find((session: any) => session.id === note.sessionId) ?? null
      const title = String(note.title || '').trim() || 'Notitie'
      const body = String(note.text || '').trim()
      const sessionTitle = String(linkedSession?.title || '').trim()
      return [`Titel: ${title}`, sessionTitle ? `Notitie-sessie: ${sessionTitle}` : '', body ? `Notitie:\n${body}` : '']
        .filter(Boolean)
        .join('\n\n')
    })

  const relevantSnippets = data.snippets
    .filter((snippet: any) => {
      if (selectedTrajectory.id && snippet.trajectoryId !== selectedTrajectory.id) return false
      if (snippet.status !== 'approved') return false
      if (!readSnippetLabels(snippet).some((label) => classifySnippetType(label) === 'report')) return false
      return selectedSessionAndReportIds.has(snippet.itemId)
    })
    .sort((a: any, b: any) => a.date - b.date)

  const snippetLines = relevantSnippets
    .map((snippet: any) => {
      const fields = readSnippetLabels(snippet)
      const text = String(snippet.text || '').trim()
      const status = String(snippet.status || '').trim()
      return fields.length > 0 && text ? `SNIPPET_FIELDS=${fields.join(',')} | STATUS=${status} | TEKST=${text}` : ''
    })
    .filter(Boolean)

  const relevantActivities = data.activities
    .filter((activity: any) => {
      if (selectedTrajectory.id && activity.trajectoryId !== selectedTrajectory.id) return false
      if (activity.sessionId && selectedSessionAndReportIds.size > 0 && !selectedSessionAndReportIds.has(activity.sessionId)) return false
      return true
    })
    .sort((a: any, b: any) => a.createdAtUnixMs - b.createdAtUnixMs)

  const activityLines = relevantActivities
    .map((activity: any) => {
      const name = String(activity.name || '').trim()
      if (!name) return ''
      const status = activity.status === 'executed' ? 'uitgevoerd' : 'gepland'
      const plannedHours = Number.isFinite(activity.plannedHours as number) ? `${activity.plannedHours} gepland` : ''
      const actualHours = Number.isFinite(activity.actualHours as number) ? `${activity.actualHours} besteed` : ''
      const hoursLabel = [plannedHours, actualHours].filter(Boolean).join(', ')
      return `ACTIVITEIT=${name} | STATUS=${status}${hoursLabel ? ` | UREN=${hoursLabel}` : ''}`
    })
    .filter(Boolean)

  const contextLines = [
    '[COACHSCRIBE_REPORT_CONTEXT]',
    `REPORT_TYPE=${reportTypeContext.reportType}`,
    `REPORT_PERSPECTIVE=${reportTypeContext.perspective}`,
    `TEMPLATE_NAME=${String(selectedTemplate.name || '').trim()}`,
    `COACHEE_NAME=${String(selectedCoacheeName || '').trim()}`,
    `TRAJECTORY_NAME=${String(selectedTrajectory.name || '').trim()}`,
    `TRAJECTORY_SERVICE=${String(selectedTrajectory.dienstType || '').trim()}`,
    `TRAJECTORY_START_DATE=${String(selectedTrajectory.startDate || '').trim()}`,
    `TRAJECTORY_ORDER_NUMBER=${String(selectedTrajectory.orderNumber || '').trim()}`,
    `PLAN_VAN_AANPAK_AVAILABLE=${selectedTrajectory.planVanAanpakDocumentId ? 'ja' : 'nee'}`,
    ...snippetLines,
    ...activityLines,
    '[/COACHSCRIBE_REPORT_CONTEXT]',
  ].filter((line) => String(line || '').trim().length > 0)

  return [contextLines.join('\n'), ...sessionBlocks, ...noteBlocks]
    .filter(Boolean)
    .join('\n\n---\n\n')
    .trim()
}

export async function runGenerateFromSetup(params: {
  selectedTemplate: any
  isGenerating: boolean
  createSession: (payload: any) => string | null
  selectedCoachee: any
  selectedTrajectory: any
  data: any
  selectedSessionIds: string[]
  selectedRapportageIds: string[]
  selectedNoteIds: string[]
  setCurrentReportSessionId: (sessionId: string) => void
  isMountedRef: { current: boolean }
  setGenerateError: (value: string | null) => void
  setIsGenerating: (value: boolean) => void
  setGeneratedReportText: (value: string) => void
  setWrittenReport: (sessionId: string, text: string) => void
  updateSession: (sessionId: string, patch: any) => void
  setViewMode: (mode: 'edit') => void
  shouldAnimateReadyRevealRef: { current: boolean }
}) {
  const {
    selectedTemplate,
    isGenerating,
    createSession,
    selectedCoachee,
    selectedTrajectory,
    data,
    selectedSessionIds,
    selectedRapportageIds,
    selectedNoteIds,
    setCurrentReportSessionId,
    isMountedRef,
    setGenerateError,
    setIsGenerating,
    setGeneratedReportText,
    setWrittenReport,
    updateSession,
    setViewMode,
    shouldAnimateReadyRevealRef,
  } = params

  if (!selectedTemplate || isGenerating) return
  const sessionId = createSession({
    coacheeId: selectedCoachee?.id ?? null,
    trajectoryId: selectedTrajectory?.id ?? null,
    title: selectedTemplate.name.trim() || 'Rapportage',
    kind: 'written',
    audioBlobId: null,
    audioDurationSeconds: null,
    uploadFileName: null,
    transcriptionStatus: 'generating',
    transcriptionError: null,
  })
  if (!sessionId) return
  setCurrentReportSessionId(sessionId)

  if (isMountedRef.current) {
    setGenerateError(null)
    setIsGenerating(true)
  }

  try {
    const sourceText = buildReportGenerationSourceText({
      data,
      selectedTemplate,
      selectedCoacheeName: selectedCoachee?.name ?? '',
      selectedTrajectory: {
        id: selectedTrajectory?.id ?? null,
        name: selectedTrajectory?.name ?? '',
        dienstType: selectedTrajectory?.dienstType ?? '',
        startDate: selectedTrajectory?.startDate ?? '',
        orderNumber: selectedTrajectory?.orderNumber ?? '',
        planVanAanpakDocumentId: selectedTrajectory?.planVanAanpak?.documentId ?? null,
      },
      selectedSessionIds,
      selectedRapportageIds,
      selectedNoteIds,
    })

    const generatedReport = await generateReportText({
      selectedTemplate,
      sourceText,
      fallbackReportText: buildFallbackReportFromTemplate(selectedTemplate),
    })

    if (isMountedRef.current) setGeneratedReportText(generatedReport)
    setWrittenReport(sessionId, generatedReport)
    updateSession(sessionId, { summary: generatedReport, summaryStructured: null, transcriptionStatus: 'done', transcriptionError: null })
    if (isMountedRef.current) {
      shouldAnimateReadyRevealRef.current = true
      setViewMode('edit')
    }
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error || '').trim()
    if (isMountedRef.current) setGenerateError(message || 'Er is een fout opgetreden bij het genereren van de rapportage.')
    updateSession(sessionId, { transcriptionStatus: 'error', transcriptionError: message || 'Genereren mislukt' })
  } finally {
    if (isMountedRef.current) setIsGenerating(false)
  }
}

export async function runSendAssistantMessage(params: {
  assistantMessage: string
  isAssistantSending: boolean
  assistantMessages: Array<{ id: string; role: 'user' | 'assistant'; text: string }>
  createMessageId: () => string
  setAssistantMessages: (updater: (previous: Array<{ id: string; role: 'user' | 'assistant'; text: string }>) => Array<{ id: string; role: 'user' | 'assistant'; text: string }>) => void
  setAssistantMessage: (value: string) => void
  setIsAssistantSending: (value: boolean) => void
  groupedFields: UwvFieldGroup[]
  fieldValues: Record<string, string>
}) {
  const {
    assistantMessage,
    isAssistantSending,
    assistantMessages,
    createMessageId,
    setAssistantMessages,
    setAssistantMessage,
    setIsAssistantSending,
    groupedFields,
    fieldValues,
  } = params

  const trimmed = assistantMessage.trim()
  if (!trimmed || isAssistantSending) return
  const nextUserMessage = { id: createMessageId(), role: 'user' as const, text: trimmed }
  const nextChatMessages = [...assistantMessages, nextUserMessage]
  setAssistantMessages((previous) => [...previous, nextUserMessage])
  setAssistantMessage('')
  setIsAssistantSending(true)
  try {
    const reportContext = buildAssistantReportContext({
      groupedFields,
      fieldValues,
      normalizeFieldValueForStorage,
    })
    const responseText = await sendReportAssistantMessage({
      chatMessages: nextChatMessages,
      reportContext,
    })
    setAssistantMessages((previous) => [...previous, { id: createMessageId(), role: 'assistant', text: responseText }])
  } catch {
    setAssistantMessages((previous) => [
      ...previous,
      { id: createMessageId(), role: 'assistant', text: 'Er ging iets mis bij het ophalen van het antwoord. Probeer het opnieuw.' },
    ])
  } finally {
    setIsAssistantSending(false)
  }
}



