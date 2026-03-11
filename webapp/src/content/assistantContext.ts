import type { LocalChatMessage } from '../api/chat/types'
import { formatClientDetailsForPrompt, formatEmployerDetailsForPrompt } from '../types/clientProfile'

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
    ? `[COACHSCRIBE_SESSION_SCOPE]\nInput-ID: ${sessionId}\nGebruik uitsluitend context uit dit verslag.`
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

export function buildClientSummariesSystemMessages(params: {
  clientName: string
  inputs: { title: string; createdAtUnixMs: number; summary: string | null }[]
  maxTotalCharacters?: number
  maxSummaryCharactersPerInput?: number
  maxInputs?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 45000)
  const maxSummaryCharactersPerInput = Math.max(500, params.maxSummaryCharactersPerInput ?? 2500)
  const maxInputs = Math.max(1, params.maxInputs ?? 80)

  const sortedInputs = [...params.inputs].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  const included: Array<{ title: string; dateLabel: string; summary: string }> = []
  let totalCharacters = 0
  let isTruncated = false

  for (const session of sortedInputs) {
    if (included.length >= maxInputs) {
      isTruncated = true
      break
    }
    if (totalCharacters >= maxTotalCharacters) {
      isTruncated = true
      break
    }

    const summary = normalizeText(session.summary)
    if (!summary) continue

    const clippedSummary = summary.length > maxSummaryCharactersPerInput ? summary.slice(0, maxSummaryCharactersPerInput) : summary
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
    ? `Hier zijn samenvattingen van eerdere gesprekken met ${params.clientName}:\n\n${included
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.summary}`)
        .join('\n\n')}${isTruncated ? '\n\nLet op: niet alle samenvattingen passen in de context. Oudere samenvattingen zijn weggelaten.' : ''}\n\nGebruik deze samenvattingen om de vragen te beantwoorden.`
    : `Er zijn nog geen samenvattingen beschikbaar voor ${params.clientName}. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

  return [{ role: 'system', text }]
}

export function buildClientTranscriptsSystemMessages(params: {
  clientName: string
  inputs: { title: string; createdAtUnixMs: number; transcript: string | null }[]
  maxTotalCharacters?: number
  maxTranscriptCharactersPerInput?: number
  maxInputs?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 60000)
  const maxTranscriptCharactersPerInput = Math.max(1000, params.maxTranscriptCharactersPerInput ?? 8000)
  const maxInputs = Math.max(1, params.maxInputs ?? 50)

  const sortedInputs = [...params.inputs].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)

  const included: Array<{ title: string; dateLabel: string; transcript: string }> = []
  let totalCharacters = 0
  let isTruncated = false

  for (const session of sortedInputs) {
    if (included.length >= maxInputs) {
      isTruncated = true
      break
    }
    if (totalCharacters >= maxTotalCharacters) {
      isTruncated = true
      break
    }
    const transcript = normalizeText(session.transcript)
    if (!transcript) continue

    const clippedTranscript = transcript.length > maxTranscriptCharactersPerInput ? transcript.slice(0, maxTranscriptCharactersPerInput) : transcript
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
    ? `Hier zijn transcripties van gesprekken met ${params.clientName}:\n\n${included
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.transcript}`)
        .join('\n\n')}${isTruncated ? '\n\nLet op: niet alle transcripties passen in de context. Oudere transcripties zijn weggelaten.' : ''}\n\nGebruik deze transcripties om de vragen te beantwoorden.`
    : `Er zijn nog geen transcripties beschikbaar voor ${params.clientName}. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

  return [{ role: 'system', text }]
}

export function buildClientWrittenReportsSystemMessages(params: {
  clientName: string
  inputs: { title: string; createdAtUnixMs: number; reportText: string | null }[]
  maxTotalCharacters?: number
  maxReportCharactersPerInput?: number
  maxInputs?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1000, params.maxTotalCharacters ?? 60000)
  const maxReportCharactersPerInput = Math.max(500, params.maxReportCharactersPerInput ?? 5000)
  const maxInputs = Math.max(1, params.maxInputs ?? 80)

  const sortedInputs = [...params.inputs].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  const included: Array<{ title: string; dateLabel: string; reportText: string }> = []
  let totalCharacters = 0
  let isTruncated = false

  for (const session of sortedInputs) {
    if (included.length >= maxInputs || totalCharacters >= maxTotalCharacters) {
      isTruncated = true
      break
    }

    const reportText = normalizeText(session.reportText)
    if (!reportText) continue

    const clippedReport = reportText.length > maxReportCharactersPerInput ? reportText.slice(0, maxReportCharactersPerInput) : reportText
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
    ? `Hier zijn geschreven verslagen van gesprekken met ${params.clientName}:\n\n${included
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.reportText}`)
        .join('\n\n')}${isTruncated ? '\n\nLet op: niet alle verslagen passen in de context. Oudere verslagen zijn weggelaten.' : ''}\n\nGebruik deze verslagen om de vragen te beantwoorden.`
    : `Er zijn nog geen geschreven verslagen beschikbaar voor ${params.clientName}.`

  return [{ role: 'system', text }]
}

export function buildClientStructuredSystemMessages(params: {
  clientName: string
  clientCreatedAtUnixMs?: number | null
  clientDetails?: string | null
  employerDetails?: string | null
  includeInputReports?: boolean
  inputs: {
    title: string
    createdAtUnixMs: number
    summary: string | null
    reportText: string | null
    reportDate?: string | null
  }[]
  snippets?: {
    sessionId: string
    field: string
    text: string
  }[]
  maxTotalCharacters?: number
  maxInputCharacters?: number
}): LocalChatMessage[] {
  const maxTotalCharacters = Math.max(1500, params.maxTotalCharacters ?? 60000)
  const maxInputCharacters = Math.max(700, params.maxInputCharacters ?? 3500)
  const includeInputReports = params.includeInputReports !== false
  const sortedInputs = [...params.inputs].sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  const basicInfoParts: string[] = []
  const parsedClientDetails = formatClientDetailsForPrompt(params.clientDetails)
  const parsedEmployerDetails = formatEmployerDetailsForPrompt(params.employerDetails)

  basicInfoParts.push(...parsedClientDetails)
  basicInfoParts.push(...parsedEmployerDetails)
  if (!parsedClientDetails.length && normalizeText(params.clientDetails)) basicInfoParts.push(`Cliëntgegevens: ${normalizeText(params.clientDetails)}`)
  if (!parsedEmployerDetails.length && normalizeText(params.employerDetails)) basicInfoParts.push(`Werkgeversgegevens: ${normalizeText(params.employerDetails)}`)
  if (Number.isFinite(params.clientCreatedAtUnixMs)) {
    basicInfoParts.push(`Cliënt aangemaakt: ${formatDateLabel(Number(params.clientCreatedAtUnixMs))}`)
  }

  const intakeInput =
    sortedInputs.find((session) => {
      const title = normalizeText(session.title).toLowerCase()
      const hasContent = Boolean(normalizeText(session.reportText) || normalizeText(session.summary))
      return hasContent && (title === 'intake' || title.includes('intake'))
    }) ?? null

  const otherInputs = intakeInput ? sortedInputs.filter((session) => session !== intakeInput) : sortedInputs
  let remainingCharacters = maxTotalCharacters

  const basicInfoText =
    basicInfoParts.length > 0
      ? basicInfoParts.join('\n')
      : 'Nog geen basisgegevens vastgelegd.'
  remainingCharacters -= basicInfoText.length

  const formatInputContextLine = (session: {
    createdAtUnixMs: number
    reportDate?: string | null
  }) => {
    const parts = [`Gespreksdatum: ${formatDateLabel(session.createdAtUnixMs)}`]
    if (normalizeText(session.reportDate)) parts.push(`Rapportdatum: ${normalizeText(session.reportDate)}`)
    return parts.join(' | ')
  }

  const formatInputBlock = (session: {
    title: string
    createdAtUnixMs: number
    summary: string | null
    reportText: string | null
    reportDate?: string | null
  }): string => {
    const title = normalizeText(session.title) || 'Verslag'
    const reportText = normalizeText(session.reportText)
    const summary = normalizeText(session.summary)
    const content = reportText || summary
    const sourceLabel = reportText ? 'Geschreven verslag' : 'Samenvatting'
    const clippedContent = content.length > maxInputCharacters ? content.slice(0, maxInputCharacters) : content
    return `${title}\n${formatInputContextLine(session)}\nBron: ${sourceLabel}\n${clippedContent}`
  }

  let intakeBlock = 'Geen intakeverslag beschikbaar.'
  if (includeInputReports) {
    if (intakeInput) {
      const block = formatInputBlock(intakeInput)
      if (remainingCharacters > 0) {
        intakeBlock = block.slice(0, Math.max(0, remainingCharacters))
        remainingCharacters -= intakeBlock.length
      }
    }
  }

  const includedOtherBlocks: string[] = []
  if (includeInputReports) {
    for (const session of otherInputs) {
      if (remainingCharacters <= 0) break
      const hasContent = Boolean(normalizeText(session.reportText) || normalizeText(session.summary))
      if (!hasContent) continue
      const block = formatInputBlock(session)
      const clipped = block.slice(0, Math.max(0, remainingCharacters))
      if (!clipped.trim()) continue
      includedOtherBlocks.push(clipped)
      remainingCharacters -= clipped.length
    }
  }

  const otherReportsText =
    includedOtherBlocks.length > 0
      ? includedOtherBlocks.map((block, index) => `${index + 1}. ${block}`).join('\n\n')
      : includeInputReports
        ? 'Geen andere verslagen met inhoud beschikbaar.'
        : 'Gespreksverslagen zijn niet opgenomen in deze context.'

  const snippetsByInput = new Map<string, string[]>()
  for (const snippet of Array.isArray(params.snippets) ? params.snippets : []) {
    const sessionId = normalizeText(snippet.sessionId) || 'onbekende_sessie'
    const field = normalizeText(snippet.field)
    const text = normalizeText(snippet.text)
    if (!text) continue
    const lines = snippetsByInput.get(sessionId) ?? []
    lines.push(field ? `[${field}] ${text}` : text)
    snippetsByInput.set(sessionId, lines)
  }
  const snippetKnowledgeText =
    snippetsByInput.size > 0
      ? [...snippetsByInput.entries()]
          .map(([sessionId, lines]) => `Sessie ${sessionId}\n${lines.map((line) => `- ${line}`).join('\n')}`)
          .join('\n\n')
      : 'Geen goedgekeurde snippets beschikbaar.'

  const text = includeInputReports
    ? `Dossiercontext voor ${params.clientName}:

1. Basisgegevens
${basicInfoText}

2. Intakeverslag
${intakeBlock}

3. Overige verslagen (nieuw naar oud)
${otherReportsText}

4. Snippet-kennis (gegroepeerd per sessie)
${snippetKnowledgeText}

Gebruik deze structuur en context om de vragen te beantwoorden.`
    : `Dossiercontext voor ${params.clientName}:

1. Basisgegevens
${basicInfoText}

2. Gespreksverslagen
${otherReportsText}

3. Snippet-kennis (gegroepeerd per sessie)
${snippetKnowledgeText}

Gebruik uitsluitend de basisgegevens in deze context om de vragen te beantwoorden.`

  return [{ role: 'system', text }]
}
