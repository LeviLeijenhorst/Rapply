type Options = {
  fallback: string
  forbiddenMessage?: string
}
const OFFLINE_ERROR_MESSAGE = 'Geen verbinding. Probeer het later opnieuw'

function extractMessage(error: unknown): string {
  if (error instanceof Error) return String(error.message || '').trim()
  if (typeof error === 'string') return error.trim()
  return ''
}

function parseApiError(rawMessage: string): { statusCode: number | null; payload: string } | null {
  const match = rawMessage.match(/^API error:\s*(\d+)\s*(.*)$/i)
  if (!match) return null

  const statusCode = Number.parseInt(match[1] || '', 10)
  return {
    statusCode: Number.isFinite(statusCode) ? statusCode : null,
    payload: String(match[2] || '').trim(),
  }
}

function extractJsonMessage(payload: string): string | null {
  const jsonStart = payload.indexOf('{')
  if (jsonStart < 0) return null

  try {
    const parsed = JSON.parse(payload.slice(jsonStart))
    if (typeof parsed?.error === 'string' && parsed.error.trim()) return parsed.error.trim()
    if (typeof parsed?.error?.message === 'string' && parsed.error.message.trim()) return parsed.error.message.trim()
    if (typeof parsed?.message === 'string' && parsed.message.trim()) return parsed.message.trim()
    return null
  } catch {
    return null
  }
}

function isLikelyConnectivityIssue(message: string): boolean {
  const lowered = String(message || '').toLowerCase()
  return (
    lowered.includes('enotfound') ||
    lowered.includes('getaddrinfo') ||
    lowered.includes('err_network') ||
    lowered.includes('failed to fetch') ||
    lowered.includes('networkerror when attempting to fetch resource') ||
    lowered.includes('network request failed') ||
    lowered.includes('offline') ||
    lowered.includes('dns')
  )
}

function hasRawErrorCode(message: string): boolean {
  const lowered = message.toLowerCase()
  if (lowered.includes('api error:')) return true
  if (lowered.includes('status code')) return true
  if (lowered.includes('error code')) return true
  if (/(?:^|\s)code[:=]/i.test(message)) return true
  if (/\b[A-Z]{3,}_[A-Z0-9_]{2,}\b/.test(message)) return true
  return false
}

function hasTechnicalEnglishTerms(message: string): boolean {
  const lowered = String(message || '').toLowerCase()
  return (
    lowered.includes('api') ||
    lowered.includes('http') ||
    lowered.includes('oauth') ||
    lowered.includes('token') ||
    lowered.includes('indexeddb') ||
    lowered.includes('failed') ||
    lowered.includes('missing ') ||
    lowered.includes('invalid ') ||
    lowered.includes('forbidden') ||
    lowered.includes('unauthorized') ||
    lowered.includes('not found')
  )
}

export function sanitizeUserFacingErrorMessage(rawMessage: string, fallback: string): string {
  const cleaned = String(rawMessage || '').trim()
  if (!cleaned) return fallback
  if (isLikelyConnectivityIssue(cleaned)) return OFFLINE_ERROR_MESSAGE
  if (hasRawErrorCode(cleaned)) return fallback
  if (hasTechnicalEnglishTerms(cleaned)) return fallback
  return cleaned
}

export function toUserFriendlyErrorMessage(error: unknown, options: Options): string {
  const { fallback, forbiddenMessage } = options
  const rawMessage = extractMessage(error)
  if (!rawMessage) return fallback
  if (isLikelyConnectivityIssue(rawMessage)) return OFFLINE_ERROR_MESSAGE

  const parsedApiError = parseApiError(rawMessage)
  if (parsedApiError) {
    const decodedPayload = extractJsonMessage(parsedApiError.payload) || parsedApiError.payload
    if (isLikelyConnectivityIssue(decodedPayload)) {
      return OFFLINE_ERROR_MESSAGE
    }

    const statusCode = parsedApiError.statusCode
    if (statusCode === 401 || statusCode === 403) {
      return forbiddenMessage || 'Je hebt geen toegang om deze actie uit te voeren.'
    }
    if (statusCode === 404) {
      return fallback
    }
    if (statusCode === 429) {
      return 'Er zijn op dit moment te veel verzoeken. Probeer het zo opnieuw.'
    }
    if (statusCode !== null && statusCode >= 500) {
      return 'Er ging iets mis op de server. Probeer het later opnieuw.'
    }

    if (!decodedPayload || hasRawErrorCode(decodedPayload)) return fallback
    return decodedPayload
  }

  return sanitizeUserFacingErrorMessage(rawMessage, fallback)
}
