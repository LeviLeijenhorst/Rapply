
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { ChatMessage } from '../session/components/ChatMessage'
import { ChatComposer } from '../session/components/ChatComposer'
import { Text } from '../../ui/Text'
import {
  buildAssistantReportContext,
  buildRapportageGenerationSourceText,
  exportRapportageWord,
  generateRapportageText,
  sendRapportageAssistantMessage,
} from '../../hooks/reports/newRapportage/newRapportageWorkflows'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import type { Template } from '../../storage/types'
import { normalizeSummaryTemplate } from '../../api/summary'
import { features } from '../../config/features'
import { colors } from '../../design/theme/colors'
import { useToast } from '../../toast/ToastProvider'
import { createChatMessageId, type ChatStateMessage } from '../../types/chatState'
import { parseReportSections } from '../../types/reportStructure'
import { isSessionNotesArtifact, isSessionPrimaryInputArtifact, isSessionReportArtifact } from '../../types/sessionArtifacts'

type InputTabKey = 'sessies' | 'rapportages' | 'notities'
type ViewMode = 'setup' | 'edit'
type RapportagePageMode = 'controleren' | 'bewerken'

type Props = {
  initialCoacheeId?: string | null
  initialSessionId?: string | null
  mode?: RapportagePageMode
}

type InputRow = {
  id: string
  title: string
  dateLabel: string
  createdAtUnixMs: number
}

type MetadataKind = 'none' | 'name' | 'initials' | 'surname' | 'order' | 'bsn' | 'email' | 'phone' | 'months'
type FieldType = 'text' | 'multichoice'

type UwvField = {
  key: string
  rawLabel: string
  label: string
  numberPrefix: string
  metadataKind: MetadataKind
  singleLine: boolean
  type: FieldType
  options?: string[]
}

type UwvFieldGroup = {
  key: string
  title: string
  fields: UwvField[]
}

type ActivityAllocationRow = {
  id: string
  activity: string
  hours: string
}

const MULTILINE_BASE_HEIGHT = 48

function normalizeMatchValue(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function formatDateLabel(createdAtUnixMs: number): string {
  return new Date(createdAtUnixMs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function extractNumberPrefix(rawTitle: string): string {
  const match = String(rawTitle || '').trim().match(/^(\d{1,2})(?:[._]\d+)?\b/)
  return match ? String(match[1]) : '0'
}

function cleanLabel(raw: string): string {
  return String(raw || '').replace(/^\d{1,2}(?:[._]\d+)?\s*/, '').trim()
}

function capitalizeFirstLetter(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function capitalizeFirstLetterLowerRest(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function formatInitials(value: string): string {
  const letters = String(value || '').replace(/[^a-zA-Z]/g, '').toUpperCase().split('')
  return letters.length === 0 ? '' : `${letters.join('.')}.`
}

function sanitizeInitialsOnChange(previousValue: string, nextValue: string): string {
  const previous = String(previousValue || '')
  const next = String(nextValue || '')
  const previousLetters = previous.replace(/[^a-zA-Z]/g, '').toUpperCase()
  const nextLetters = next.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (next.length < previous.length && nextLetters.length === previousLetters.length && previousLetters.length > 0) {
    return formatInitials(previousLetters.slice(0, -1))
  }
  return formatInitials(nextLetters)
}

function normalizeYesNo(value: string): 'ja' | 'nee' | '' {
  const normalized = normalizeMatchValue(value)
  if (normalized === 'ja') return 'ja'
  if (normalized === 'nee') return 'nee'
  return ''
}

function sanitizeCurrencyInput(value: string): string {
  const replaced = String(value || '').replace(/\./g, ',')
  const cleaned = replaced.replace(/[^0-9,]/g, '')
  const [whole, ...fractionParts] = cleaned.split(',')
  if (fractionParts.length === 0) return whole
  return `${whole},${fractionParts.join('')}`
}

function sanitizePhoneInput(value: string): string {
  const raw = String(value || '')
  let sanitized = raw.replace(/[^\d+]/g, '')
  const hasLeadingPlus = sanitized.startsWith('+')
  sanitized = sanitized.replace(/\+/g, '')
  return `${hasLeadingPlus ? '+' : ''}${sanitized}`
}

function parseStreetAndHouseNumber(addressLine: string): { street: string; houseNumber: string } {
  const normalized = String(addressLine || '').trim()
  if (!normalized) return { street: '', houseNumber: '' }
  const match = normalized.match(/^(.*?)(\d+[a-zA-Z0-9\-\/]*)$/)
  if (!match) return { street: normalized, houseNumber: '' }
  return { street: String(match[1] || '').trim().replace(/,\s*$/, ''), houseNumber: String(match[2] || '').trim() }
}

function parsePostalCodeAndCity(value: string): { postalCode: string; city: string } {
  const normalized = String(value || '').trim()
  if (!normalized) return { postalCode: '', city: '' }
  const match = normalized.match(/^([1-9][0-9]{3}\s?[A-Za-z]{2})[\s,]+(.+)$/)
  if (!match) return { postalCode: '', city: normalized }
  return { postalCode: String(match[1] || '').toUpperCase().replace(/\s+/g, ' ').trim(), city: String(match[2] || '').trim() }
}

function toPlaceholderKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function stripSectionNumberPrefix(value: string): string {
  return String(value || '')
    .replace(/^\s*\d{1,2}(?:[._-]\d+)?\s*/, '')
    .replace(/^\s*[-:.)]\s*/, '')
    .trim()
}

function extractNumberKeyFromHeading(title: string): string {
  const raw = String(title || '').trim()
  const directMatch = raw.match(/^(\d{1,2})\s*[._-]\s*([0-9a-z])\b/i)
  if (!directMatch) return ''
  return `${Number(directMatch[1])}.${String(directMatch[2]).toLowerCase()}`
}

function buildGeneratedFieldMap(reportText: string): { byNumberKey: Map<string, string>; byLabel: Map<string, string> } {
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

function replaceFieldLabel(field: UwvField): string {
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

function isMainActivityMultichoice(label: string): boolean {
  return normalizeMatchValue(label).includes('welke hoofdactiviteiten zijn in het werkplan of plan van aanpak benoemd')
}

function isSpecialistTariffQuestion(label: string): boolean {
  return normalizeMatchValue(label).includes('is er sprake van specialistisch uurtarief')
}

function isActivityHoursDistribution(label: string): boolean {
  return normalizeMatchValue(label).includes('hoe verdeelt u de begeleidingsuren over de re integratieactiviteiten')
}

function isSpecialistExpertiseDetail(label: string): boolean {
  return normalizeMatchValue(label).includes('motiveer welke specialistische expertise voor de client nodig is en hoeveel uren u adviseert')
}

function isSpecialistTariffDetail(label: string): boolean {
  return normalizeMatchValue(label).includes('wat is het in rekening te brengen hogere uurtarief voor de specialistische expertise motiveer waarom dit tarief noodzakelijk is')
}

function splitCoacheeName(name: string): { initials: string; surname: string; full: string } {
  const cleaned = String(name || '').trim()
  if (!cleaned) return { initials: '', surname: '', full: '' }
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) return { initials: '', surname: capitalizeFirstLetterLowerRest(parts[0]), full: capitalizeFirstLetter(cleaned) }
  const surname = capitalizeFirstLetterLowerRest(parts[parts.length - 1])
  const initials = formatInitials(parts.slice(0, -1).map((part) => part.charAt(0)).join(''))
  return { initials, surname, full: capitalizeFirstLetter(cleaned) }
}

function extractBsn(value: string): string {
  const matches = String(value || '').match(/\b\d{8,9}\b/g) || []
  return matches.find((candidate) => candidate.length === 8 || candidate.length === 9) || ''
}

function getGroupTitle(templateName: string, numberPrefix: string): string {
  const normalizedTemplateName = normalizeMatchValue(templateName).replace(/\s+/g, '')
  if (normalizedTemplateName === 'reintegratieplanwerkfitmaken') {
    if (numberPrefix === '1') return 'Gegevens cli\u00ebnt'
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
    if (numberPrefix === '1') return 'Gegevens cli\u00ebnt'
    if (numberPrefix === '2') return 'Gegevens UWV'
    if (numberPrefix === '3') return 'Gegevens re-integratiebedrijf'
    if (numberPrefix === '4') return 'Ordernummer'
    if (numberPrefix === '5') return 'Beindiging dienstverlening'
    if (numberPrefix === '6') return 'Voortijdige terugmelding'
    if (numberPrefix === '7') return 'Resultaten traject'
    if (numberPrefix === '8') return 'Ervaring cli\u00ebnt'
    if (numberPrefix === '9' || numberPrefix === '10') return 'Ondertekening'
  }
  return `Onderdeel ${numberPrefix}`
}

function isWerkfitTemplate(template: Pick<Template, 'name'>): boolean {
  const normalized = normalizeMatchValue(template.name)
  if (!normalized.includes('werkfit')) return false
  if (normalized.includes('eindrapportage')) return false
  return normalized.includes('re integratieplan') || normalized.includes('reintegratieplan')
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

function detectMetadataKind(label: string, numberPrefix: string): MetadataKind {
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

function placeholderForField(field: UwvField): string {
  const normalized = normalizeMatchValue(field.label)
  if (field.metadataKind === 'initials') return 'Bijv. J.P.'
  if (field.metadataKind === 'surname') return 'Bijv. Jansen'
  if (field.metadataKind === 'bsn') return '8 of 9 cijfers'
  if (field.metadataKind === 'order') return 'Bijv. 123456'
  if (field.metadataKind === 'months') return 'Aantal maanden, bijv. 6'
  if (field.metadataKind === 'email') return 'Bijv. naam@organisatie.nl'
  if (field.metadataKind === 'phone') return 'Bijv. 0612345678'
  if (normalized.includes('postadres straatnaam') || normalized.includes('bezoekadres straatnaam')) return 'Bijv. Hoofdstraat'
  if (normalized.includes('postadres huisnummer') || normalized.includes('bezoekadres huisnummer')) return 'Bijv. 12A'
  if (normalized.includes('postadres postcode') || normalized.includes('bezoekadres postcode')) return 'Bijv. 1234 AB'
  if (normalized.includes('postadres plaats') || normalized.includes('bezoekadres plaats')) return 'Bijv. Utrecht'
  if (normalized.includes('bezoekadres')) return 'Bijv. Hoofdstraat 12'
  if (normalized.includes('postadres')) return 'Bijv. Postbus 123'
  if (normalized.includes('postcode en plaats')) return 'Bijv. 1234 AB Utrecht'
  if (normalized.includes('functie contactpersoon')) return 'Bijv. Re-integratiecoach'
  if (normalized.includes('naam organisatie')) return 'Bijv. Voorbeeld B.V.'
  if (field.metadataKind === 'name') return 'Bijv. Jan de Vries'
  return 'Typ uw antwoord'
}

function formatOnBlur(kind: MetadataKind, value: string): string {
  if (kind === 'initials') return formatInitials(value)
  if (kind === 'surname') return capitalizeFirstLetterLowerRest(value)
  if (kind === 'name') return capitalizeFirstLetter(value)
  if (kind === 'email') return String(value || '').trim().toLowerCase()
  if (kind === 'bsn') return String(value || '').replace(/\D/g, '').slice(0, 9)
  if (kind === 'months') return String(value || '').replace(/\D/g, '')
  if (kind === 'phone') return sanitizePhoneInput(value)
  return value
}

function sanitizeOnChange(kind: MetadataKind, value: string, previousValue = ''): string {
  if (kind === 'initials') return sanitizeInitialsOnChange(previousValue, value)
  if (kind === 'surname') return capitalizeFirstLetterLowerRest(value)
  if (kind === 'name') return capitalizeFirstLetter(value)
  if (kind === 'bsn') return String(value || '').replace(/\D/g, '').slice(0, 9)
  if (kind === 'months') return String(value || '').replace(/\D/g, '')
  if (kind === 'phone') return sanitizePhoneInput(value)
  return value
}

function normalizeFieldValueForStorage(field: Pick<UwvField, 'metadataKind'>, value: string): string {
  const raw = String(value || '')
  if (field.metadataKind === 'months') return raw.replace(/\D/g, '')
  return raw
}

function buildFieldsFromTemplate(template: Template | null): UwvField[] {
  if (!template?.name) return []
  const normalizedTemplateName = normalizeMatchValue(template.name).replace(/\s+/g, '')
  const normalizedTemplate = normalizeSummaryTemplate({ name: template.name, sections: [] })
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
      label = 'Naam cli\u00ebnt'
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

    const fieldType: FieldType = isMainActivityMultichoice(label) || isSpecialistTariffQuestion(label) ? 'multichoice' : 'text'

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

function SessiesIcon() {
  return (
    <View style={styles.sessiesIconWrap}>
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M13.8523 12.6225L14.1448 14.9925C14.2198 15.615 13.5523 16.05 13.0198 15.7275L10.4248 14.1825C10.2448 14.0775 10.1998 13.8525 10.2973 13.6725C10.6723 12.9825 10.8748 12.2025 10.8748 11.4225C10.8748 8.6775 8.5198 6.4425 5.6248 6.4425C5.0323 6.4425 4.4548 6.5325 3.9148 6.7125C3.6373 6.8025 3.3673 6.5475 3.4348 6.2625C4.1173 3.5325 6.7423 1.5 9.8773 1.5C13.5373 1.5 16.4998 4.2675 16.4998 7.68C16.4998 9.705 15.4573 11.4975 13.8523 12.6225Z" fill="#BE0165"/>
        <Path d="M9.75 11.4224C9.75 12.3149 9.42 13.1399 8.865 13.7924C8.1225 14.6924 6.945 15.2699 5.625 15.2699L3.6675 16.4324C3.3375 16.6349 2.9175 16.3574 2.9625 15.9749L3.15 14.4974C2.145 13.7999 1.5 12.6824 1.5 11.4224C1.5 10.1024 2.205 8.93988 3.285 8.24988C3.9525 7.81488 4.755 7.56738 5.625 7.56738C7.905 7.56738 9.75 9.29238 9.75 11.4224Z" fill="#BE0165"/>
      </Svg>
    </View>
  )
}

function CheckIcon() {
  return (
    <Svg width={11} height={8} viewBox="0 0 11 8" fill="none">
      <Path d="M0.999983 3.52165L3.87816 6.68687L9.19104 1.00002" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

function PlusIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 1V13M1 7H13" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  )
}

function CloseIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
      <Path d="M1 1L9 9M9 1L1 9" stroke="#667085" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function UwvLogoIcon() {
  return (
    <Svg width={28} height={24} viewBox="0 0 75 63.3" fill="none">
      <Path fill="#0078D2" d="m75 16.9c0-3.3-1.1-6.4-2.9-9.1-8-11.5-30-10.1-49.1 3.1s-28 33.2-20 44.7 29.9 10 49-3c0.1-0.1 0-0.2-0.1-0.1-10.6 6.1-19.9 6.1-24 0s0.2-16.4 9.2-22.3c3.1-2.1 6.5-3.6 10.2-4.4l-1.2 6c-0.1 0.2 0 0.5 0.2 0.6s0.5 0.1 0.7 0l18.5-10.1c0.2-0.1 0.4-0.3 0.4-0.6 0.1-0.2 0-0.5-0.2-0.6l-14.5-9.9c-0.2-0.2-0.5-0.2-0.7-0.1s-0.4 0.3-0.4 0.6l-0.9 4.5c-6.3 0.6-12.2 2.8-17.3 6.4-12.4 8.3-17.9 21.7-12.3 30 1.5 2.2 3.7 3.8 6.1 4.8l0.4 0.1v0.1c-4.2-0.6-8-2.8-10.4-6.3-6.9-9.9 0.3-26.8 16-37.6s34-11.6 40.9-1.7c1.1 1.5 1.8 3.1 2.2 4.9v0.1c0 0.1 0.2 0.1 0.2-0.1" />
      <Path fill="#0078D2" d="m40.6 49.4v-1c-0.7 1.2-2 1.9-3.3 1.8-1.4 0-3.1-0.9-3.1-4.2v-6.7l2.3-0.4v7c-0.1 0.7 0.1 1.4 0.6 1.9 0.9 0.8 2.5 0.3 3.5-1.5v-7.1l2.3-0.4v11.2h-1.6c-0.5 0-0.8-0.2-0.7-0.6-0.1 0-0.1 0 0 0" />
      <Path fill="#0078D2" d="M65.6,46.9l2.6-7.9h2.3l-3.9,10.9V50h-1.8c-0.3,0-0.5-0.2-0.6-0.4L60.5,39h2.5L65.6,46.9z" />
      <Path fill="#0078D2" d="M51.9,42l-2.5,8h-1.8c-0.3,0-0.5-0.2-0.6-0.4L44,39h2.5l2,7.6l2.4-7.6h2.2l2.4,7.6l2-7.6h2.3l-3.1,11H55c-0.2,0-0.5-0.1-0.6-0.3L51.9,42z" />
    </Svg>
  )
}

function buildFallbackReportFromTemplate(template: Template): string {
  if (!Array.isArray(template.sections) || template.sections.length === 0) return ''
  return template.sections
    .map((section) => `### ${String(section.title || '').trim() || 'Onderdeel'}\n${String(section.description || '').trim() || '-'}`)
    .join('\n\n')
    .trim()
}

function buildTemplatePromptText(template: Template | null): string {
  if (!template) return ''
  const sections = Array.isArray(template.sections) ? template.sections : []
  const sectionLines = sections
    .map((section, index) => {
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

export function NewReportScreen({ initialCoacheeId = null, initialSessionId = null, mode = 'controleren' }: Props) {
  const { data, createSession, setWrittenReport, updateSession } = useLocalAppData()
  const { showErrorToast, showToast } = useToast()
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const isMountedRef = useRef(true)

  const initialSessionReportText = useMemo(
    () => (initialSessionId ? data.writtenReports.find((item) => item.sessionId === initialSessionId)?.text ?? '' : ''),
    [data.writtenReports, initialSessionId],
  )
  const [viewMode, setViewMode] = useState<ViewMode>(initialSessionId ? 'edit' : 'setup')
  const [activeTab, setActiveTab] = useState<InputTabKey>('sessies')
  const [assistantMessage, setAssistantMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatedReportText, setGeneratedReportText] = useState(initialSessionReportText)

  const activeCoachees = useMemo(() => data.coachees.filter((item) => !item.isArchived), [data.coachees])
  const selectedCoachee = useMemo(() => {
    if (initialCoacheeId) {
      const byId = activeCoachees.find((item) => item.id === initialCoacheeId) ?? null
      if (byId) return byId
    }
    return activeCoachees[0] ?? null
  }, [activeCoachees, initialCoacheeId])
  const selectedTrajectory = useMemo(() => {
    if (!selectedCoachee) return null
    return data.trajectories.find((item) => item.coacheeId === selectedCoachee.id) ?? null
  }, [data.trajectories, selectedCoachee])

  const sessionRows = useMemo<InputRow[]>(() => {
    if (!selectedCoachee) return []
    // Session is a shared artifact container; for this tab we only include primary input artifacts.
    return data.sessions
      .filter((session) => session.coacheeId === selectedCoachee.id && isSessionPrimaryInputArtifact(session))
      .map((session) => ({ id: session.id, title: String(session.title || '').trim() || 'Sessie', dateLabel: formatDateLabel(session.createdAtUnixMs), createdAtUnixMs: session.createdAtUnixMs }))
      .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.sessions, selectedCoachee])

  const rapportageRows = useMemo<InputRow[]>(() => {
    if (!selectedCoachee) return []
    return data.sessions
      .filter((session) => session.coacheeId === selectedCoachee.id && isSessionReportArtifact(session))
      .map((session) => ({ id: session.id, title: String(session.title || '').trim() || 'Rapportage', dateLabel: formatDateLabel(session.createdAtUnixMs), createdAtUnixMs: session.createdAtUnixMs }))
      .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.sessions, selectedCoachee])

  const noteRows = useMemo<InputRow[]>(() => {
    if (!selectedCoachee) return []
    const notesSessionIds = new Set(
      data.sessions
        .filter((session) => session.coacheeId === selectedCoachee.id && isSessionNotesArtifact(session))
        .map((session) => session.id),
    )
    if (notesSessionIds.size === 0) return []
    return data.notes
      .filter((note) => notesSessionIds.has(note.sessionId))
      .map((note) => ({
        id: note.id,
        title: String(note.title || '').trim() || String(note.text || '').trim().split('\n')[0] || 'Notitie',
        dateLabel: formatDateLabel(note.updatedAtUnixMs),
        createdAtUnixMs: note.updatedAtUnixMs,
      }))
      .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.notes, data.sessions, selectedCoachee])

  const werkfitTemplates = useMemo(() => data.templates.filter((template) => isWerkfitTemplate(template)).slice(0, 2), [data.templates])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [selectedRapportageIds, setSelectedRapportageIds] = useState<string[]>([])
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [activityAllocationRows, setActivityAllocationRows] = useState<ActivityAllocationRow[]>([{ id: 'row-1', activity: '', hours: '' }])
  const [specialistExpertiseByField, setSpecialistExpertiseByField] = useState<Record<string, { hours: string; motivation: string }>>({})
  const [specialistTariffByField, setSpecialistTariffByField] = useState<Record<string, { hourlyRate: string; motivation: string }>>({})
  const [inputHeights, setInputHeights] = useState<Record<string, number>>({})
  const [assistantMessages, setAssistantMessages] = useState<ChatStateMessage[]>([])
  const [isAssistantSending, setIsAssistantSending] = useState(false)
  const assistantScrollRef = useRef<ScrollView | null>(null)
  const readyRevealOpacity = useRef(new Animated.Value(1)).current
  const readyRevealTranslateY = useRef(new Animated.Value(0)).current
  const shouldAnimateReadyRevealRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (werkfitTemplates.length === 0) {
      setSelectedTemplateId(null)
      return
    }
    setSelectedTemplateId((current) => (current && werkfitTemplates.some((template) => template.id === current) ? current : null))
  }, [werkfitTemplates])

  useEffect(() => {
    if (!initialSessionId) return
    setViewMode('edit')
    setGeneratedReportText(initialSessionReportText)
  }, [initialSessionId, initialSessionReportText])

  useEffect(() => {
    if (!initialSessionId || werkfitTemplates.length === 0) return
    const initialSession = data.sessions.find((item) => item.id === initialSessionId) ?? null
    if (!initialSession) return
    const normalizedSessionTitle = normalizeMatchValue(String(initialSession.title || ''))
    const matchedTemplate = werkfitTemplates.find((template) => normalizeMatchValue(template.name) === normalizedSessionTitle)
    if (!matchedTemplate) return
    setSelectedTemplateId(matchedTemplate.id)
  }, [data.sessions, initialSessionId, werkfitTemplates])

  useEffect(() => {
    setSelectedSessionIds((current) => {
      if (current.length === 0) return sessionRows.map((item) => item.id)
      const validIds = new Set(sessionRows.map((item) => item.id))
      const next = current.filter((id) => validIds.has(id))
      return next.length === 0 ? sessionRows.map((item) => item.id) : next
    })
  }, [sessionRows])

  useEffect(() => {
    setSelectedRapportageIds((current) => {
      if (current.length === 0) return rapportageRows.map((item) => item.id)
      const validIds = new Set(rapportageRows.map((item) => item.id))
      const next = current.filter((id) => validIds.has(id))
      return next.length === 0 ? rapportageRows.map((item) => item.id) : next
    })
  }, [rapportageRows])

  useEffect(() => {
    setSelectedNoteIds((current) => {
      if (current.length === 0) return noteRows.map((item) => item.id)
      const validIds = new Set(noteRows.map((item) => item.id))
      const next = current.filter((id) => validIds.has(id))
      return next.length === 0 ? noteRows.map((item) => item.id) : next
    })
  }, [noteRows])

  const selectedTemplate = useMemo(() => werkfitTemplates.find((template) => template.id === selectedTemplateId) ?? null, [selectedTemplateId, werkfitTemplates])
  const uwvFields = useMemo(() => buildFieldsFromTemplate(selectedTemplate), [selectedTemplate])

  const groupedFields = useMemo<UwvFieldGroup[]>(() => {
    if (!selectedTemplate?.name || uwvFields.length === 0) return []
    const groupMap = new Map<string, UwvFieldGroup>()
    for (const field of uwvFields) {
      const group = groupMap.get(field.numberPrefix)
      if (group) group.fields.push(field)
      else groupMap.set(field.numberPrefix, { key: field.numberPrefix, title: getGroupTitle(selectedTemplate.name, field.numberPrefix), fields: [field] })
    }
    return Array.from(groupMap.values()).sort((a, b) => Number(a.key) - Number(b.key))
  }, [selectedTemplate?.name, uwvFields])

  const specialistTariffAnswerByGroup = useMemo(() => {
    const answerByGroup = new Map<string, 'ja' | 'nee' | ''>()
    for (const group of groupedFields) {
      const tariffField = group.fields.find((field) => isSpecialistTariffQuestion(field.label))
      if (!tariffField) continue
      answerByGroup.set(group.key, normalizeYesNo(fieldValues[tariffField.key] || ''))
    }
    return answerByGroup
  }, [fieldValues, groupedFields])

  useEffect(() => {
    const { initials, surname, full } = splitCoacheeName(String(selectedCoachee?.name || '').trim())
    const bsn = extractBsn(String(selectedCoachee?.clientDetails || ''))
    const parsedVisitAddress = parseStreetAndHouseNumber(String(data.practiceSettings.visitAddress || ''))
    const parsedPostalAddress = parseStreetAndHouseNumber(String(data.practiceSettings.postalAddress || ''))
    const parsedPostalCodeCity = parsePostalCodeAndCity(String(data.practiceSettings.postalCodeCity || ''))

    const defaults = {
      uwvName: capitalizeFirstLetter(String(selectedTrajectory?.uwvContactName || '').trim()),
      orderNumber: String(selectedTrajectory?.orderNumber || '').trim(),
      practiceName: capitalizeFirstLetter(String(data.practiceSettings.practiceName || '').trim()),
      visitAddress: capitalizeFirstLetter(String(data.practiceSettings.visitAddress || '').trim()),
      postalAddress: capitalizeFirstLetter(String(data.practiceSettings.postalAddress || '').trim()),
      postalCodeCity: capitalizeFirstLetter(String(data.practiceSettings.postalCodeCity || '').trim()),
      contactName: capitalizeFirstLetter(String(data.practiceSettings.contactName || '').trim()),
      contactRole: capitalizeFirstLetter(String(data.practiceSettings.contactRole || '').trim()),
      contactPhone: sanitizePhoneInput(String(data.practiceSettings.contactPhone || '').trim()),
      contactEmail: String(data.practiceSettings.contactEmail || '').trim().toLowerCase(),
      postStreet: capitalizeFirstLetter(parsedPostalAddress.street),
      postHouseNumber: parsedPostalAddress.houseNumber,
      postPostcode: parsedPostalCodeCity.postalCode,
      postCity: capitalizeFirstLetter(parsedPostalCodeCity.city),
      visitStreet: capitalizeFirstLetter(parsedVisitAddress.street),
      visitHouseNumber: parsedVisitAddress.houseNumber,
      visitPostcode: parsedPostalCodeCity.postalCode,
      visitCity: capitalizeFirstLetter(parsedPostalCodeCity.city),
    }

    setFieldValues((current) => {
      const next: Record<string, string> = {}
      for (const field of uwvFields) {
        if (current[field.key] !== undefined) {
          next[field.key] = normalizeFieldValueForStorage(field, current[field.key] || '')
          continue
        }
        const normalizedLabel = normalizeMatchValue(field.label)
        let value = ''
        if (field.metadataKind === 'initials') value = initials
        else if (field.metadataKind === 'surname') value = surname
        else if (field.metadataKind === 'bsn') value = bsn
        else if (field.metadataKind === 'order') value = defaults.orderNumber
        else if (field.metadataKind === 'months') value = ''
        else if (field.metadataKind === 'phone') value = defaults.contactPhone
        else if (field.metadataKind === 'email') value = defaults.contactEmail
        else if (normalizedLabel.includes('naam contactpersoon uwv')) value = defaults.uwvName
        else if (normalizedLabel.includes('naam organisatie')) value = defaults.practiceName
        else if (normalizedLabel.includes('postadres straatnaam')) value = defaults.postStreet
        else if (normalizedLabel.includes('postadres huisnummer')) value = defaults.postHouseNumber
        else if (normalizedLabel.includes('postadres postcode')) value = defaults.postPostcode
        else if (normalizedLabel.includes('postadres plaats')) value = defaults.postCity
        else if (normalizedLabel.includes('bezoekadres straatnaam')) value = defaults.visitStreet
        else if (normalizedLabel.includes('bezoekadres huisnummer')) value = defaults.visitHouseNumber
        else if (normalizedLabel.includes('bezoekadres postcode')) value = defaults.visitPostcode
        else if (normalizedLabel.includes('bezoekadres plaats')) value = defaults.visitCity
        else if (normalizedLabel.includes('bezoekadres')) value = defaults.visitAddress
        else if (normalizedLabel.includes('postadres')) value = defaults.postalAddress
        else if (normalizedLabel.includes('postcode en plaats')) value = defaults.postalCodeCity
        else if (normalizedLabel.includes('naam contactpersoon re integratiebedrijf')) value = defaults.contactName
        else if (normalizedLabel.includes('naam contactpersoon')) value = defaults.contactName
        else if (normalizedLabel.includes('naam client') || normalizedLabel.includes('naam cli?nt')) value = full
        else if (normalizedLabel.includes('functie contactpersoon')) value = defaults.contactRole
        next[field.key] = value
      }
      const same = Object.keys(next).length === Object.keys(current).length && Object.keys(next).every((key) => next[key] === current[key])
      return same ? current : next
    })
  }, [data.practiceSettings, selectedCoachee?.clientDetails, selectedCoachee?.name, selectedTrajectory?.orderNumber, selectedTrajectory?.uwvContactName, uwvFields])

  useEffect(() => {
    setSpecialistExpertiseByField((current) => {
      const next = { ...current }
      for (const field of uwvFields) {
        if (!isSpecialistExpertiseDetail(field.label)) continue
        if (!next[field.key]) next[field.key] = { hours: '', motivation: '' }
      }
      return next
    })
    setSpecialistTariffByField((current) => {
      const next = { ...current }
      for (const field of uwvFields) {
        if (!isSpecialistTariffDetail(field.label)) continue
        if (!next[field.key]) next[field.key] = { hourlyRate: '', motivation: '' }
      }
      return next
    })
  }, [uwvFields])

  useEffect(() => {
    for (const field of uwvFields) {
      if (isSpecialistExpertiseDetail(field.label)) {
        const entry = specialistExpertiseByField[field.key] || { hours: '', motivation: '' }
        const serialized = `Aantal uren: ${entry.hours}\nMotivering: ${entry.motivation}`.trim()
        setFieldValues((current) => (current[field.key] === serialized ? current : { ...current, [field.key]: serialized }))
      }
      if (isSpecialistTariffDetail(field.label)) {
        const entry = specialistTariffByField[field.key] || { hourlyRate: '', motivation: '' }
        const serialized = `Uurtarief exclusief btw: € ${entry.hourlyRate}\nMotivering: ${entry.motivation}`.trim()
        setFieldValues((current) => (current[field.key] === serialized ? current : { ...current, [field.key]: serialized }))
      }
    }
  }, [specialistExpertiseByField, specialistTariffByField, uwvFields])

  useEffect(() => {
    const nextCount = assistantMessages.length
    if (nextCount === 0) return
    const scrollView = assistantScrollRef.current
    if (!scrollView) return
    setTimeout(() => scrollView.scrollToEnd({ animated: true }), 0)
  }, [assistantMessages.length, isAssistantSending])

  useEffect(() => {
    const generatedText = String(generatedReportText || '').trim()
    if (!generatedText || uwvFields.length === 0) return
    const generatedMap = buildGeneratedFieldMap(generatedText)
    setFieldValues((current) => {
      let hasChanges = false
      const next = { ...current }
      for (const field of uwvFields) {
        if (String(next[field.key] || '').trim()) continue
        const rawMatch = String(field.rawLabel || '').trim().match(/^(\d{1,2})(?:[._]([0-9a-z]+))?/i)
        const numberKey = rawMatch ? `${Number(rawMatch[1])}.${String(rawMatch[2] || '').toLowerCase()}` : ''
        const candidateByNumber = numberKey ? generatedMap.byNumberKey.get(numberKey) : ''
        const candidateByLabel = generatedMap.byLabel.get(normalizeMatchValue(field.label))
        const nextValue = normalizeFieldValueForStorage(field, String(candidateByNumber || candidateByLabel || '').trim())
        if (!nextValue) continue
        next[field.key] = nextValue
        hasChanges = true
      }
      return hasChanges ? next : current
    })
  }, [generatedReportText, uwvFields])

  const activeRows = activeTab === 'sessies' ? sessionRows : activeTab === 'rapportages' ? rapportageRows : noteRows
  const activeSelectedIds =
    activeTab === 'sessies'
      ? selectedSessionIds
      : activeTab === 'rapportages'
        ? selectedRapportageIds
        : selectedNoteIds
  const activeSelectedSet = useMemo(() => new Set(activeSelectedIds), [activeSelectedIds])
  const areAllActiveRowsSelected = activeRows.length > 0 && activeRows.every((item) => activeSelectedSet.has(item.id))

  const canStartGeneration = Boolean(selectedTemplate)
  const setGrowHeight = (key: string, nextHeight: number, baseHeight: number) => {
    const target = Math.max(baseHeight, Math.ceil(nextHeight))
    setInputHeights((current) => (current[key] === target ? current : { ...current, [key]: target }))
  }
  const autoSizeWebTextarea = (heightKey: string, baseHeight: number, event?: any, nativeId?: string) => {
    if (typeof document === 'undefined') return
    let textarea: HTMLTextAreaElement | null = null
    const eventTarget = event?.nativeEvent?.target
    if (eventTarget instanceof HTMLTextAreaElement) textarea = eventTarget
    if (!textarea && nativeId) {
      const node = document.getElementById(nativeId)
      if (node instanceof HTMLTextAreaElement) textarea = node
    }
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.overflowY = 'hidden'
    const nextHeight = Math.max(baseHeight, Math.ceil(textarea.scrollHeight))
    textarea.style.height = `${nextHeight}px`
    setGrowHeight(heightKey, nextHeight, baseHeight)
  }
  const handleMultilineContentSizeChange = (heightKey: string, baseHeight: number, event: any, nativeId?: string) => {
    setGrowHeight(heightKey, event?.nativeEvent?.contentSize?.height ?? baseHeight, baseHeight)
    autoSizeWebTextarea(heightKey, baseHeight, event, nativeId)
  }

  const toggleItemSelection = (id: string) => {
    if (activeTab === 'sessies') setSelectedSessionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    else if (activeTab === 'rapportages') setSelectedRapportageIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    else setSelectedNoteIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const toggleSelectAllForActiveTab = () => {
    if (activeTab === 'sessies') setSelectedSessionIds(areAllActiveRowsSelected ? [] : sessionRows.map((item) => item.id))
    else if (activeTab === 'rapportages') setSelectedRapportageIds(areAllActiveRowsSelected ? [] : rapportageRows.map((item) => item.id))
    else setSelectedNoteIds(areAllActiveRowsSelected ? [] : noteRows.map((item) => item.id))
  }

  useEffect(() => {
    if (viewMode !== 'edit' || typeof document === 'undefined') return
    const nextFrame = requestAnimationFrame(() => {
      for (const field of uwvFields) {
        if (field.singleLine) continue
        autoSizeWebTextarea(field.key, MULTILINE_BASE_HEIGHT, undefined, `new-report-field-${field.key}`)
        if (isSpecialistExpertiseDetail(field.label)) {
          autoSizeWebTextarea(`specialist-expertise-${field.key}`, MULTILINE_BASE_HEIGHT, undefined, `new-report-specialist-expertise-${field.key}`)
        }
        if (isSpecialistTariffDetail(field.label)) {
          autoSizeWebTextarea(`specialist-tariff-${field.key}`, MULTILINE_BASE_HEIGHT, undefined, `new-report-specialist-tariff-${field.key}`)
        }
      }
    })
    return () => cancelAnimationFrame(nextFrame)
  }, [fieldValues, specialistExpertiseByField, specialistTariffByField, uwvFields, viewMode])

  useEffect(() => {
    if (viewMode !== 'edit' || !shouldAnimateReadyRevealRef.current) {
      readyRevealOpacity.setValue(1)
      readyRevealTranslateY.setValue(0)
      return
    }

    shouldAnimateReadyRevealRef.current = false
    readyRevealOpacity.setValue(0)
    readyRevealTranslateY.setValue(6)
    Animated.parallel([
      Animated.timing(readyRevealOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(readyRevealTranslateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start()
  }, [readyRevealOpacity, readyRevealTranslateY, viewMode])

  const isFieldValid = (field: UwvField, value: string): boolean => {
    const trimmed = String(value || '').trim()
    if (!trimmed) return false
    if (field.metadataKind === 'bsn') return /^\d{8,9}$/.test(trimmed)
    if (field.metadataKind === 'months') return /^\d+$/.test(trimmed)
    if (field.metadataKind === 'phone') return /^\+?\d+$/.test(trimmed)
    if (field.type === 'multichoice') return trimmed.length > 0
    return true
  }

  const getGroupStatus = (group: UwvFieldGroup): 'complete' | 'incomplete' => {
    const specialistAnswer = specialistTariffAnswerByGroup.get(group.key)
    const visibleFields = group.fields.filter((field) => {
      if ((isSpecialistExpertiseDetail(field.label) || isSpecialistTariffDetail(field.label)) && specialistAnswer === 'nee') return false
      return true
    })
    const validCount = visibleFields.filter((field) => isFieldValid(field, fieldValues[field.key] || '')).length
    return validCount === visibleFields.length && visibleFields.length > 0 ? 'complete' : 'incomplete'
  }

  async function handleGenerateFromSetup() {
    if (!selectedTemplate || isGenerating) return
    const sessionId = createSession({ coacheeId: selectedCoachee?.id ?? null, trajectoryId: selectedTrajectory?.id ?? null, title: selectedTemplate.name.trim() || 'Rapportage', kind: 'written', audioBlobId: null, audioDurationSeconds: null, uploadFileName: null, transcriptionStatus: 'generating', transcriptionError: null })
    if (!sessionId) return

    if (isMountedRef.current) {
      setGenerateError(null)
      setIsGenerating(true)
    }

    try {
      const sourceText = buildRapportageGenerationSourceText({
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

      const generatedReport = await generateRapportageText({
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

  const updateMultichoiceValue = (field: UwvField, option: string) => {
    const currentValue = String(fieldValues[field.key] || '')
    const currentItems = currentValue.split(',').map((item) => item.trim()).filter(Boolean)
    const has = currentItems.includes(option)
    const nextItems = isSpecialistTariffQuestion(field.label)
      ? (has ? [] : [option])
      : (has ? currentItems.filter((item) => item !== option) : [...currentItems, option])
    setFieldValues((current) => ({ ...current, [field.key]: nextItems.join(', ') }))
  }

  const addActivityAllocationRow = () => {
    setActivityAllocationRows((current) => [...current, { id: `row-${Date.now()}-${current.length + 1}`, activity: '', hours: '' }])
  }

  const removeActivityAllocationRow = (id: string) => {
    setActivityAllocationRows((current) => {
      if (current.length <= 1) return current
      return current.filter((row) => row.id !== id)
    })
  }

  const updateActivityAllocationRow = (id: string, patch: Partial<Pick<ActivityAllocationRow, 'activity' | 'hours'>>) => {
    setActivityAllocationRows((current) => {
      const next = current.map((row) => row.id === id ? {
        ...row,
        ...(patch.activity !== undefined ? { activity: patch.activity } : {}),
        ...(patch.hours !== undefined ? { hours: patch.hours.replace(/\D/g, '') } : {}),
      } : row)
      return next
    })
  }

  useEffect(() => {
    const joined = activityAllocationRows
      .map((row) => ({ activity: String(row.activity || '').trim(), hours: String(row.hours || '').trim() }))
      .filter((row) => row.activity.length > 0 || row.hours.length > 0)
      .map((row) => `${row.activity} (${row.hours} uur)`)
      .join('; ')
    const activityField = uwvFields.find((field) => isActivityHoursDistribution(field.label))
    if (!activityField) return
    setFieldValues((current) => (current[activityField.key] === joined ? current : { ...current, [activityField.key]: joined }))
  }, [activityAllocationRows, uwvFields])

  const handleExportWord = async () => {
    try {
      if (!selectedTemplate) {
        showErrorToast('Selecteer eerst een rapporttemplate.')
        return
      }
      const defaultReportText = groupedFields
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
      const reportText = String(generatedReportText || defaultReportText || '').trim()
      const contextValues: Record<string, string> = {}
      for (const field of uwvFields) {
        const value = normalizeFieldValueForStorage(field, String(fieldValues[field.key] || '').trim())
        if (!value) continue
        const normalizedLabel = normalizeMatchValue(field.label)
        contextValues[toPlaceholderKey(field.label)] = value
        contextValues[toPlaceholderKey(field.rawLabel)] = value
        const rawMatch = String(field.rawLabel || '').trim().match(/^(\d{1,2})(?:[._]([0-9a-z]+))?/)
        if (rawMatch) {
          const main = String(rawMatch[1] || '')
          const sub = String(rawMatch[2] || '')
          if (main && sub) {
            const numberKey = `${main}_${sub}`
            if (normalizedLabel.includes('voorletters')) contextValues[`${numberKey}_voorletters`] = value
            if (normalizedLabel.includes('achternaam')) contextValues[`${numberKey}_achternaam`] = value
            if (!normalizedLabel.includes('voorletters') && !normalizedLabel.includes('achternaam')) {
              contextValues[numberKey] = value
            }
            contextValues[`${main}.${sub}`] = value
          }
        }
        if (isSpecialistExpertiseDetail(field.label)) {
          const entry = specialistExpertiseByField[field.key]
          if (entry) {
            contextValues['8_2_aantal_uren'] = String(entry.hours || '').trim()
            contextValues['8_2_motivering'] = String(entry.motivation || '').trim()
          }
        }
      }
      const initialsField = uwvFields.find((field) => normalizeMatchValue(field.label).includes('voorletters'))
      const surnameField = uwvFields.find((field) => normalizeMatchValue(field.label).includes('achternaam'))
      const initialsValue = initialsField ? String(fieldValues[initialsField.key] || '').trim() : ''
      const surnameValue = surnameField ? String(fieldValues[surnameField.key] || '').trim() : ''
      const fullNameValue = [initialsValue, surnameValue].filter(Boolean).join(' ').trim()
      if (fullNameValue) contextValues.voorletters_en_achternaam = fullNameValue
      const visitAddressParsed = parseStreetAndHouseNumber(String(data.practiceSettings.visitAddress || '').trim())
      const visitPostalCodeCityParsed = parsePostalCodeAndCity(String(data.practiceSettings.postalCodeCity || '').trim())
      const exportContextValues: Record<string, string> = { ...contextValues, report_text: reportText }
      const setDefaultContextValue = (key: string, value: string) => {
        if (!value) return
        if (String(exportContextValues[key] || '').trim()) return
        exportContextValues[key] = value
      }
      setDefaultContextValue('naam_organisatie', String(data.practiceSettings.practiceName || '').trim())
      setDefaultContextValue('bezoekadres', String(data.practiceSettings.visitAddress || '').trim())
      setDefaultContextValue('bezoekadres_straatnaam', visitAddressParsed.street)
      setDefaultContextValue('bezoekadres_huisnummer', visitAddressParsed.houseNumber)
      setDefaultContextValue('bezoekadres_postcode', visitPostalCodeCityParsed.postalCode)
      setDefaultContextValue('bezoekadres_plaats', visitPostalCodeCityParsed.city)
      setDefaultContextValue('postadres', String(data.practiceSettings.postalAddress || data.practiceSettings.visitAddress || '').trim())
      setDefaultContextValue('postcode_en_plaats', String(data.practiceSettings.postalCodeCity || '').trim())
      setDefaultContextValue('naam_contactpersoon', String(data.practiceSettings.contactName || '').trim())
      setDefaultContextValue('functie_contactpersoon', String(data.practiceSettings.contactRole || '').trim())
      setDefaultContextValue('telefoonnummer_contactpersoon', sanitizePhoneInput(String(data.practiceSettings.contactPhone || '').trim()))
      setDefaultContextValue('e_mailadres_contactpersoon', String(data.practiceSettings.contactEmail || '').trim().toLowerCase())
      const didExport = await exportRapportageWord({
        templateName: selectedTemplate.name,
        reportText,
        contextValues: exportContextValues,
      })
      if (!didExport) {
        showErrorToast('Geen UWV-formulier gekoppeld aan dit rapporttype.')
        return
      }
      showToast('UWV-document geëxporteerd.')
    } catch (error) {
      console.error('[NewRapportageScreen] UWV Word export failed', error)
      showErrorToast('Het UWV-formulier kon niet worden geëxporteerd.')
    }
  }
  async function handleSendAssistantMessage() {
    const trimmed = assistantMessage.trim()
    if (!trimmed || isAssistantSending) return
    const nextUserMessage: ChatStateMessage = { id: createChatMessageId(), role: 'user', text: trimmed }
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
      const responseText = await sendRapportageAssistantMessage({
        chatMessages: nextChatMessages,
        reportContext,
      })
      setAssistantMessages((previous) => [...previous, { id: createChatMessageId(), role: 'assistant', text: responseText }])
    } catch {
      setAssistantMessages((previous) => [
        ...previous,
        { id: createChatMessageId(), role: 'assistant', text: 'Er ging iets mis bij het ophalen van het antwoord. Probeer het opnieuw.' },
      ])
    } finally {
      setIsAssistantSending(false)
    }
  }

  if (viewMode === 'setup') {
    return (
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.screenScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.setupContainer}>
          <View style={styles.setupHeaderWrap}>
            <Text isSemibold style={styles.setupTitle}>Nieuwe rapportage</Text>
            <Text style={styles.setupSubtitle}>Selecteer sessies, kies een template en genereer de rapportage</Text>
          </View>
          <View style={styles.setupContentRow}>
            <View style={styles.setupLeftColumn}>
              <View style={styles.setupCard}>
                <View style={styles.setupSectionHeader}>
                  <View>
                    <Text isSemibold style={styles.setupSectionTitle}>Selecteer input</Text>
                    <Text style={styles.setupSectionSubtitle}>Kies welke gegevens in het rapport komen</Text>
                  </View>
                  <Pressable onPress={toggleSelectAllForActiveTab} style={({ hovered }) => [styles.selectAllButton, hovered ? styles.selectAllButtonHovered : undefined]}>
                    <Text style={styles.selectAllText}>{areAllActiveRowsSelected ? 'Alles deselecteren' : 'Alles selecteren'}</Text>
                    <View style={[styles.selectAllCheckbox, areAllActiveRowsSelected ? styles.selectAllCheckboxSelected : undefined]}>{areAllActiveRowsSelected ? <CheckIcon /> : null}</View>
                  </Pressable>
                </View>
                <View style={styles.tabRow}>
                  <Pressable onPress={() => setActiveTab('sessies')} style={({ hovered }) => [styles.tabButton, activeTab === 'sessies' ? styles.tabButtonActive : undefined, hovered ? styles.tabButtonHovered : undefined]}>
                    <SessiesIcon />
                    <Text isSemibold style={styles.tabText}>Sessies</Text>
                    <View style={styles.tabCountBadge}><Text style={styles.tabCountText}>{sessionRows.length} items</Text></View>
                  </Pressable>
                  {features.documentenTab ? (
                    <View style={[styles.tabButton, styles.tabButtonDisabled]}>
                      <Text isSemibold style={styles.tabText}>Documenten</Text>
                    </View>
                  ) : null}
                  <Pressable onPress={() => setActiveTab('rapportages')} style={({ hovered }) => [styles.tabButton, activeTab === 'rapportages' ? styles.tabButtonActive : undefined, hovered ? styles.tabButtonHovered : undefined]}>
                    <Text isSemibold style={styles.tabText}>Rapportages</Text>
                    <View style={styles.tabCountBadge}><Text style={styles.tabCountText}>{rapportageRows.length} items</Text></View>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab('notities')} style={({ hovered }) => [styles.tabButton, activeTab === 'notities' ? styles.tabButtonActive : undefined, hovered ? styles.tabButtonHovered : undefined]}>
                    <Text isSemibold style={styles.tabText}>Notities</Text>
                    <View style={styles.tabCountBadge}><Text style={styles.tabCountText}>{noteRows.length} items</Text></View>
                  </Pressable>
                </View>
                <ScrollView style={styles.inputList} contentContainerStyle={styles.inputListContent} showsVerticalScrollIndicator={false}>
                  {activeRows.map((row) => {
                    const isSelected = activeSelectedSet.has(row.id)
                    return (
                      <Pressable key={row.id} onPress={() => toggleItemSelection(row.id)} style={({ hovered }) => [styles.inputRow, hovered ? styles.inputRowHovered : undefined]}>
                        <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : undefined]}>{isSelected ? <CheckIcon /> : null}</View>
                        <View style={styles.inputMeta}><Text isSemibold style={styles.inputTitle}>{row.title}</Text><Text style={styles.inputDate}>{row.dateLabel}</Text></View>
                      </Pressable>
                    )
                  })}
                  {activeRows.length === 0 ? (
                    <View style={styles.inputListPlaceholder}>
                      <Text style={styles.inputListPlaceholderText}>Nog geen items in deze sectie.</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            </View>
            <View style={styles.setupRightColumn}>
              <View style={styles.setupSummaryCard}>
                <View style={styles.avatarCircle}><Text isSemibold style={styles.avatarText}>{selectedCoachee?.name.slice(0, 1).toUpperCase() || '?'}</Text></View>
                <View style={styles.summaryMeta}>
                  <Text isSemibold style={styles.summaryName}>{selectedCoachee?.name || 'Geen cliënt geselecteerd'}</Text>
                  <View style={styles.summaryLine}><Text style={styles.summaryLabel}>Template</Text><Text style={styles.summaryValue}>{selectedTemplate?.name || '-'}</Text></View>
                  <View style={styles.summaryLine}><Text style={styles.summaryLabel}>Sessies</Text><Text style={styles.summaryValue}>{`${selectedSessionIds.length} geselecteerd`}</Text></View>
                  <View style={styles.summaryLine}><Text style={styles.summaryLabel}>Rapportages</Text><Text style={styles.summaryValue}>{`${selectedRapportageIds.length} geselecteerd`}</Text></View>
                  <View style={styles.summaryLine}><Text style={styles.summaryLabel}>Notities</Text><Text style={styles.summaryValue}>{`${selectedNoteIds.length} geselecteerd`}</Text></View>
                </View>
              </View>
              <View style={styles.setupCard}>
                <Text isSemibold style={styles.setupSectionTitle}>Selecteer template</Text>
                <View style={styles.templateList}>
                  {werkfitTemplates.map((template) => {
                    const isSelected = selectedTemplateId === template.id
                    return (
                      <Pressable key={template.id} onPress={() => setSelectedTemplateId(template.id)} style={({ hovered }) => [styles.templateCard, isSelected ? styles.templateCardSelected : undefined, hovered ? styles.templateCardHovered : undefined]}>
                        <View style={[styles.templateRadio, isSelected ? styles.templateRadioSelected : undefined]}>{isSelected ? <View style={styles.templateRadioDot} /> : null}</View>
                        <View style={styles.templateTextWrap}><Text isSemibold style={styles.templateName}>{template.name}</Text><Text style={styles.templateDescription}>{template.description || 'Template voor rapportage.'}</Text></View>
                      </Pressable>
                    )
                  })}
                </View>
                {generateError ? <Text style={styles.generateErrorText}>{generateError}</Text> : null}
                <Pressable disabled={!canStartGeneration || isGenerating} onPress={() => { void handleGenerateFromSetup() }} style={({ hovered }) => [styles.generateButton, !canStartGeneration || isGenerating ? styles.generateButtonDisabled : undefined, hovered && canStartGeneration && !isGenerating ? styles.generateButtonHovered : undefined]}>
                  {isGenerating ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
                  <Text isSemibold style={styles.generateButtonText}>{isGenerating ? 'Rapportage wordt gegenereerd...' : 'Genereer rapportage'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <Animated.View
      style={[
        styles.editRoot,
        {
          opacity: readyRevealOpacity,
          transform: [{ translateY: readyRevealTranslateY }],
        },
      ]}
    >
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.screenScrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.page, styles.pageWithAssistant]}>
          <View style={styles.leftColumn}>
            <View style={styles.headerWrap}>
              <View style={styles.headerTopRow}>
                <Text isSemibold style={styles.title}>{mode === 'bewerken' ? 'Rapportage bewerken' : 'Rapportage controleren'}</Text>
                <View style={styles.headerActionsRow}>
                  <Pressable onPress={handleExportWord} style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHovered : undefined]}>
                    <UwvLogoIcon />
                    <Text isSemibold style={styles.exportButtonText}>Exporteer naar Word</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.subtitle}>{selectedTemplate?.name || 'Selecteer een UWV-verslag'}</Text>
            </View>
            {groupedFields.map((group) => {
                const status = getGroupStatus(group)
                const specialistAnswer = specialistTariffAnswerByGroup.get(group.key)
                const visibleFields = group.fields.filter((field) => {
                  if ((isSpecialistExpertiseDetail(field.label) || isSpecialistTariffDetail(field.label)) && specialistAnswer === 'nee') return false
                  return true
                })
                const postAddressFields = visibleFields.filter((field) => normalizeMatchValue(field.label).startsWith('postadres '))
                const visitAddressFields = visibleFields.filter((field) => normalizeMatchValue(field.label).startsWith('bezoekadres '))
                const defaultFields = visibleFields.filter((field) => !normalizeMatchValue(field.label).startsWith('postadres ') && !normalizeMatchValue(field.label).startsWith('bezoekadres '))

                const renderField = (field: UwvField) => {
                        const value = fieldValues[field.key] || ''
                        if (field.type === 'multichoice') {
                          const selectedItems = value.split(',').map((item) => item.trim()).filter(Boolean)
                          const useSquareIndicator = isMainActivityMultichoice(field.label)
                          return (
                            <View key={field.key} style={styles.fieldItemFull}>
                              <Text style={styles.fieldLabel}>{field.label}</Text>
                              <View style={styles.multichoiceWrap}>
                                {(field.options || []).map((option) => {
                                  const isSelected = selectedItems.includes(option)
                                  return (
                                    <Pressable key={option} onPress={() => updateMultichoiceValue(field, option)} style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}>
                                      <View style={[useSquareIndicator ? styles.choiceSquare : styles.choiceCircle, isSelected ? styles.choiceCircleSelected : undefined]}>{isSelected ? <View style={useSquareIndicator ? styles.choiceSquareInner : styles.choiceCircleInner} /> : null}</View>
                                      <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{option}</Text>
                                    </Pressable>
                                  )
                                })}
                              </View>
                            </View>
                          )
                        }
                        if (isActivityHoursDistribution(field.label)) {
                          return (
                            <View key={field.key} style={styles.fieldItemFull}>
                              <Text style={styles.fieldLabel}>{field.label}</Text>
                              <View style={styles.activityRowsWrap}>
                                {activityAllocationRows.map((row, index) => (
                                  <View key={row.id} style={styles.activityRow}>
                                    <View style={[styles.activityInputLarge, inputHeights[`activity-${row.id}`] ? { minHeight: inputHeights[`activity-${row.id}`] } : undefined]}>
                                      <TextInput
                                        value={row.activity}
                                        onChangeText={(nextValue) => updateActivityAllocationRow(row.id, { activity: nextValue })}
                                        onContentSizeChange={(event) => setGrowHeight(`activity-${row.id}`, event.nativeEvent.contentSize.height, 48)}
                                        placeholder="Re-integratieactiviteit"
                                        placeholderTextColor="#8E8480"
                                        style={[styles.input, inputWebStyle]}
                                      />
                                    </View>
                                    <View style={[styles.activityInputSmall, inputHeights[`hours-${row.id}`] ? { minHeight: inputHeights[`hours-${row.id}`] } : undefined]}>
                                      <TextInput
                                        value={row.hours}
                                        onChangeText={(nextValue) => updateActivityAllocationRow(row.id, { hours: nextValue })}
                                        onContentSizeChange={(event) => setGrowHeight(`hours-${row.id}`, event.nativeEvent.contentSize.height, 48)}
                                        placeholder="Aantal begeleidingsuren"
                                        placeholderTextColor="#8E8480"
                                        keyboardType="numeric"
                                        style={[styles.input, inputWebStyle]}
                                      />
                                    </View>
                                    {index === activityAllocationRows.length - 1 ? (
                                      <Pressable onPress={addActivityAllocationRow} style={({ hovered }) => [styles.addActivityButton, hovered ? styles.addActivityButtonHovered : undefined]}>
                                        <PlusIcon />
                                      </Pressable>
                                    ) : (
                                      <Pressable onPress={() => removeActivityAllocationRow(row.id)} style={({ hovered }) => [styles.removeActivityButton, hovered ? styles.removeActivityButtonHovered : undefined]}>
                                        <CloseIcon />
                                      </Pressable>
                                    )}
                                  </View>
                                ))}
                              </View>
                            </View>
                          )
                        }
                        if (isSpecialistExpertiseDetail(field.label)) {
                          const entry = specialistExpertiseByField[field.key] || { hours: '', motivation: '' }
                          return (
                            <View key={field.key} style={styles.fieldItemFull}>
                              <Text style={styles.fieldLabel}>{field.label}</Text>
                              <View style={styles.specialFieldWrap}>
                                <View style={styles.fieldItem}>
                                  <Text style={styles.fieldLabel}>Aantal uren</Text>
                                  <View style={styles.inputWrap}>
                                    <TextInput
                                      value={entry.hours}
                                      onChangeText={(nextValue) => setSpecialistExpertiseByField((current) => ({ ...current, [field.key]: { ...entry, hours: nextValue.replace(/\D/g, '') } }))}
                                      placeholder="Bijv. 8"
                                      placeholderTextColor="#8E8480"
                                      keyboardType="numeric"
                                      style={[styles.input, inputWebStyle]}
                                    />
                                  </View>
                                </View>
                                <View style={styles.fieldItemFull}>
                                  <Text style={styles.fieldLabel}>Motivering</Text>
                                  <View style={[styles.inputWrap, styles.inputWrapMultiline, inputHeights[`specialist-expertise-${field.key}`] ? { minHeight: inputHeights[`specialist-expertise-${field.key}`] } : undefined]}>
                                    <TextInput
                                      nativeID={`new-report-specialist-expertise-${field.key}`}
                                      value={entry.motivation}
                                      onChangeText={(nextValue) => setSpecialistExpertiseByField((current) => ({ ...current, [field.key]: { ...entry, motivation: nextValue } }))}
                                      onChange={(event) => autoSizeWebTextarea(`specialist-expertise-${field.key}`, MULTILINE_BASE_HEIGHT, event)}
                                      onContentSizeChange={(event) =>
                                        handleMultilineContentSizeChange(`specialist-expertise-${field.key}`, MULTILINE_BASE_HEIGHT, event, `new-report-specialist-expertise-${field.key}`)
                                      }
                                      multiline
                                      scrollEnabled={false}
                                      textAlignVertical="top"
                                      placeholder="Typ uw motivering"
                                      placeholderTextColor="#8E8480"
                                      style={[
                                        styles.input,
                                        styles.inputMultiline,
                                        inputHeights[`specialist-expertise-${field.key}`]
                                          ? { height: inputHeights[`specialist-expertise-${field.key}`] }
                                          : undefined,
                                        inputWebStyle,
                                      ]}
                                    />
                                  </View>
                                </View>
                              </View>
                            </View>
                          )
                        }
                        if (isSpecialistTariffDetail(field.label)) {
                          const entry = specialistTariffByField[field.key] || { hourlyRate: '', motivation: '' }
                          return (
                            <View key={field.key} style={styles.fieldItemFull}>
                              <Text style={styles.fieldLabel}>{field.label}</Text>
                              <View style={styles.specialFieldWrap}>
                                <View style={styles.fieldItem}>
                                  <Text style={styles.fieldLabel}>Uurtarief exclusief btw</Text>
                                  <View style={styles.currencyWrap}>
                                    <Text style={styles.currencyPrefix}>€</Text>
                                    <TextInput
                                      value={entry.hourlyRate}
                                      onChangeText={(nextValue) => setSpecialistTariffByField((current) => ({ ...current, [field.key]: { ...entry, hourlyRate: sanitizeCurrencyInput(nextValue) } }))}
                                      placeholder="125,00"
                                      placeholderTextColor="#8E8480"
                                      keyboardType="decimal-pad"
                                      style={[styles.input, styles.currencyInput, inputWebStyle]}
                                    />
                                  </View>
                                </View>
                                <View style={styles.fieldItemFull}>
                                  <Text style={styles.fieldLabel}>Motivering</Text>
                                  <View style={[styles.inputWrap, styles.inputWrapMultiline, inputHeights[`specialist-tariff-${field.key}`] ? { minHeight: inputHeights[`specialist-tariff-${field.key}`] } : undefined]}>
                                    <TextInput
                                      nativeID={`new-report-specialist-tariff-${field.key}`}
                                      value={entry.motivation}
                                      onChangeText={(nextValue) => setSpecialistTariffByField((current) => ({ ...current, [field.key]: { ...entry, motivation: nextValue } }))}
                                      onChange={(event) => autoSizeWebTextarea(`specialist-tariff-${field.key}`, MULTILINE_BASE_HEIGHT, event)}
                                      onContentSizeChange={(event) =>
                                        handleMultilineContentSizeChange(`specialist-tariff-${field.key}`, MULTILINE_BASE_HEIGHT, event, `new-report-specialist-tariff-${field.key}`)
                                      }
                                      multiline
                                      scrollEnabled={false}
                                      textAlignVertical="top"
                                      placeholder="Typ uw motivering"
                                      placeholderTextColor="#8E8480"
                                      style={[
                                        styles.input,
                                        styles.inputMultiline,
                                        inputHeights[`specialist-tariff-${field.key}`]
                                          ? { height: inputHeights[`specialist-tariff-${field.key}`] }
                                          : undefined,
                                        inputWebStyle,
                                      ]}
                                    />
                                  </View>
                                </View>
                              </View>
                            </View>
                          )
                        }
                        const multiline = !field.singleLine
                        return (
                          <View key={field.key} style={[styles.fieldItem, multiline ? styles.fieldItemFull : undefined]}>
                            <Text style={styles.fieldLabel}>{field.label}</Text>
                            <View style={[styles.inputWrap, multiline ? styles.inputWrapMultiline : undefined, inputHeights[field.key] ? { minHeight: inputHeights[field.key] } : undefined]}>
                              <TextInput
                                nativeID={multiline ? `new-report-field-${field.key}` : undefined}
                                value={value}
                                onChangeText={(nextValue) => setFieldValues((current) => ({ ...current, [field.key]: sanitizeOnChange(field.metadataKind, nextValue, current[field.key] || '') }))}
                                onChange={multiline ? (event) => autoSizeWebTextarea(field.key, MULTILINE_BASE_HEIGHT, event) : undefined}
                                onBlur={() => setFieldValues((current) => ({ ...current, [field.key]: formatOnBlur(field.metadataKind, current[field.key] || '') }))}
                                onContentSizeChange={(event) =>
                                  multiline
                                    ? handleMultilineContentSizeChange(field.key, MULTILINE_BASE_HEIGHT, event, `new-report-field-${field.key}`)
                                    : setGrowHeight(field.key, event.nativeEvent.contentSize.height, 48)
                                }
                                multiline={multiline}
                                scrollEnabled={false}
                                placeholder={placeholderForField(field)}
                                placeholderTextColor="#8E8480"
                                textAlignVertical={multiline ? 'top' : 'center'}
                                keyboardType={
                                  field.metadataKind === 'phone'
                                    ? 'phone-pad'
                                    : field.metadataKind === 'months' || field.metadataKind === 'bsn'
                                      ? 'number-pad'
                                      : undefined
                                }
                                style={[
                                  styles.input,
                                  multiline ? styles.inputMultiline : undefined,
                                  multiline && inputHeights[field.key] ? { height: inputHeights[field.key] } : undefined,
                                  inputWebStyle,
                                ]}
                              />
                            </View>
                          </View>
                        )
                      }

              return (
                <View key={group.key} style={[styles.formCard, status === 'complete' ? styles.formCardComplete : styles.formCardIncomplete]}>
                  <View style={styles.formCardHeader}>
                    <Text isSemibold style={styles.formCardTitle}>{group.title}</Text>
                    <View style={[styles.statusBadge, status === 'complete' ? styles.statusBadgeComplete : styles.statusBadgeIncomplete]}>
                      <Text style={[styles.statusBadgeText, status === 'complete' ? styles.statusBadgeTextComplete : styles.statusBadgeTextIncomplete]}>{status === 'complete' ? 'Compleet' : 'Onvolledig'}</Text>
                    </View>
                  </View>
                  <View style={styles.fieldGrid}>
                    {defaultFields.map(renderField)}
                  </View>
                  {group.key === '3' ? (
                    <View style={styles.addressSectionsWrap}>
                      <View style={styles.addressSection}>
                        <Text isSemibold style={styles.addressSectionTitle}>Postadres</Text>
                        <View style={styles.addressSectionGrid}>{postAddressFields.map(renderField)}</View>
                      </View>
                      <View style={styles.addressSection}>
                        <Text isSemibold style={styles.addressSectionTitle}>Bezoekadres</Text>
                        <View style={styles.addressSectionGrid}>{visitAddressFields.map(renderField)}</View>
                      </View>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
      <View style={styles.rightColumn}>
        <View style={styles.assistantCard}>
          <View style={styles.assistantHeader}>
            <View>
              <Text isSemibold style={styles.assistantTitle}>AI Assistent</Text>
              <Text style={styles.assistantSubtitle}>Verbeter je rapport</Text>
            </View>
          </View>
          <ScrollView
            ref={assistantScrollRef}
            style={styles.assistantMessages}
            contentContainerStyle={assistantMessages.length === 0 ? styles.assistantMessagesEmpty : styles.assistantMessagesContent}
            showsVerticalScrollIndicator={false}
          >
            {assistantMessages.length === 0 ? (
              <Text style={styles.assistantEmptyText}>Stel een vraag over deze rapportage.</Text>
            ) : (
              <>
                {assistantMessages.map((message) => (
                  <ChatMessage key={message.id} role={message.role} text={message.text} />
                ))}
                {isAssistantSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
              </>
            )}
          </ScrollView>
          <View style={styles.assistantComposerWrap}>
            <ChatComposer
              value={assistantMessage}
              onChangeValue={setAssistantMessage}
              onSend={() => {
                void handleSendAssistantMessage()
              }}
              isSendDisabled={isAssistantSending || assistantMessage.trim().length === 0}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  editRoot: { flex: 1 },
  screenScroll: { flex: 1 },
  screenScrollContent: { paddingBottom: 24 },
  setupContainer: { minHeight: '100%', gap: 16, padding: 24 },
  setupHeaderWrap: { gap: 6 },
  setupTitle: { fontSize: 40, lineHeight: 46, color: '#2C111F' },
  setupSubtitle: { fontSize: 16, lineHeight: 24, color: '#2C111F' },
  setupContentRow: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  setupLeftColumn: { flex: 1, minWidth: 0 },
  setupRightColumn: { width: 437, gap: 16 },
  setupCard: { borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFE0E2', padding: 20, ...( { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any ) },
  setupSummaryCard: { borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFE0E2', padding: 20, flexDirection: 'row', gap: 14, ...( { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any ) },
  setupSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  setupSectionTitle: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
  setupSectionSubtitle: { marginTop: 4, fontSize: 14, lineHeight: 18, color: '#93858D' },
  generateErrorText: { marginTop: 12, fontSize: 13, lineHeight: 18, color: '#B42318' },
  selectAllButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28, paddingHorizontal: 8, borderRadius: 8 },
  selectAllButtonDisabled: { opacity: 0.6 },
  selectAllButtonHovered: { backgroundColor: colors.hoverBackground },
  selectAllText: { fontSize: 15, lineHeight: 20, color: '#BE0165' },
  selectAllTextDisabled: { color: '#93858D' },
  selectAllCheckbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#767676', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  selectAllCheckboxSelected: { borderColor: '#BE0165', backgroundColor: '#BE0165' },
  tabRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingVertical: 14 },
  tabButton: { borderRadius: 8, minHeight: 32, paddingHorizontal: 8, alignItems: 'center', flexDirection: 'row', gap: 8 },
  tabButtonDisabled: { opacity: 0.5 },
  tabButtonHovered: { backgroundColor: '#F1EDF2' },
  tabButtonActive: { backgroundColor: '#FCF2F7' },
  tabText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
  tabCountBadge: { backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 2 },
  tabCountText: { fontSize: 12, lineHeight: 16, color: '#2C111F' },
  sessiesIconWrap: { width: 18, height: 18 },
  inputList: { maxHeight: 560 },
  inputListContent: { paddingBottom: 8, gap: 12 },
  inputListPlaceholder: { minHeight: 120, borderRadius: 8, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 6 },
  inputListPlaceholderTitle: { fontSize: 16, lineHeight: 20, color: '#2C111F', textAlign: 'center' },
  inputListPlaceholderText: { fontSize: 14, lineHeight: 20, color: '#93858D', textAlign: 'center' },
  inputRow: { minHeight: 76, borderRadius: 8, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputRowHovered: { borderColor: '#C9CCD1', backgroundColor: '#FBFBFC' },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#767676', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  checkboxSelected: { borderColor: '#BE0165', backgroundColor: '#BE0165' },
  inputMeta: { flex: 1, minWidth: 0, gap: 2 },
  inputTitle: { fontSize: 20, lineHeight: 24, color: '#2C111F' },
  inputDate: { fontSize: 14, lineHeight: 18, color: '#93858D' },
  templateList: { marginTop: 12, gap: 10 },
  templateCard: { borderRadius: 8, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', padding: 14, flexDirection: 'row', gap: 10 },
  templateCardHovered: { backgroundColor: '#FAFBFD' },
  templateCardSelected: { borderColor: '#BE0165', backgroundColor: '#FCF2F7' },
  templateRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#767676', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  templateRadioSelected: { borderColor: '#0075FF' },
  templateRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0075FF' },
  templateTextWrap: { flex: 1, gap: 4 },
  templateName: { fontSize: 20, lineHeight: 24, color: '#2C111F' },
  templateDescription: { fontSize: 14, lineHeight: 18, color: '#6B7280' },
  generateButton: { marginTop: 16, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, backgroundColor: '#BE0165' },
  generateButtonHovered: { backgroundColor: '#A50058' },
  generateButtonDisabled: { backgroundColor: '#C6C6C6' },
  generateButtonText: { fontSize: 15, lineHeight: 20, color: '#FFFFFF' },
  page: { minHeight: '100%', paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 12 },
  leftColumn: { maxWidth: '100%', gap: 12 },
  pageWithAssistant: { ...( { paddingRight: 456 } as any ) },
  rightColumn: { width: 428, maxWidth: '100%', ...( { position: 'absolute', top: 24, right: 12, bottom: 24 } as any ) },
  headerWrap: { gap: 6 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 44, lineHeight: 50, color: '#2C111F' },
  subtitle: { fontSize: 16, lineHeight: 24, color: '#2C111F' },
  exportButton: { minHeight: 44, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#007ACF', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10 },
  exportButtonHovered: { backgroundColor: '#EFF7FF' },
  exportButtonText: { fontSize: 14, lineHeight: 18, color: '#007ACF' },
  formCard: { borderRadius: 12, borderWidth: 1, backgroundColor: '#FFFFFF', padding: 16, gap: 12, ...( { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any ) },
  formCardComplete: { borderColor: '#008234' },
  formCardIncomplete: { borderColor: '#DC2626' },
  formCardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  formCardTitle: { flex: 1, fontSize: 16, lineHeight: 20, color: '#2C111F' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  statusBadgeComplete: { backgroundColor: '#D4FDE5' },
  statusBadgeIncomplete: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 12, lineHeight: 16 },
  statusBadgeTextComplete: { color: '#008234' },
  statusBadgeTextIncomplete: { color: '#DC2626' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fieldItem: { width: '48.5%', gap: 6 },
  fieldItemFull: { width: '100%', gap: 6 },
  fieldLabel: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  inputWrap: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, justifyContent: 'center' },
  inputWrapMultiline: { minHeight: MULTILINE_BASE_HEIGHT, paddingTop: 10, paddingBottom: 10, justifyContent: 'flex-start' },
  input: { width: '100%', padding: 0, fontSize: 14, lineHeight: 20, color: '#2C111F' },
  inputMultiline: { minHeight: 20, paddingTop: 2 },
  multichoiceWrap: { flexDirection: 'column', gap: 10 },
  choiceRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 8 },
  choiceRowHovered: { backgroundColor: '#F8FAFC' },
  choiceCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#B7BCC5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  choiceSquare: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#B7BCC5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  choiceCircleSelected: { borderColor: '#BE0165' },
  choiceCircleInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#BE0165' },
  choiceSquareInner: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#BE0165' },
  choiceRowText: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  choiceRowTextSelected: { color: '#BE0165' },
  activityRowsWrap: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityInputLarge: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, justifyContent: 'center' },
  activityInputSmall: { width: 220, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, justifyContent: 'center' },
  addActivityButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#BE0165', alignItems: 'center', justifyContent: 'center' },
  addActivityButtonHovered: { backgroundColor: '#A50058' },
  removeActivityButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  removeActivityButtonHovered: { backgroundColor: '#F3F4F6' },
  addressSectionsWrap: { gap: 12 },
  addressSection: { gap: 8 },
  addressSectionTitle: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  addressSectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specialFieldWrap: { gap: 12 },
  currencyWrap: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  currencyPrefix: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  currencyInput: { flex: 1 },
  assistantCard: { borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', height: '100%', ...( { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any ) },
  assistantHeader: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  assistantTitle: { fontSize: 20, lineHeight: 24, color: '#2C111F' },
  assistantSubtitle: { fontSize: 14, lineHeight: 18, color: '#93858D' },
  assistantMessages: { flex: 1 },
  assistantMessagesContent: { gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  assistantMessagesEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  assistantEmptyText: { fontSize: 14, lineHeight: 20, color: '#93858D', textAlign: 'center' },
  assistantComposerWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E9D7E1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
  summaryMeta: { flex: 1, gap: 10 },
  summaryName: { fontSize: 18, lineHeight: 22, color: '#2C111F' },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { fontSize: 14, lineHeight: 18, color: '#93858D' },
  summaryValue: { fontSize: 14, lineHeight: 18, color: '#2C111F', textAlign: 'right' },
})







