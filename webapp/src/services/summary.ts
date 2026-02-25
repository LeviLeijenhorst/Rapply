import { callSecureApi } from './secureApi'

type GenerateSummaryResponse = {
  summary?: string
}

type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

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

function mapLegacyTemplateSections(template: SummaryTemplate): SummaryTemplate {
  if (!isLegacyGenericSummarySections(template.sections)) return template
  const name = normalizeTemplateName(template.name)
  if (!name) return template

  if (name === 'intake' || name === 'intakeverslag') {
    return {
      ...template,
      sections: [
        { title: 'Clientgegevens', description: 'Naam, functie, eerste ziektedag en betrokken contactpersonen.' },
        { title: 'Probleemstelling', description: 'Feitelijke context van verzuim zonder medische diagnose.' },
        { title: 'Huidige situatie en belastbaarheid', description: 'Wat nu haalbaar is in werkbelasting en inzetbaarheid.' },
        { title: 'Eerdere inspanningen', description: 'Bestaande interventies en eerdere stappen in het traject.' },
        { title: 'Doelen en hulpvraag', description: 'Concreet doel en gewenste voortgang op korte termijn.' },
        { title: 'Afspraken vervolgtraject', description: 'Acties met datum of termijn en verantwoordelijke.' },
        { title: 'Ondertekening', description: 'Ruimte voor bevestiging door client en coach.' },
      ],
    }
  }

  if (name === 'voortgangsgesprek' || name === 'voortgangsgespreksverslag' || name === 'voortgangsrapportage') {
    return {
      ...template,
      sections: [
        { title: 'Datum en weeknummer', description: 'Leg de datum en WvP-context in weken vast.' },
        { title: 'Deelnemers', description: 'Wie aanwezig was bij het voortgangsgesprek.' },
        { title: 'Acties sinds vorig verslag', description: 'Welke acties sinds de vorige evaluatie zijn uitgevoerd.' },
        { title: 'Resultaten en voortgang', description: 'Wat aantoonbaar is bereikt sinds de vorige stap.' },
        { title: 'Belemmeringen', description: 'Nieuwe of aanhoudende knelpunten die voortgang beperken.' },
        { title: 'Aanpassingen en afspraken', description: 'Nieuwe acties met termijnen en verantwoordelijkheden.' },
        { title: 'Volgend gesprek', description: 'Plan een volgende evaluatiedatum of termijn.' },
        { title: 'Ondertekening', description: 'Ruimte voor bevestiging van besproken afspraken.' },
      ],
    }
  }

  if (
    name === 'terugkoppelingsrapportclient' ||
    name === 'terugkoppelingsrapportvoorclient' ||
    name === 'terugkoppelingclient' ||
    name === 'terugkoppelingsrapportwerknemer' ||
    name === 'terugkoppelingsrapportvoorwerknemer' ||
    name === 'terugkoppelingwerknemer'
  ) {
    return {
      ...template,
      sections: [
        { title: 'Samenvatting gesprek', description: 'Wat er is besproken in duidelijke taal.' },
        { title: 'Voortgang', description: 'Wat al is bereikt en wat nog aandacht vraagt.' },
        { title: 'Afspraken', description: 'Praktische afspraken en termijnen voor de komende periode.' },
        { title: 'Ondersteuning', description: 'Welke hulp of begeleiding beschikbaar is.' },
      ],
    }
  }

  return template
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

export async function generateSummary(params: { transcript: string; template?: SummaryTemplate; signal?: AbortSignal }): Promise<string> {
  const normalizedTemplate = params.template ? mapLegacyTemplateSections(params.template) : undefined
  let response: GenerateSummaryResponse | null = null
  for (let attempt = 0; attempt <= SUMMARY_MAX_RETRIES; attempt += 1) {
    try {
      response = await callSecureApi<GenerateSummaryResponse>(
        '/summary/generate',
        {
          transcript: params.transcript,
          template: normalizedTemplate,
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
