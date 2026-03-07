import { callSecureApi } from './secureApi'
import { normalizeStructuredSummary, parseStructuredSummaryJson, type StructuredSessionSummary } from '../utils/structuredSummary'

type GenerateSummaryResponse = {
  summary?: string
}
type SummaryResponseMode = 'markdown' | 'structured_item_summary'

type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

type SummaryTemplateSection = { title: string; description: string }

function normalizeTemplateName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function isLegacyGenericSummarySections(sections: { title: string; description: string }[]): boolean {
  if (sections.length !== 3) return false
  const normalizedTitles = sections.map((section) => normalizeTemplateName(section.title))
  return normalizedTitles[0] === 'situatie' && normalizedTitles[1] === 'analyse' && normalizedTitles[2] === 'adviesenvervolgstappen'
}

function mapLegacyTemplateSectionsByName(name: string): SummaryTemplateSection[] | null {
  if (!name) return null

  if (name === 'intake' || name === 'intakeverslag') {
    return [
      { title: 'Clientgegevens', description: 'Naam, functie, eerste ziektedag en betrokken contactpersonen.' },
      { title: 'Probleemstelling', description: 'Feitelijke context van verzuim zonder medische diagnose.' },
      { title: 'Huidige situatie en belastbaarheid', description: 'Wat nu haalbaar is in werkbelasting en inzetbaarheid.' },
      { title: 'Eerdere inspanningen', description: 'Bestaande interventies en eerdere stappen in het traject.' },
      { title: 'Doelen en hulpvraag', description: 'Concreet doel en gewenste voortgang op korte termijn.' },
      { title: 'Afspraken vervolgtraject', description: 'Acties met datum of termijn en verantwoordelijke.' },
      { title: 'Ondertekening', description: 'Ruimte voor bevestiging door client en coach.' },
    ]
  }

  if (name === 'voortgangsgesprek' || name === 'voortgangsgespreksverslag' || name === 'voortgangsrapportage') {
    return [
      { title: 'Datum en weeknummer', description: 'Leg de datum en WvP-context in weken vast.' },
      { title: 'Deelnemers', description: 'Wie aanwezig was bij het voortgangsgesprek.' },
      { title: 'Acties sinds vorig verslag', description: 'Welke acties sinds de vorige evaluatie zijn uitgevoerd.' },
      { title: 'Resultaten en voortgang', description: 'Wat aantoonbaar is bereikt sinds de vorige stap.' },
      { title: 'Belemmeringen', description: 'Nieuwe of aanhoudende knelpunten die voortgang beperken.' },
      { title: 'Aanpassingen en afspraken', description: 'Nieuwe acties met termijnen en verantwoordelijkheden.' },
      { title: 'Volgend gesprek', description: 'Plan een volgende evaluatiedatum of termijn.' },
      { title: 'Ondertekening', description: 'Ruimte voor bevestiging van besproken afspraken.' },
    ]
  }

  if (name === 'planvanaanpak') {
    return [
      { title: 'Algemene gegevens', description: 'Datum opstellen, eerste ziektedag, weeknummer en betrokken partijen.' },
      { title: 'Samenvatting probleemanalyse', description: 'Functionele mogelijkheden en relevante context zonder medische details.' },
      { title: 'Re-integratiedoel', description: 'Gezamenlijk doel voor werkhervatting of passend werk.' },
      { title: 'Concrete acties en interventies', description: 'Werkplek, begeleiding, training en andere maatregelen.' },
      { title: 'Verantwoordelijkheden en deadlines', description: 'Wie doet wat en voor welke datum.' },
      { title: 'Evaluatiemomenten', description: 'Frequentie en data voor voortgangsgesprekken.' },
      { title: 'Mening werknemer', description: 'Leg expliciet vast hoe werknemer de afspraken beoordeelt.' },
      { title: 'Ondertekening werkgever en werknemer', description: 'Verplichte ondertekening door beide partijen.' },
    ]
  }

  if (name === 'eerstejaarsevaluatie') {
    return [
      { title: 'Datum en weeknummer', description: 'Leg evaluatiedatum en fase in het traject vast.' },
      { title: 'Samenvatting inspanningen jaar 1', description: 'Kernoverzicht van genomen stappen en resultaten.' },
      { title: 'Beoordeling Plan van Aanpak', description: 'Wat is gehaald en wat niet, met toelichting.' },
      { title: 'Nieuwe afspraken', description: 'Acties voor de volgende periode met concrete planning.' },
      { title: 'Voorstel vervolgtraject', description: 'Besluit over eerste spoor of start tweede spoor.' },
      { title: 'Mening werknemer', description: 'Relevante reactie van werknemer op nieuwe afspraken.' },
      { title: 'Ondertekening werkgever en werknemer', description: 'Ondertekening door beide partijen.' },
    ]
  }

  if (name === 'tweedespoorrapportage' || name === 'tweedespoorplanrapport') {
    return [
      { title: 'Aanleiding tweede spoor', description: 'Waarom eerste spoor onvoldoende perspectief biedt.' },
      { title: 'Onderzoek en belastbaarheid', description: 'Relevante bevindingen over inzetbaarheid buiten eigen organisatie.' },
      { title: 'Arbeidsmarktactiviteiten', description: 'Sollicitaties, orientatie, scholing en netwerkacties met data.' },
      { title: 'Ondersteuning werkgever en arbodienst', description: 'Welke begeleiding en middelen zijn ingezet.' },
      { title: 'Plan en deadlines', description: 'Doelen, acties en planning voor het tweede spoor.' },
      { title: 'Resultaten en belemmeringen', description: 'Uitkomsten, reacties en resterende knelpunten.' },
      { title: 'Vervolgafspraken', description: 'Nieuwe acties met verantwoordelijken en termijnen.' },
      { title: 'Ondertekening', description: 'Ruimte voor bevestiging van afspraken.' },
    ]
  }

  if (name === 'eindevaluatie') {
    return [
      { title: 'Datum en weeknummer', description: 'Leg timing vast richting WIA-aanvraag.' },
      { title: 'Huidige situatie en belastbaarheid', description: 'Actuele status van inzetbaarheid en werkhervatting.' },
      { title: 'Samenvatting inspanningen', description: 'Overzicht van alle relevante stappen in het traject.' },
      { title: 'Actueel oordeel bedrijfsarts', description: 'Verwijs naar actueel oordeel en functionele mogelijkheden.' },
      { title: 'Evaluatie resultaten', description: 'Beoordeling van eerste en tweede spoor uitkomsten.' },
      { title: 'Conclusie en advies', description: 'Heldere conclusie en advies voor vervolg of WIA.' },
      { title: 'Bevestiging ontvangst werknemer', description: 'Leg vast dat werknemer een kopie heeft ontvangen.' },
      { title: 'Ondertekening werkgever en werknemer', description: 'Ondertekening door beide partijen.' },
    ]
  }

  if (name === 'adviesrapportaanwerkgever' || name === 'adviesrapportwerkgever') {
    return [
      { title: 'Samenvatting casus', description: 'Kern van de situatie en status van het traject.' },
      { title: 'Analyse', description: 'Relevante observaties en risico-inschatting voor vervolg.' },
      { title: 'Aanbevelingen', description: 'Concreet advies voor werkgever, met prioriteiten.' },
      { title: 'Vervolgstappen', description: 'Acties, timing en verantwoordelijken voor uitvoering.' },
    ]
  }

  if (
    name === 'terugkoppelingsrapportclient' ||
    name === 'terugkoppelingsrapportvoorclient' ||
    name === 'terugkoppelingclient' ||
    name === 'terugkoppelingsrapportwerknemer' ||
    name === 'terugkoppelingsrapportvoorwerknemer' ||
    name === 'terugkoppelingwerknemer'
  ) {
    return [
      { title: 'Samenvatting gesprek', description: 'Wat er is besproken in duidelijke taal.' },
      { title: 'Voortgang', description: 'Wat al is bereikt en wat nog aandacht vraagt.' },
      { title: 'Afspraken', description: 'Praktische afspraken en termijnen voor de komende periode.' },
      { title: 'Ondersteuning', description: 'Welke hulp of begeleiding beschikbaar is.' },
    ]
  }

  if (name === 'arbeidsdeskundigrapport') {
    return [
      { title: 'Onderzoeksvraag', description: 'Doel en scope van het arbeidsdeskundig onderzoek.' },
      { title: 'Belastbaarheid en mogelijkheden', description: 'Functionele mogelijkheden in relatie tot arbeid.' },
      { title: 'Passend werk en alternatieven', description: 'Mogelijkheden binnen en buiten de huidige organisatie.' },
      { title: 'Conclusie en advies', description: 'Onderbouwde conclusie met aanbevolen vervolgstappen.' },
    ]
  }

  return null
}

function mapUwvTemplateSectionsByName(name: string): SummaryTemplateSection[] | null {
  if (!name) return null
  if (name === 'reintegratieplanwerkfitmaken') {
    return [
      { title: '1.1 Voorletters en achternaam', description: 'Automatisch invullen uit clientgegevens.' },
      { title: '1.2 Burgerservicenummer', description: 'Automatisch invullen uit clientgegevens.' },
      { title: '2.1 Naam contactpersoon UWV', description: 'Automatisch invullen uit clientgegevens/zaakgegevens.' },
      { title: '3.1 Naam organisatie', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.2 Bezoekadres', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.3 Postadres', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.4 Postcode en plaats', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.5 Naam contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.6 Functie contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.7 Telefoonnummer contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.8 E-mailadres contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '4.1 Wat is het ordernummer?', description: 'Automatisch invullen uit clientgegevens/organisatiegegevens.' },
      { title: '5.1 Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?', description: 'Open vraag.' },
      { title: '5.2 Beschrijving van de activiteiten en het gewenste resultaat', description: 'Open vraag.' },
      { title: '5.3 Hoe verdeelt U de begeleidingsuren over de re-integratieactiviteiten?', description: 'Open vraag.' },
      { title: '5.4 Wanneer begint de eerste re-integratieactiviteit?', description: 'Open vraag.' },
      { title: '5.5 Afspraken en inspanningen van beide partijen', description: 'Open vraag.' },
      { title: '5.6 Als U met de invulling van de re-integratieactiviteiten afwijkt van het werkplan of Plan van aanpak, geef aan op welke onderdelen U ervan afwijkt en waarom.', description: 'Open vraag.' },
      { title: '6.1 Wat is de maximale individuele doorlooptijd van de re-integratiedienst?', description: 'Open vraag.' },
      { title: '7.1 Wat verwacht de cliënt van de inzet en het resultaat van de re-integratiedienst? En van de begeleiding door uw organisatie?', description: 'Open vraag.' },
      { title: '7.2 Wat is uw visie op de re-integratiemogelijkheden van de cliënt?', description: 'Open vraag.' },
      { title: '7.3 Wat verwacht de cliënt van de inzet en het resultaat van de re-integratiedienst?', description: 'Open vraag.' },
      { title: '8.1 Is er sprake van specialistisch uurtarief?', description: 'Open vraag.' },
      { title: '8.2 Motiveer welke specialistische expertise voor de cliënt nodig is en hoeveel uren u adviseert.', description: 'Open vraag.' },
      { title: '8.3 Wat is het in rekening te brengen (hogere) uurtarief voor de specialistische expertise? Motiveer waarom dit tarief noodzakelijk is.', description: 'Open vraag.' },
      { title: '9 Rechten en plichten', description: 'Open vraag.' },
      { title: '10 Ondertekening contactpersoon re-integratiebedrijf - naam', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '10 Ondertekening contactpersoon re-integratiebedrijf - datum en handtekening', description: 'Open invulveld.' },
      { title: '10 Ondertekening client - naam', description: 'Automatisch invullen uit clientgegevens.' },
      { title: '10 Ondertekening client - datum en handtekening', description: 'Open invulveld.' },
    ]
  }
  if (name === 'eindrapportagewerkfitmaken') {
    return [
      { title: '1.1 Voorletters en achternaam', description: 'Automatisch invullen uit clientgegevens.' },
      { title: '1.2 Burgerservicenummer', description: 'Automatisch invullen uit clientgegevens.' },
      { title: '2.1 Naam contactpersoon UWV', description: 'Automatisch invullen uit clientgegevens/zaakgegevens.' },
      { title: '3.1 Naam organisatie', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.2 Naam contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.3 Functie contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.4 Telefoonnummer contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '3.5 E-mailadres contactpersoon', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '4.1 Wat is het ordernummer?', description: 'Automatisch invullen uit clientgegevens/organisatiegegevens.' },
      { title: '5.1 Reden beeindiging naar aanleiding van evaluatiemoment', description: 'Open vraag.' },
      { title: '5.2 Advies voor vervolg van de dienstverlening', description: 'Open vraag.' },
      { title: '6.1 Reden van de voortijdige terugmelding', description: 'Open vraag.' },
      { title: '6.2 Toelichting op reden voortijdige terugmelding', description: 'Open vraag.' },
      { title: '6.3 Met wie bij UWV is de voortijdige terugmelding besproken?', description: 'Open vraag.' },
      { title: '7.1 Uitgevoerde re-integratieactiviteiten en ingezette begeleidingsuren', description: 'Open vraag.' },
      { title: '7.2 Welke vorderingen heeft de klant gemaakt?', description: 'Open vraag.' },
      { title: '7.3 Wat is het bereikte resultaat?', description: 'Open vraag.' },
      { title: '7.4 Onderbouwing werkfit of niet werkfit', description: 'Open vraag.' },
      { title: '7.5 Is de klant naar eigen mening werkfit? Waaruit blijkt dat?', description: 'Open vraag.' },
      { title: '7.6 Vervolgadvies en benodigde bemiddeling/begeleiding', description: 'Open vraag.' },
      { title: '7.7 Toelichting op het advies', description: 'Open vraag.' },
      { title: '7.8 Wat vindt de klant van dit advies?', description: 'Open vraag.' },
      { title: '8.1 Hoe heeft de klant de ingezette re-integratieactiviteiten ervaren?', description: 'Open vraag.' },
      { title: '8.2 Is de klant akkoord met de ingezette en verantwoorde begeleidingsuren?', description: 'Open vraag.' },
      { title: '9 Ondertekening contactpersoon re-integratiebedrijf - naam', description: 'Automatisch invullen uit organisatiegegevens.' },
      { title: '9 Ondertekening contactpersoon re-integratiebedrijf - datum en handtekening', description: 'Open invulveld.' },
      { title: '9 Ondertekening klant - naam', description: 'Automatisch invullen uit clientgegevens.' },
      { title: '9 Ondertekening klant - datum en handtekening', description: 'Open invulveld.' },
    ]
  }
  return null
}

export function normalizeSummaryTemplate(template: SummaryTemplate): SummaryTemplate {
  const uwvSections = mapUwvTemplateSectionsByName(normalizeTemplateName(template.name))
  if (uwvSections) return { ...template, sections: uwvSections }
  if (!isLegacyGenericSummarySections(template.sections)) return template
  const sections = mapLegacyTemplateSectionsByName(normalizeTemplateName(template.name))
  if (!sections) return template
  return { ...template, sections }
}

const SUMMARY_TIMEOUT_MS = 5 * 60_000
const SUMMARY_MAX_RETRIES = 1

function isRetryableSummaryError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || '').toLowerCase()
  if (!message) return false
  return (
    message.includes('de server reageert niet op tijd') ||
    message.includes('kon geen verbinding maken met de server') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('api error: 5') ||
    message.includes('api error: 429') ||
    message.includes('timeout')
  )
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function generateSummary(params: {
  transcript: string
  template?: SummaryTemplate
  signal?: AbortSignal
  responseMode?: SummaryResponseMode
}): Promise<string> {
  const normalizedTemplate = params.template ? normalizeSummaryTemplate(params.template) : undefined
  const responseMode: SummaryResponseMode = params.responseMode === 'structured_item_summary' ? 'structured_item_summary' : 'markdown'
  let response: GenerateSummaryResponse | null = null
  for (let attempt = 0; attempt <= SUMMARY_MAX_RETRIES; attempt += 1) {
    try {
      response = await callSecureApi<GenerateSummaryResponse>(
        '/summary/generate',
        {
          transcript: params.transcript,
          template: normalizedTemplate,
          responseMode,
        },
        { signal: params.signal, timeoutMs: SUMMARY_TIMEOUT_MS },
      )
      break
    } catch (error) {
      if (params.signal?.aborted) throw error
      if (attempt >= SUMMARY_MAX_RETRIES || !isRetryableSummaryError(error)) throw error
      await wait(300 * (attempt + 1))
    }
  }
  if (!response) {
    throw new Error('No summary returned')
  }

  const summary = String(response.summary || '').trim()
  if (!summary) {
    throw new Error('No summary returned')
  }
  return summary
}

export async function generateStructuredSummary(params: {
  transcript: string
  signal?: AbortSignal
}): Promise<StructuredSessionSummary> {
  const raw = await generateSummary({
    transcript: params.transcript,
    signal: params.signal,
    responseMode: 'structured_item_summary',
  })
  console.log('[STRUCTURED_SUMMARY_RAW_RESPONSE]', {
    rawLength: raw.length,
    raw,
  })
  const parsed = parseStructuredSummaryJson(raw)
  if (!parsed) {
    console.log('[STRUCTURED_SUMMARY_PARSE_FAILED]', {
      reason: 'parseStructuredSummaryJson returned null',
      raw,
    })
    throw new Error('No structured summary returned')
  }
  const normalized = normalizeStructuredSummary(parsed)
  console.log('[STRUCTURED_SUMMARY_PARSED]', {
    parsed,
    normalized,
  })
  return normalized
}
