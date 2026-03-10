import { Asset } from 'expo-asset'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { parseReportSections } from '../../../types/reportStructure'

function normalizeMatchValue(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const eindrapportageWerkfitTemplate = require('../../../../assets/formulieren/eindrapportage-werkfit-maken.docx')
const reIntegratieplanWerkfitTemplate = require('../../../../assets/formulieren/re-integratieplan-werkfit-maken .docx')
type UwvTemplateKind = 'eindrapportage' | 'reintegratieplan'

const templateSectionMappings: Record<UwvTemplateKind, Record<string, string>> = {
  reintegratieplan: {
    naam_organisatie: '3.1',
    bezoekadres: '3.2',
    postadres: '3.3',
    postcode_en_plaats: '3.4',
    postcode: '3.4',
    plaats: '3.4',
    naam_contactpersoon: '3.5',
    functie_contactpersoon: '3.6',
    telefoonnummer_contactpersoon: '3.7',
    e_mailadres_contactpersoon: '3.8',
  },
  eindrapportage: {
    naam_organisatie: '3.1',
    naam_contactpersoon: '3.2',
    functie_contactpersoon: '3.3',
    telefoonnummer_contactpersoon: '3.4',
    e_mailadres_contactpersoon: '3.5',
  },
}

function buildTemplateAssetFromName(templateName: string | null | undefined): any | null {
  const normalized = normalizeMatchValue(templateName || '')
  if (!normalized) return null

  if (normalized.includes('eindrapportage') && normalized.includes('werkfit')) {
    return eindrapportageWerkfitTemplate
  }
  if (normalized.includes('re integratieplan') && normalized.includes('werkfit')) {
    return reIntegratieplanWerkfitTemplate
  }
  return null
}

function xmlEscape(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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

function extractNumberedValuesFromText(text: string): Map<string, string> {
  const result = new Map<string, string>()
  const lines = String(text || '').split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*(\d{1,2})\s*[._-]\s*([0-9a-z])\s+([^:]+):\s*(.+?)\s*$/i)
    if (!match) continue
    const key = `${Number(match[1])}.${String(match[2]).toLowerCase()}`
    const value = String(match[4] || '').trim()
    if (!key || !value) continue
    result.set(key, value)
  }
  return result
}

function splitPostalCodeAndCity(value: string): { postalCode: string; city: string } {
  const raw = String(value || '').trim()
  if (!raw) return { postalCode: '', city: '' }
  const match = raw.match(/\b\d{4}\s?[a-z]{2}\b/i)
  if (!match || match.index === undefined) return { postalCode: '', city: raw }
  const postalCode = String(match[0] || '').toUpperCase().replace(/\s+/g, '')
  const city = raw
    .slice(match.index + match[0].length)
    .replace(/^[,\s-]+/, '')
    .trim()
  return { postalCode, city }
}

function formatCurrentDateNl(): string {
  const now = new Date()
  return now.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function extractNumberedValuesFromSections(reportText: string): Map<string, string> {
  const result = new Map<string, string>()
  const sections = parseReportSections(reportText || '')
  for (const section of sections) {
    const title = String(section.title || '').trim()
    const match = title.match(/^(\d{1,2})\s*[._-]\s*([0-9a-z])\b/i)
    if (!match) continue
    const key = `${Number(match[1])}.${String(match[2]).toLowerCase()}`
    const value = String(section.content || '').trim()
    if (!value) continue
    result.set(key, value)
  }
  return result
}

function buildPlaceholderValueMap(params: {
  templateKind: UwvTemplateKind
  reportText: string
  contextValues?: Record<string, string | null | undefined>
}): Map<string, string> {
  const map = new Map<string, string>()
  const semanticToNumberMap = templateSectionMappings[params.templateKind]
  const numberToSemanticMap = Object.fromEntries(
    Object.entries(semanticToNumberMap).map(([semanticKey, dottedNumber]) => [dottedNumber.replace('.', '_'), semanticKey]),
  ) as Record<string, string>

  function setValueWithAliases(rawKey: string, rawValue: string) {
    const key = toPlaceholderKey(rawKey)
    const value = String(rawValue || '').trim()
    if (!key) return
    const keys = new Set<string>()
    keys.add(key)

    const parts = key.split('_').filter(Boolean)
    if (parts.length >= 2) {
      keys.add(`${parts[0]}_${parts[1]}`)
    }
    if (parts.length >= 3) {
      keys.add(`${parts[0]}_${parts[1]}_${parts[2]}`)
    }

    for (const currentKey of keys) {
      map.set(currentKey, value)
      const mappedNumber = semanticToNumberMap[currentKey]
      if (mappedNumber) map.set(mappedNumber.replace('.', '_'), value)
      const mappedSemantic = numberToSemanticMap[currentKey]
      if (mappedSemantic) map.set(mappedSemantic, value)

      if (currentKey.endsWith('_activiteit')) {
        map.set(currentKey.replace(/_activiteit$/i, '_re_integratieactiviteit'), value)
      }
      if (currentKey.endsWith('_re_integratieactiviteit')) {
        map.set(currentKey.replace(/_re_integratieactiviteit$/i, '_activiteit'), value)
      }
    }
  }

  const sectionValues = buildSectionValueMap(params.reportText)
  const numberedValues = extractNumberedValuesFromText(params.reportText)

  for (const [sectionTitle, sectionValue] of sectionValues.entries()) {
    setValueWithAliases(sectionTitle, sectionValue)
  }

  for (const [numberKey, value] of numberedValues.entries()) {
    setValueWithAliases(numberKey, value)
  }

  const contextEntries = Object.entries(params.contextValues || {})
  for (const [rawKey, rawValue] of contextEntries) {
    setValueWithAliases(rawKey, String(rawValue || ''))
  }

  const activityDistributionRaw = [
    params.contextValues?.['5_3'],
    params.contextValues?.['5.3'],
    params.contextValues?.['5_3_1'],
    params.contextValues?.['hoe_verdeelt_u_de_begeleidingsuren_over_de_re_integratieactiviteiten'],
    params.contextValues?.['verdeling_begeleidingsuren_over_de_re_integratieactiviteiten'],
  ]
    .map((value) => String(value || '').trim())
    .find((value) => value.length > 0) || ''

  if (activityDistributionRaw) {
    const activityRows = activityDistributionRaw
      .split(/\s*;\s*/)
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .map((part) => {
        const match = part.match(/^(.*?)\s*\(\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:uur|uren)?\s*\)\s*$/i)
        if (!match) {
          const looseNumber = part.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
          const activity = String(part || '').replace(/\s*\(?\s*[0-9]+(?:[.,][0-9]+)?\s*(?:uur|uren)?\s*\)?\s*$/i, '').trim()
          return { activity: activity || part, hours: String(looseNumber?.[1] || '').trim().replace(',', '.') }
        }
        return {
          activity: String(match[1] || '').trim(),
          hours: String(match[2] || '').trim().replace(',', '.'),
        }
      })
      .filter((row) => row.activity.length > 0 || row.hours.length > 0)

    if (activityRows.length > 0) {
      let totalHours = 0
      for (let index = 0; index < 5; index += 1) {
        const row = activityRows[index]
        const activityKey = `5_3_${index + 1}_re_integratieactiviteit`
        const hoursKey = `5_3_${index + 1}_aantal_begeleidingsuren`
        const activityValue = row ? row.activity : ''
        const hoursValue = row ? row.hours : ''
        map.set(activityKey, activityValue)
        map.set(hoursKey, hoursValue)
        if (hoursValue) {
          const parsedHours = Number(hoursValue)
          if (Number.isFinite(parsedHours)) totalHours += parsedHours
        }
      }
      map.set('5_3_totaal_aantal_begeleidingsuren', totalHours > 0 ? String(totalHours).replace(/\.0$/, '') : '')
    }
  }

  if (!map.get('5_3_totaal_aantal_begeleidingsuren')) {
    let derivedTotal = 0
    for (let index = 1; index <= 5; index += 1) {
      const rawHours = String(map.get(`5_3_${index}_aantal_begeleidingsuren`) || '').trim().replace(',', '.')
      if (!rawHours) continue
      const parsedHours = Number(rawHours)
      if (Number.isFinite(parsedHours)) derivedTotal += parsedHours
    }
    if (derivedTotal > 0) {
      map.set('5_3_totaal_aantal_begeleidingsuren', String(derivedTotal).replace(/\.0$/, ''))
    }
  }

  return map
}

function buildSectionValueMap(reportText: string): Map<string, string> {
  const sections = parseReportSections(reportText || '')
  const map = new Map<string, string>()
  for (const section of sections) {
    const key = normalizeMatchValue(section.title)
    const value = String(section.content || '').trim()
    if (!key || !value) continue
    map.set(key, value)
  }
  return map
}

function extractNumberKeyFromLabel(label: string): string {
  const raw = String(label || '')
  const directMatch = raw.match(/(?:^|\s)(\d{1,2})\s*[._-]\s*([0-9a-z])(?:\b|$)/i)
  if (directMatch) return `${Number(directMatch[1])}.${String(directMatch[2]).toLowerCase()}`

  const spacedMatch = raw.match(/(?:^|\s)(\d{1,2})\s+([0-9a-z])(?:\b|$)/i)
  if (spacedMatch) return `${Number(spacedMatch[1])}.${String(spacedMatch[2]).toLowerCase()}`
  return ''
}

function getContextValue(contextValues: Record<string, string | null | undefined>, ...keys: string[]): string {
  for (const key of keys) {
    const value = String(contextValues[key] || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim()
    if (value) return value
  }
  return ''
}

function resolveOrderNumber(params: {
  contextValues: Record<string, string | null | undefined>
  numberedValues: Map<string, string>
}): string {
  const fromContext = getContextValue(
    params.contextValues,
    '4_1',
    'ordernummer',
    'order_number',
    'ordernr',
    'order_nr',
    'order',
  )
  if (fromContext) return fromContext
  const fromNumbered = params.numberedValues.get('4.1')
  if (fromNumbered) return fromNumbered
  const fromContextText = getContextValue(params.contextValues, 'context_raw', 'report_text')
  const inlineMatch = fromContextText.match(/(?:ordernummer|order\s*nummer|order_nr|ordernr)\s*[:=-]\s*([^\n\r]+)/i)
  if (inlineMatch) return String(inlineMatch[1] || '').trim()
  return ''
}

type FieldResolverParams = {
  rowLabel: string
  numberKey: string
  effectiveNumberKey: string
  fieldIndex: number
  fieldCount: number
  inferredRowIndex: number
  signatureRole: 'contact' | 'client' | null
  numberedValues: Map<string, string>
  contextValues?: Record<string, string | null | undefined>
}

function parseAddressLine(addressLine: string): { street: string; houseNumber: string } {
  const normalized = String(addressLine || '').trim()
  if (!normalized) return { street: '', houseNumber: '' }
  const match = normalized.match(/^(.*?)(\d+[a-zA-Z0-9\-\/]*)$/)
  if (!match) return { street: normalized, houseNumber: '' }
  return {
    street: String(match[1] || '').trim().replace(/,\s*$/, ''),
    houseNumber: String(match[2] || '').trim(),
  }
}

function parseSelectionList(value: string): string[] {
  return String(value || '')
    .split(/[,\n;]+/)
    .map((item) => normalizeMatchValue(item))
    .filter(Boolean)
}

function parseSpecialistExpertiseValue(value: string): { hours: string; motivation: string } {
  const raw = String(value || '').trim()
  if (!raw) return { hours: '', motivation: '' }
  const normalizedRaw = raw.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
  const hoursMatch =
    normalizedRaw.match(/aantal\s+uren\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i) ||
    normalizedRaw.match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
  const motivationMatch = raw.match(/(?:motivering|motivatie)\s*:\s*([\s\S]+)/i)
  return {
    hours: String(hoursMatch?.[1] || '').trim(),
    motivation: String(motivationMatch?.[1] || '').trim(),
  }
}

function extractNumericOnly(value: string): string {
  const match = String(value || '')
    .replace(/\u00a0/g, ' ')
    .match(/\b([0-9]+(?:[.,][0-9]+)?)\b/)
  return String(match?.[1] || '').trim()
}

function resolveReintegratieplanField(params: FieldResolverParams): string {
  const contextValues = params.contextValues || {}
  const clientInitials = getContextValue(contextValues, '1_1_voorletters', 'voorletters')
  const clientSurname = getContextValue(contextValues, '1_1_achternaam', 'achternaam')
  const clientFullName =
    getContextValue(contextValues, 'voorletters_en_achternaam') || [clientInitials, clientSurname].filter(Boolean).join(' ').trim()
  const postadresLine = [getContextValue(contextValues, 'postadres_straatnaam'), getContextValue(contextValues, 'postadres_huisnummer')]
    .filter(Boolean)
    .join(' ')
    .trim()
  const postadres = postadresLine || getContextValue(contextValues, 'postadres', '3_3', '3.3')
  const postadresPostcodePlaatsRaw = getContextValue(contextValues, '3_4', '3.4', 'postadres_postcode_en_plaats', 'postcode_en_plaats')
  const postadresPostcodePlaatsParsed = splitPostalCodeAndCity(postadresPostcodePlaatsRaw)
  const postcode =
    getContextValue(contextValues, 'postadres_postcode', 'postcode') ||
    postadresPostcodePlaatsParsed.postalCode
  const plaats =
    getContextValue(contextValues, 'postadres_plaats', 'plaats') ||
    postadresPostcodePlaatsParsed.city
  const normalizedLabel = normalizeMatchValue(params.rowLabel)
  const bezoekadresLine = getContextValue(contextValues, 'bezoekadres', '3_2', '3.2')
  const bezoekadresParsed = parseAddressLine(bezoekadresLine)
  const bezoekadresPostcodePlaatsParsed = splitPostalCodeAndCity(
    getContextValue(contextValues, 'bezoekadres_postcode_en_plaats', 'visit_postcode_city'),
  )
  const bezoekadresStreet = getContextValue(contextValues, 'bezoekadres_straatnaam', 'visit_street') || bezoekadresParsed.street
  const bezoekadresHouseNumber = getContextValue(contextValues, 'bezoekadres_huisnummer', 'visit_house_number') || bezoekadresParsed.houseNumber
  const bezoekadresPostcode =
    getContextValue(contextValues, 'bezoekadres_postcode', 'visit_postcode') || bezoekadresPostcodePlaatsParsed.postalCode
  const bezoekadresPlaats = getContextValue(contextValues, 'bezoekadres_plaats', 'visit_city') || bezoekadresPostcodePlaatsParsed.city
  const specialistExpertiseRaw = getContextValue(
    contextValues,
    '8_2',
    '8.2',
    'specialistische_expertise_motivering_en_aantal_uren',
    'motiveer_welke_specialistische_expertise_voor_de_client_nodig_is_en_hoeveel_uren_u_adviseert',
  )
  const specialistExpertise = parseSpecialistExpertiseValue(specialistExpertiseRaw)
  const clientName = getContextValue(
    contextValues,
    'naam_client',
    '10_ondertekening_client_naam',
    '10_ondertekening_klant_naam',
    '9_ondertekening_client_naam',
    '9_ondertekening_klant_naam',
    'voorletters_en_achternaam',
  ) || clientFullName || clientSurname
  const contactName = getContextValue(
    contextValues,
    '3_5',
    '3.5',
    'naam_contactpersoon',
    'naam_contactpersoon_re_integratiebedrijf',
    'naam_contact_persoon',
    'contactpersoon_naam',
    '9_ondertekening_contactpersoon_re_integratiebedrijf_naam',
    '10_ondertekening_contactpersoon_re_integratiebedrijf_naam',
    '2_1',
  )

  if (normalizedLabel.includes('totaal aantal begeleidingsuren')) {
    return getContextValue(
      contextValues,
      '5_3_totaal_aantal_begeleidingsuren',
      '7_3_totaal_aantal_begeleidingsuren',
    )
  }

  if (params.numberKey === '3.3') return postadres
  if (params.numberKey === '3.2') {
    const visitAddress = [bezoekadresStreet, bezoekadresHouseNumber].filter(Boolean).join(' ').trim()
    const postalCodeCity = [bezoekadresPostcode, bezoekadresPlaats].filter(Boolean).join(' ').trim()
    return [visitAddress, postalCodeCity].filter(Boolean).join(', ').trim()
  }
  if (params.numberKey === '3.4') {
    if (params.fieldCount >= 2) return params.fieldIndex === 1 ? postcode : params.fieldIndex === 2 ? plaats : ''
    return [postcode, plaats].filter(Boolean).join(' ').trim()
  }
  if (params.numberKey === '3.5') return contactName || params.numberedValues.get('3.5') || ''
  if (params.numberKey === '4.1') return resolveOrderNumber({ contextValues, numberedValues: params.numberedValues })
  if (params.numberKey === '3.8' && normalizeMatchValue(params.rowLabel).includes('ordernummer')) {
    return resolveOrderNumber({ contextValues, numberedValues: params.numberedValues })
  }
  if (params.numberKey === '1.2') return getContextValue(contextValues, '1_2', 'bsn', 'burgerservicenummer')
  if (params.numberKey === '1.1') {
    if (params.fieldCount >= 2) {
      if (params.fieldIndex === 1) return clientInitials
      if (params.fieldIndex === 2) return clientSurname
      return ''
    }
    return clientFullName
  }
  if (params.effectiveNumberKey === '8.2') {
    if (normalizedLabel.includes('aantal uren')) {
      return extractNumericOnly(
        getContextValue(contextValues, '8_2_aantal_uren', 'specialistische_expertise_aantal_uren') || specialistExpertise.hours,
      )
    }
    if (normalizedLabel.includes('motivering') || normalizedLabel.includes('motivatie')) {
      return getContextValue(contextValues, '8_2_motivering', 'specialistische_expertise_motivering') || specialistExpertise.motivation
    }
  }

  if (params.effectiveNumberKey === '8.3') {
    if (normalizedLabel.includes('uurtarief exclusief btw')) {
      return getContextValue(contextValues, '8_3a', '8.3a', '8_3_uurtarief_exclusief_btw', 'specialistisch_uurtarief_exclusief_btw')
    }
    if (normalizedLabel === 'motivering') {
      return getContextValue(contextValues, '8_3b', '8.3b', '8_3_motivering', 'motivering_uurtarief')
    }
  }

  if (params.effectiveNumberKey === '5.2') {
    if (params.fieldIndex > 1) return ''
    return (
      getContextValue(
        contextValues,
        '5_2',
        '5.2',
        'beschrijving_van_de_activiteiten_en_het_gewenste_resultaat',
      ) ||
      params.numberedValues.get('5.2') ||
      ''
    )
  }

  if (params.effectiveNumberKey === '5.3') {
    if (normalizedLabel.includes('totaal aantal begeleidingsuren')) {
      return getContextValue(contextValues, '5_3_totaal_aantal_begeleidingsuren', '7_3_totaal_aantal_begeleidingsuren')
    }
    if (params.inferredRowIndex > 0 && params.fieldCount >= 2) {
      if (params.fieldIndex === 1) {
        return getContextValue(
          contextValues,
          `5_3_${params.inferredRowIndex}_re_integratieactiviteit`,
          `7_3_${params.inferredRowIndex}_re_integratieactiviteit`,
        )
      }
      if (params.fieldIndex === 2) {
        return getContextValue(
          contextValues,
          `5_3_${params.inferredRowIndex}_aantal_begeleidingsuren`,
          `7_3_${params.inferredRowIndex}_aantal_begeleidingsuren`,
        )
      }
      return ''
    }
  }

  if (params.numberKey) {
    if (params.numberKey === '5.1' || params.numberKey === '8.1') return ''
    if (params.numberKey === '5.3') return ''
    if (params.fieldIndex > 1) return ''
    return params.numberedValues.get(params.numberKey) || ''
  }

  if (normalizedLabel.includes('naam contactpersoon')) return contactName
  if (normalizedLabel.includes('ten naam van de client') || normalizedLabel.includes('ten name van de client')) return clientName
  if (normalizedLabel.includes('ten naam van de klant')) return clientName
  if (normalizedLabel.includes('ordernummer')) return resolveOrderNumber({ contextValues, numberedValues: params.numberedValues })
  if (normalizedLabel.includes('datum') && normalizedLabel.includes('handtekening')) return formatCurrentDateNl()
  if (normalizedLabel === 'naam' && params.fieldIndex === 1) {
    if (params.signatureRole === 'contact') return contactName
    if (params.signatureRole === 'client') return clientName
  }
  if ((normalizedLabel.includes('client') || normalizedLabel.includes('klant')) && normalizedLabel.includes('naam')) return clientName
  if (normalizedLabel.includes('re integratiebedrijf') && normalizedLabel.includes('naam')) return contactName
  return ''
}

function resolveEindrapportageField(params: FieldResolverParams): string {
  const contextValues = params.contextValues || {}
  const clientInitials = getContextValue(contextValues, '1_1_voorletters', 'voorletters')
  const clientSurname = getContextValue(contextValues, '1_1_achternaam', 'achternaam')
  const clientName =
    getContextValue(
      contextValues,
      '9_ondertekening_client_naam',
      '9_ondertekening_klant_naam',
      '10_ondertekening_client_naam',
      '10_ondertekening_klant_naam',
      'voorletters_en_achternaam',
    ) || [clientInitials, clientSurname].filter(Boolean).join(' ').trim()
  const contactName = getContextValue(
    contextValues,
    '9_ondertekening_contactpersoon_re_integratiebedrijf_naam',
    '10_ondertekening_contactpersoon_re_integratiebedrijf_naam',
    'naam_contactpersoon_re_integratiebedrijf',
    'naam_contactpersoon',
    '3_2',
  )
  if (params.numberKey) {
    if (params.numberKey === '1.1') {
      if (params.fieldCount >= 2) {
        if (params.fieldIndex === 1) return clientInitials
        if (params.fieldIndex === 2) return clientSurname
        return ''
      }
      return clientName || params.numberedValues.get(params.numberKey) || ''
    }
    if (params.fieldIndex > 1) return ''
    if (params.numberKey === '1.2') return getContextValue(contextValues, '1_2', 'bsn', 'burgerservicenummer') || params.numberedValues.get(params.numberKey) || ''
    return params.numberedValues.get(params.numberKey) || ''
  }

  const normalizedLabel = normalizeMatchValue(params.rowLabel)
  if (normalizedLabel.includes('datum') && normalizedLabel.includes('handtekening')) return ''
  if (normalizedLabel === 'naam' && params.fieldIndex === 1) {
    if (params.signatureRole === 'contact') return contactName
    if (params.signatureRole === 'client') return clientName
  }
  if ((normalizedLabel.includes('client') || normalizedLabel.includes('klant')) && normalizedLabel.includes('naam')) return clientName
  if (normalizedLabel.includes('re integratiebedrijf') && normalizedLabel.includes('naam')) return contactName
  return ''
}

function pickValueForRowLabel(params: FieldResolverParams & { templateKind: UwvTemplateKind }): string {
  return params.templateKind === 'reintegratieplan' ? resolveReintegratieplanField(params) : resolveEindrapportageField(params)
}

function normalizeFieldText(value: string): string {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim()
}

function extractRunPropertiesXml(xmlFragment: string): string {
  const match = String(xmlFragment || '').match(/<w:rPr[\s\S]*?<\/w:rPr>/i)
  return match ? match[0] : ''
}

function extractFieldTextRunPropertiesXml(xmlFragment: string): string {
  const runs = String(xmlFragment || '').match(/<w:r\b[\s\S]*?<\/w:r>/g) || []
  for (const run of runs) {
    if (!/<w:t(?:\s+[^>]*)?>[\s\S]*?<\/w:t>/i.test(run)) continue
    const runProps = extractRunPropertiesXml(run)
    if (runProps) return runProps
  }
  return ''
}

function buildFieldReplacementRuns(value: string, runPropertiesXml?: string): string {
  const trimmed = normalizeFieldText(value)
  if (!trimmed) return ''
  const parts = trimmed
    .split(/\r?\n/)
    .map((part) => normalizeFieldText(part))
    .filter(Boolean)
  if (parts.length === 0) return ''
  const runProps = String(runPropertiesXml || '').trim()
  const runPropsXml = runProps ? `${runProps}` : ''
  return parts
    .map((part, index) => {
      const textNode = `<w:r>${runPropsXml}<w:t>${xmlEscape(part)}</w:t></w:r>`
      if (index === 0) return textNode
      return `<w:r>${runPropsXml}<w:br/></w:r>${textNode}`
    })
    .join('')
}

function stripPlaceholderSpaceRuns(xmlFragment: string): string {
  // Remove placeholder tail runs used by legacy FORMTEXT fields.
  // Includes both real en-space and mojibake token seen in this template (`â€‚`).
  return String(xmlFragment || '')
    .replace(/<w:r\b[^>]*>\s*(?:<w:rPr[\s\S]*?<\/w:rPr>\s*)?<w:t(?:\s+[^>]*)?>\s*(?:â€‚| |&#8194;)\s*<\/w:t>\s*<\/w:r>/g, '')
    .replace(/<w:r\b[^>]*>\s*(?:<w:rPr[\s\S]*?<\/w:rPr>\s*)?<w:t(?:\s+[^>]*)?>\s*<\/w:t>\s*<\/w:r>/g, '')
}

function fillDocumentXmlFormTextFields(params: {
  documentXml: string
  reportText: string
  templateKind: UwvTemplateKind
  contextValues?: Record<string, string | null | undefined>
}): string {
  const numberedValues = extractNumberedValuesFromText(params.reportText)
  for (const [numberKey, value] of extractNumberedValuesFromSections(params.reportText).entries()) {
    if (!numberedValues.has(numberKey)) numberedValues.set(numberKey, value)
  }
  const activeSectionMapping = templateSectionMappings[params.templateKind]
  for (const [rawKey, rawValue] of Object.entries(params.contextValues || {})) {
    const key = toPlaceholderKey(rawKey)
    const value = String(rawValue || '').trim()
    if (!key) continue
    const mappedNumber = activeSectionMapping[key]
    if (mappedNumber && value) {
      numberedValues.set(mappedNumber, value)
    }
    const numberedKeyMatch = key.match(/^(\d{1,2})_([0-9a-z])$/i)
    if (numberedKeyMatch && value) {
      numberedValues.set(`${Number(numberedKeyMatch[1])}.${String(numberedKeyMatch[2]).toLowerCase()}`, value)
    }
    if ((key === 'ordernummer' || key === 'order_number') && value) {
      numberedValues.set('4.1', value)
    }
    if ((key === 'burgerservicenummer' || key === 'bsn') && value) {
      numberedValues.set('1.2', value)
    }
  }
  let signatureRole: 'contact' | 'client' | null = null
  let pendingSignatureDateField = false
  let activeNumberKey = ''
  let activityDistributionRowCursor = 0

  function extractContactNameFromSignatureRows(xml: string): string {
    const signatureMatch = String(xml || '').match(
      /Contactpersoon re-integratiebedrijf[\s\S]*?<w:t>Naam<\/w:t>[\s\S]*?<w:fldChar w:fldCharType="separate"\/>[\s\S]*?<w:t[^>]*>([^<]+)<\/w:t>[\s\S]*?<w:fldChar w:fldCharType="end"\/>/i,
    )
    return String(signatureMatch?.[1] || '').trim()
  }

  function injectEndOnlyValueAfterMarker(params: { rowXml: string; markerXml: string; value: string }): string {
    const rowXml = String(params.rowXml || '')
    const markerXml = String(params.markerXml || '')
    const value = String(params.value || '').trim()
    if (!rowXml || !markerXml || !value) return rowXml
    const markerIndex = rowXml.indexOf(markerXml)
    if (markerIndex < 0) return rowXml
    const rowHead = rowXml.slice(0, markerIndex)
    const rowTail = rowXml.slice(markerIndex)
    const endRunPattern = /(<w:r[^>]*>[\s\S]*?<w:fldChar w:fldCharType="end"\/>[\s\S]*?<\/w:r>)/
    const endRunMatch = rowTail.match(endRunPattern)
    if (!endRunMatch) return rowXml
    const endRunXml = String(endRunMatch[1] || '')
    const runPropertiesXml = extractRunPropertiesXml(endRunXml)
    const replacementRuns = buildFieldReplacementRuns(value, runPropertiesXml)
    if (!replacementRuns) return rowXml
    const runPropsXml = runPropertiesXml ? `${runPropertiesXml}` : ''
    const beginRun = `<w:r>${runPropsXml}<w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val=""/><w:enabled/><w:calcOnExit w:val="0"/><w:textInput/></w:ffData></w:fldChar></w:r>`
    const instrRun = `<w:r>${runPropsXml}<w:instrText xml:space="preserve"> FORMTEXT </w:instrText></w:r>`
    const separateRun = `<w:r>${runPropsXml}<w:fldChar w:fldCharType="separate"/></w:r>`
    const repairedField = `${beginRun}${instrRun}${separateRun}${replacementRuns}${endRunXml}`
    return `${rowHead}${rowTail.replace(endRunPattern, repairedField)}`
  }

  function applyCheckboxSelection(rowXml: string, rowNumberKey: string, contextValues: Record<string, string | null | undefined>, numberedValues: Map<string, string>): string {
    if (!rowNumberKey) return rowXml
    const checkboxPattern = /<w:checkBox>[\s\S]*?<w:default w:val="([01])"\s*\/>[\s\S]*?<\/w:checkBox>/g
    const checkboxes = String(rowXml || '').match(checkboxPattern) || []
    if (checkboxes.length === 0) return rowXml

    let states: boolean[] = []
    if (rowNumberKey === '5.1') {
      const rawValue =
        getContextValue(
          contextValues,
          '5_1',
          '5.1',
          'welke_hoofdactiviteiten_zijn_in_het_werkplan_of_plan_van_aanpak_benoemd',
        ) || numberedValues.get('5.1') || ''
      const selected = new Set(parseSelectionList(rawValue))
      const options = [
        'versterken werknemersvaardigheden',
        'verbeteren persoonlijke effectiviteit',
        'in beeld brengen arbeidsmarktpositie',
      ].map((item) => normalizeMatchValue(item))
      states = options.map((option) => selected.has(option))
    } else if (rowNumberKey === '8.1') {
      const rawValue =
        getContextValue(
          contextValues,
          '8_1',
          '8.1',
          'is_er_sprake_van_specialistisch_uurtarief',
        ) || numberedValues.get('8.1') || ''
      const normalized = normalizeMatchValue(rawValue)
      states = [normalized === 'nee', normalized === 'ja']
    } else {
      return rowXml
    }

    let checkboxIndex = 0
    return rowXml.replace(checkboxPattern, (match) => {
      const isChecked = Boolean(states[checkboxIndex])
      checkboxIndex += 1
      return match.replace(/<w:default w:val="([01])"\s*\/>/, `<w:default w:val="${isChecked ? '1' : '0'}"/>`)
    })
  }

  const filledRowsXml = String(params.documentXml || '').replace(/<w:tr[\s\S]*?<\/w:tr>/g, (rowXml) => {
    const hasCheckboxFields = /<w:instrText[^>]*>\s*FORMCHECKBOX\s*<\/w:instrText>/i.test(String(rowXml || ''))
    const rowPlainLabel = normalizeMatchValue(
      String(rowXml || '')
        .replace(/<w:instrText[^>]*>\s*FORMTEXT\s*<\/w:instrText>/g, ' ')
        .replace(/<w:instrText[^>]*>\s*FORMCHECKBOX\s*<\/w:instrText>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    if (rowPlainLabel.includes('contactpersoon re integratiebedrijf')) signatureRole = 'contact'
    else if (rowPlainLabel === 'client' || rowPlainLabel === 'klant' || rowPlainLabel.includes('client') || rowPlainLabel.includes('klant')) signatureRole = 'client'
    if (rowPlainLabel.includes('datum') && rowPlainLabel.includes('handtekening')) {
      pendingSignatureDateField = true
    }

    const numberKey = extractNumberKeyFromLabel(rowPlainLabel)
    if (numberKey) {
      activeNumberKey = numberKey
      if (numberKey !== '5.3') activityDistributionRowCursor = 0
    }
    const fieldPattern =
      /(<w:r[^>]*>[\s\S]*?<w:fldChar w:fldCharType="separate"\/>[\s\S]*?<\/w:r>)([\s\S]*?)(<w:r[^>]*>[\s\S]*?<w:fldChar w:fldCharType="end"\/>[\s\S]*?<\/w:r>)/g
    const fieldCount = (String(rowXml || '').match(/w:fldCharType="separate"/g) || []).length
    if (!rowPlainLabel && fieldCount === 0) return rowXml
    if (hasCheckboxFields) {
      return applyCheckboxSelection(
        rowXml,
        numberKey || activeNumberKey,
        params.contextValues || {},
        numberedValues,
      )
    }

    const inferredActivityDistributionRow =
      !numberKey && activeNumberKey === '5.3' && !rowPlainLabel && fieldCount >= 2 ? ++activityDistributionRowCursor : 0

    let fieldIndex = 0

    const replacedTextRow = rowXml.replace(fieldPattern, (_fullMatch, before, between, after) => {
        fieldIndex += 1
        const nextValue =
          pendingSignatureDateField && fieldIndex === 1
            ? formatCurrentDateNl()
            : pickValueForRowLabel({
                rowLabel: rowPlainLabel,
                templateKind: params.templateKind,
                numberKey,
                effectiveNumberKey: numberKey || activeNumberKey,
                fieldIndex,
                fieldCount,
                inferredRowIndex: inferredActivityDistributionRow,
                signatureRole,
                numberedValues,
                contextValues: params.contextValues,
              })
        if (pendingSignatureDateField && fieldIndex === 1) pendingSignatureDateField = false
        const runPropertiesXml =
          extractFieldTextRunPropertiesXml(between) ||
          extractFieldTextRunPropertiesXml(before) ||
          extractRunPropertiesXml(between) ||
          extractRunPropertiesXml(before)
        let replacementValue = nextValue
        if (
          !replacementValue &&
          activeNumberKey === '5.3' &&
          !numberKey &&
          !rowPlainLabel &&
          fieldCount === 1 &&
          fieldIndex === 1
        ) {
          replacementValue = getContextValue(
            params.contextValues || {},
            '5_3_totaal_aantal_begeleidingsuren',
            '7_3_totaal_aantal_begeleidingsuren',
          )
        }
        const replacementRuns = buildFieldReplacementRuns(replacementValue, runPropertiesXml)
        return `${before}${replacementRuns}${after}`
      })

    const cleanedRow = stripPlaceholderSpaceRuns(replacedTextRow)
    return applyCheckboxSelection(
      cleanedRow,
      numberKey || activeNumberKey,
      params.contextValues || {},
      numberedValues,
    )
  })

  const contactNameForRepair =
    getContextValue(
      params.contextValues || {},
      '3_5',
      '3.5',
      'naam_contactpersoon',
      'naam_contactpersoon_re_integratiebedrijf',
      '10_ondertekening_contactpersoon_re_integratiebedrijf_naam',
      '9_ondertekening_contactpersoon_re_integratiebedrijf_naam',
    ) || extractContactNameFromSignatureRows(filledRowsXml)

  if (!contactNameForRepair) return filledRowsXml

  return filledRowsXml.replace(/<w:tr[\s\S]*?<\/w:tr>/g, (rowXml) => {
    if (!/<w:t>3\.5<\/w:t>/.test(rowXml)) return rowXml
    if (!/<w:t>Naam contactpersoon<\/w:t>/.test(rowXml)) return rowXml
    if (/w:fldCharType="separate"/.test(rowXml)) return rowXml
    if (!/w:fldCharType="end"/.test(rowXml)) return rowXml
    return injectEndOnlyValueAfterMarker({
      rowXml,
      markerXml: '<w:t>Naam contactpersoon</w:t>',
      value: contactNameForRepair,
    })
  })
}

async function downloadFilledDocxTemplate(params: {
  sourcePath: string
  downloadFileName: string
  templateKind: UwvTemplateKind
  reportText: string
  contextValues?: Record<string, string | null | undefined>
}) {
  const response = await fetch(params.sourcePath)
  if (!response.ok) {
    throw new Error(`Template download failed (${response.status})`)
  }

  const templateBuffer = await response.arrayBuffer()
  const zip = new PizZip(templateBuffer)
  const placeholderValues = buildPlaceholderValueMap({
    templateKind: params.templateKind,
    reportText: params.reportText,
    contextValues: params.contextValues,
  })
  const templateData: Record<string, string> = {}
  for (const [key, value] of placeholderValues.entries()) {
    templateData[key] = String(value || '').replace(/\s+$/g, '')
  }
  const resolvedContextValues: Record<string, string> = {
    ...(params.contextValues || {}),
    ...templateData,
  }

  let renderedZip: PizZip = zip
  const documentXmlBeforeRender = zip.file('word/document.xml')?.asText() || ''
  const hasDocxtemplaterTags = documentXmlBeforeRender.includes('{{') && documentXmlBeforeRender.includes('}}')
  if (hasDocxtemplaterTags) {
    try {
      const doc = new Docxtemplater(zip, {
        delimiters: { start: '{{', end: '}}' },
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '',
      })
      doc.render(templateData)
      renderedZip = doc.getZip()
    } catch (error) {
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const documentXml = renderedZip.file('word/document.xml')?.asText()
  if (!documentXml) throw new Error('word/document.xml ontbreekt in template')
  const filledDocumentXml = fillDocumentXmlFormTextFields({
    documentXml,
    reportText: params.reportText,
    templateKind: params.templateKind,
    contextValues: resolvedContextValues,
  })
  renderedZip.file('word/document.xml', filledDocumentXml)

  const outputBlob = renderedZip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  const objectUrl = URL.createObjectURL(outputBlob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = params.downloadFileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export async function exportUwvTemplateWord(params: {
  templateName: string | null | undefined
  reportText: string
  contextValues?: Record<string, string | null | undefined>
}): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const sourceAsset = buildTemplateAssetFromName(params.templateName)
  if (!sourceAsset) return false

  const asset = Asset.fromModule(sourceAsset)
  if (!asset.localUri && !asset.uri) {
    await asset.downloadAsync()
  }
  const sourcePath = asset.localUri || asset.uri
  if (!sourcePath) throw new Error('Template asset uri unavailable')

  const downloadFileName =
    sourceAsset === eindrapportageWerkfitTemplate ? 'eindrapportage-werkfit-maken.docx' : 're-integratieplan-werkfit-maken .docx'
  const templateKind: UwvTemplateKind = sourceAsset === eindrapportageWerkfitTemplate ? 'eindrapportage' : 'reintegratieplan'
  await downloadFilledDocxTemplate({
    sourcePath,
    downloadFileName,
    templateKind,
    reportText: params.reportText,
    contextValues: params.contextValues,
  })
  return true
}
