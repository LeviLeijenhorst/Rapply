const CONTENT_FILTER_HINTS = [
  'content_filter',
  'responsibleaipolicyviolation',
  'content management policy',
  'response was filtered',
]

function extractRawApiPayload(message: string): string {
  const trimmed = String(message || '').trim()
  if (!trimmed) return ''

  const apiErrorMatch = trimmed.match(/^API error:\s*\d+\s*(.+)$/i)
  if (apiErrorMatch?.[1]) return apiErrorMatch[1].trim()
  return trimmed
}

function decodePossibleJsonError(message: string): string {
  const payload = extractRawApiPayload(message)
  const jsonStart = payload.indexOf('{')
  if (jsonStart < 0) return payload

  try {
    const parsed = JSON.parse(payload.slice(jsonStart))
    if (typeof parsed?.error === 'string') return parsed.error
    if (typeof parsed?.error?.message === 'string') return parsed.error.message
    return payload
  } catch {
    return payload
  }
}

function isContentFilterMessage(message: string): boolean {
  const lowered = String(message || '').toLowerCase()
  return CONTENT_FILTER_HINTS.some((hint) => lowered.includes(hint))
}

function hasTechnicalErrorCode(message: string): boolean {
  const lowered = String(message || '').toLowerCase()
  if (lowered.includes('api error:')) return true
  if (lowered.includes('status code')) return true
  if (lowered.includes('error code')) return true
  if (/(?:^|\s)code[:=]/i.test(message)) return true
  if (/\b[A-Z]{3,}_[A-Z0-9_]{2,}\b/.test(message)) return true
  return false
}

export function toUserFriendlyTranscriptionError(rawMessage: string | null | undefined, fallback: string): string {
  const decoded = decodePossibleJsonError(String(rawMessage || ''))
  const lowered = decoded.toLowerCase()

  if (lowered.includes('too large')) {
    return 'Audio bestand is te groot voor transcriptie.'
  }

  if (isContentFilterMessage(decoded)) {
    return 'Een deel van deze inhoud kan niet automatisch worden verwerkt door het veiligheidsfilter. Pas de tekst aan en probeer opnieuw.'
  }

  const cleaned = decoded.trim()
  if (hasTechnicalErrorCode(cleaned)) return fallback
  return cleaned || fallback
}

export function normalizeTranscriptionError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : 'Onbekende fout'
  return toUserFriendlyTranscriptionError(rawMessage, 'Er is een fout opgetreden bij het verwerken van de sessie.')
}
