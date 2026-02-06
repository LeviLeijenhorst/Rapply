import { LocalChatMessage } from '../services/chat'

function normalizeText(value: string | null | undefined) {
  return String(value || '').trim()
}

function formatDateLabel(unixMs: number) {
  return new Date(unixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function buildConversationTranscriptSystemMessages(params: { transcript: string | null }): LocalChatMessage[] {
  const transcript = normalizeText(params.transcript)
  const text = transcript
    ? `Hier is het transcript van het gesprek:\n\n${transcript}\n\nGebruik dit transcript om de vragen te beantwoorden.`
    : 'Er is nog geen transcript beschikbaar voor dit gesprek. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.'

  return [{ role: 'system', text }]
}

export function buildCoacheeSummariesSystemMessages(params: {
  coacheeName: string
  sessions: { title: string; createdAtUnixMs: number; summary: string | null }[]
}): LocalChatMessage[] {
  const sessionsWithSummary = params.sessions
    .map((session) => ({
      title: normalizeText(session.title) || 'Sessie',
      dateLabel: formatDateLabel(session.createdAtUnixMs),
      summary: normalizeText(session.summary),
    }))
    .filter((session) => session.summary.length > 0)

  const text = sessionsWithSummary.length
    ? `Hier zijn samenvattingen van eerdere gesprekken met ${params.coacheeName}:\n\n${sessionsWithSummary
        .map((session, index) => `${index + 1}. ${session.title} (${session.dateLabel})\n${session.summary}`)
        .join('\n\n')}\n\nGebruik deze samenvattingen om de vragen te beantwoorden.`
    : `Er zijn nog geen samenvattingen beschikbaar voor ${params.coacheeName}. Beantwoord vragen zo goed mogelijk op basis van wat de gebruiker typt.`

  return [{ role: 'system', text }]
}

