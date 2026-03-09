import type { LocalChatMessage } from '../api/chat/types'
import { formatCoacheeDetailsForPrompt, formatEmployerDetailsForPrompt } from '../types/clientProfile'

function normalizeText(value: string | null | undefined) {
  return String(value || '').trim()
}

function formatDateLabel(unixMs: number) {
  return new Date(unixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function buildConversationTranscriptSystemMessages(params: {
  transcript: string | null
  writtenReportText?: string | null
  sessionId?: string
}): LocalChatMessage[] {
  const transcript = normalizeText(params.transcript)
  const writtenReport = normalizeText(params.writtenReportText)
  const sessionId = normalizeText(params.sessionId)
  const scopeHeader = sessionId
    ? `[COACHSCRIBE_SESSION_SCOPE]\nSession-ID: ${sessionId}\nGebruik uitsluitend context uit dit verslag.`
    : 'Gebruik uitsluitend context uit dit verslag.'
  const contextBlocks: string[] = []
  if (transcript) {
    contextBlocks.push(`Transcript van het gesprek:\n\n${transcript}`)
  }
  if (writtenReport) {
    contextBlocks.push(`Geschreven verslag van dit gesprek:\n\n${writtenReport}`)
  }

  const text = contextBlocks.length
    ? `${scopeHeader}\n\nHier is de verslagcontext:\n\n${contextBlocks.join('\n\n')}\n\nGebruik uitsluitend deze context om de vragen te beantwoorden.`
    : `${scopeHeader}\n\nEr is nog geen transcript of geschreven verslag beschikbaar voor dit verslag. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

  return [{ role: 'system', text }]
}

export function buildCoacheeSummariesSystemMessages(params: {
  coacheeName: string
  sessions: { title: string; createdAtUnixMs: number; summary: string | null }[]
  maxTotalCharacters?: number
  maxSummaryCharactersPerSession?: number
  maxSessions?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 45000)
  const maxSummaryCharactersPerSession = Math.max(500, params.maxSummaryCharactersPerSession ?? 2500)
  const maxSessions = Math.max(1, params.maxSessions ?? 80)

  const sortedSessions = [...params.sessions].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  const included: Array<{ title: string; dateLabel: string; summary: string }> = []
  let totalCharacters = 0
  let isTruncated = false

  for (const session of sortedSessions) {
    if (included.length >= maxSessions) {
      isTruncated = true
      break
    }
    if (totalCharacters >= maxTotalCharacters) {
      isTruncated = true
      break
    }

    const summary = normalizeText(session.summary)
    if (!summary) continue

    const clippedSummary = summary.length > maxSummaryCharactersPerSession ? summary.slice(0, maxSummaryCharactersPerSession) : summary
    const nextTotal = totalCharacters + clippedSummary.length
    if (nextTotal > maxTotalCharacters) {
      isTruncated = true
      break
    }

    included.push({
      title: normalizeText(session.title) || 'Verslag',
      dateLabel: formatDateLabel(session.createdAtUnixMs),
      summary: clippedSummary,
    })
    totalCharacters = nextTotal
  }

  const text = included.length
    ? `Hier zijn samenvattingen van eerdere gesprekken met ${params.coacheeName}:\n\n${included
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.summary}`)
        .join('\n\n')}${isTruncated ? '\n\nLet op: niet alle samenvattingen passen in de context. Oudere samenvattingen zijn weggelaten.' : ''}\n\nGebruik deze samenvattingen om de vragen te beantwoorden.`
    : `Er zijn nog geen samenvattingen beschikbaar voor ${params.coacheeName}. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

  return [{ role: 'system', text }]
}

export function buildCoacheeTranscriptsSystemMessages(params: {
  coacheeName: string
  sessions: { title: string; createdAtUnixMs: number; transcript: string | null }[]
  maxTotalCharacters?: number
  maxTranscriptCharactersPerSession?: number
  maxSessions?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 60000)
  const maxTranscriptCharactersPerSession = Math.max(1000, params.maxTranscriptCharactersPerSession ?? 8000)
  const maxSessions = Math.max(1, params.maxSessions ?? 50)

  const sortedSessions = [...params.sessions].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)

  const included: Array<{ title: string; dateLabel: string; transcript: string }> = []
  let totalCharacters = 0
  let isTruncated = false

  for (const session of sortedSessions) {
    if (included.length >= maxSessions) {
      isTruncated = true
      break
    }
    if (totalCharacters >= maxTotalCharacters) {
      isTruncated = true
      break
    }
    const transcript = normalizeText(session.transcript)
    if (!transcript) continue

    const clippedTranscript = transcript.length > maxTranscriptCharactersPerSession ? transcript.slice(0, maxTranscriptCharactersPerSession) : transcript
    const nextTotal = totalCharacters + clippedTranscript.length
    if (nextTotal > maxTotalCharacters) {
      isTruncated = true
      break
    }

    included.push({
      title: normalizeText(session.title) || 'Verslag',
      dateLabel: formatDateLabel(session.createdAtUnixMs),
      transcript: clippedTranscript,
    })
    totalCharacters = nextTotal
  }

  const text = included.length
    ? `Hier zijn transcripties van gesprekken met ${params.coacheeName}:\n\n${included
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.transcript}`)
        .join('\n\n')}${isTruncated ? '\n\nLet op: niet alle transcripties passen in de context. Oudere transcripties zijn weggelaten.' : ''}\n\nGebruik deze transcripties om de vragen te beantwoorden.`
    : `Er zijn nog geen transcripties beschikbaar voor ${params.coacheeName}. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

  return [{ role: 'system', text }]
}

export function buildCoacheeWrittenReportsSystemMessages(params: {
  coacheeName: string
  sessions: { title: string; createdAtUnixMs: number; reportText: string | null }[]
  maxTotalCharacters?: number
  maxReportCharactersPerSession?: number
  maxSessions?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 60000)
  const maxReportCharactersPerSession = Math.max(500, params.maxReportCharactersPerSession ?? 5000)
  const maxSessions = Math.max(1, params.maxSessions ?? 80)

  const sortedSessions = [...params.sessions].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  const included: Array<{ title: string; dateLabel: string; reportText: string }> = []
  let totalCharacters = 0
  let isTruncated = false

  for (const session of sortedSessions) {
    if (included.length >= maxSessions || totalCharacters >= maxTotalCharacters) {
      isTruncated = true
      break
    }

    const reportText = normalizeText(session.reportText)
    if (!reportText) continue

    const clippedReport = reportText.length > maxReportCharactersPerSession ? reportText.slice(0, maxReportCharactersPerSession) : reportText
    const nextTotal = totalCharacters + clippedReport.length
    if (nextTotal > maxTotalCharacters) {
      isTruncated = true
      break
    }

    included.push({
      title: normalizeText(session.title) || 'Verslag',
      dateLabel: formatDateLabel(session.createdAtUnixMs),
      reportText: clippedReport,
    })
    totalCharacters = nextTotal
  }

  const text = included.length
    ? `Hier zijn geschreven verslagen van gesprekken met ${params.coacheeName}:\n\n${included
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.reportText}`)
        .join('\n\n')}${isTruncated ? '\n\nLet op: niet alle verslagen passen in de context. Oudere verslagen zijn weggelaten.' : ''}\n\nGebruik deze verslagen om de vragen te beantwoorden.`
    : `Er zijn nog geen geschreven verslagen beschikbaar voor ${params.coacheeName}.`

  return [{ role: 'system', text }]
}

export function buildCoacheeStructuredSystemMessages(params: {
  coacheeName: string
  coacheeCreatedAtUnixMs?: number | null
  clientDetails?: string | null
  employerDetails?: string | null
  firstSickDay?: string | null
  includeSessionReports?: boolean
  sessions: {
    title: string
    createdAtUnixMs: number
    summary: string | null
    reportText: string | null
    reportDate?: string | null
    wvpWeekNumber?: string | null
    reportFirstSickDay?: string | null
  }[]
  maxTotalCharacters?: number
  maxSessionCharacters?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1500, params.maxTotalCharacters ?? 60000)
  const maxSessionCharacters = Math.max(700, params.maxSessionCharacters ?? 3500)
  const includeSessionReports = params.includeSessionReports !== false
  const sortedSessions = [...params.sessions].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  const basicInfoParts: string[] = []
  const parsedClientDetails = formatCoacheeDetailsForPrompt(params.clientDetails)
  const parsedEmployerDetails = formatEmployerDetailsForPrompt(params.employerDetails)
  const normalizedFirstSickDay = normalizeText(params.firstSickDay)

  basicInfoParts.push(...parsedClientDetails)
  basicInfoParts.push(...parsedEmployerDetails)
  if (!parsedClientDetails.length && normalizeText(params.clientDetails)) basicInfoParts.push(`Cliëntgegevens: ${normalizeText(params.clientDetails)}`)
  if (!parsedEmployerDetails.length && normalizeText(params.employerDetails)) basicInfoParts.push(`Werkgeversgegevens: ${normalizeText(params.employerDetails)}`)
  if (normalizedFirstSickDay) basicInfoParts.push(`Eerste ziektedag: ${normalizedFirstSickDay}`)
  if (Number.isFinite(params.coacheeCreatedAtUnixMs)) {
    basicInfoParts.push(`Cliënt aangemaakt: ${formatDateLabel(Number(params.coacheeCreatedAtUnixMs))}`)
  }

  const intakeSession =
    sortedSessions.find((session) => {
      const title = normalizeText(session.title).toLowerCase()
      const hasContent = Boolean(normalizeText(session.reportText) || normalizeText(session.summary))
      return hasContent && (title === 'intake' || title.includes('intake'))
    }) ?? null

  const otherSessions = intakeSession ? sortedSessions.filter((session) => session !== intakeSession) : sortedSessions
  let remainingCharacters = maxTotalCharacters

  const basicInfoText =
    basicInfoParts.length > 0
      ? basicInfoParts.join('\n')
      : 'Nog geen basisgegevens vastgelegd.'
  remainingCharacters -= basicInfoText.length

  const formatSessionContextLine = (session: {
    createdAtUnixMs: number
    reportDate?: string | null
    wvpWeekNumber?: string | null
    reportFirstSickDay?: string | null
  }) => {
    const parts = [`Gespreksdatum: ${formatDateLabel(session.createdAtUnixMs)}`]
    if (normalizeText(session.reportDate)) parts.push(`Rapportdatum: ${normalizeText(session.reportDate)}`)
    if (normalizeText(session.wvpWeekNumber)) parts.push(`WvP-weeknummer: ${normalizeText(session.wvpWeekNumber)}`)
    if (normalizeText(session.reportFirstSickDay)) parts.push(`Eerste ziektedag (verslag): ${normalizeText(session.reportFirstSickDay)}`)
    return parts.join(' | ')
  }

  const formatSessionBlock = (session: {
    title: string
    createdAtUnixMs: number
    summary: string | null
    reportText: string | null
    reportDate?: string | null
    wvpWeekNumber?: string | null
    reportFirstSickDay?: string | null
  }): string => {
    const title = normalizeText(session.title) || 'Verslag'
    const reportText = normalizeText(session.reportText)
    const summary = normalizeText(session.summary)
    const content = reportText || summary
    const sourceLabel = reportText ? 'Geschreven verslag' : 'Samenvatting'
    const clippedContent = content.length > maxSessionCharacters ? content.slice(0, maxSessionCharacters) : content
    return `${title}\n${formatSessionContextLine(session)}\nBron: ${sourceLabel}\n${clippedContent}`
  }

  let intakeBlock = 'Geen intakeverslag beschikbaar.'
  if (includeSessionReports) {
    if (intakeSession) {
      const block = formatSessionBlock(intakeSession)
      if (remainingCharacters > 0) {
        intakeBlock = block.slice(0, Math.max(0, remainingCharacters))
        remainingCharacters -= intakeBlock.length
      }
    }
  }

  const includedOtherBlocks: string[] = []
  if (includeSessionReports) {
    for (const session of otherSessions) {
      if (remainingCharacters <= 0) break
      const hasContent = Boolean(normalizeText(session.reportText) || normalizeText(session.summary))
      if (!hasContent) continue
      const block = formatSessionBlock(session)
      const clipped = block.slice(0, Math.max(0, remainingCharacters))
      if (!clipped.trim()) continue
      includedOtherBlocks.push(clipped)
      remainingCharacters -= clipped.length
    }
  }

  const otherReportsText =
    includedOtherBlocks.length > 0
      ? includedOtherBlocks.map((block, index) => `${index + 1}. ${block}`).join('\n\n')
      : includeSessionReports
        ? 'Geen andere verslagen met inhoud beschikbaar.'
        : 'Gespreksverslagen zijn niet opgenomen in deze context.'

  const text = includeSessionReports
    ? `Dossiercontext voor ${params.coacheeName}:

1. Basisgegevens
${basicInfoText}

2. Intakeverslag
${intakeBlock}

3. Overige verslagen (nieuw naar oud)
${otherReportsText}

Gebruik deze structuur en context om de vragen te beantwoorden.`
    : `Dossiercontext voor ${params.coacheeName}:

1. Basisgegevens
${basicInfoText}

2. Gespreksverslagen
${otherReportsText}

Gebruik uitsluitend de basisgegevens in deze context om de vragen te beantwoorden.`

  return [{ role: 'system', text }]
}

