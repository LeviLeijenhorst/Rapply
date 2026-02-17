import { LocalChatMessage } from '../services/chat'

function normalizeText(value: string | null | undefined) {
  return String(value || '').trim()
}

function formatDateLabel(unixMs: number) {
  return new Date(unixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function buildConversationTranscriptSystemMessages(params: { transcript: string | null; sessionId?: string }): LocalChatMessage[] {
  const transcript = normalizeText(params.transcript)
  const sessionId = normalizeText(params.sessionId)
  const scopeHeader = sessionId
    ? `[COACHSCRIBE_SESSION_SCOPE]\nSession-ID: ${sessionId}\nGebruik uitsluitend context uit deze sessie.`
    : 'Gebruik uitsluitend context uit deze sessie.'
  const text = transcript
    ? `${scopeHeader}\n\nHier is het transcript van het gesprek:\n\n${transcript}\n\nGebruik dit transcript om de vragen te beantwoorden.`
    : `${scopeHeader}\n\nEr is nog geen transcript beschikbaar voor dit gesprek. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

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
      title: normalizeText(session.title) || 'Sessie',
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
      title: normalizeText(session.title) || 'Sessie',
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

