import { config } from '../config'
import { getValidAccessToken } from '../screens/authentication/internal/entraAuth'

type SecureApiOptions = {
  timeoutMs?: number
  signal?: AbortSignal
}

const DEFAULT_SECURE_API_TIMEOUT_MS = 45_000
const COLD_START_RETRY_DELAY_MS = 1200
const MAX_RETRY_ATTEMPTS = 3
const WARMUP_TIMEOUT_MS = 20_000
const COLD_START_STATUS_CODES = new Set([502, 503, 504])
const OFFLINE_ERROR_MESSAGE = 'Geen verbinding. Probeer het later opnieuw'
const GENERIC_ERROR_MESSAGE = 'Er is iets misgegaan. Probeer het opnieuw.'
let hasAttemptedServerWarmup = false

function createTimeoutSignal(timeoutMs: number, externalSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const onExternalAbort = () => controller.abort()

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  const cleanup = () => {
    clearTimeout(timeoutId)
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort)
    }
  }

  return { signal: controller.signal, cleanup }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return String(error.message || '')
  return String(error || '')
}

function isConnectivityError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }

  const lowered = readErrorMessage(error).toLowerCase()
  return (
    lowered.includes('failed to fetch') ||
    lowered.includes('network request failed') ||
    lowered.includes('networkerror when attempting to fetch resource') ||
    lowered.includes('err_network') ||
    lowered.includes('enotfound') ||
    lowered.includes('getaddrinfo') ||
    lowered.includes('offline') ||
    lowered.includes('dns')
  )
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function warmUpServer(force = false) {
  if (hasAttemptedServerWarmup && !force) return
  hasAttemptedServerWarmup = true

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS)
  try {
    await fetch(`${config.api.baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    })
  } catch {
    // Best effort warm-up only.
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function warmUpSecureApi() {
  await warmUpServer(true)
}

export async function fetchSecureApi(endpoint: string, init: RequestInit, options?: SecureApiOptions): Promise<Response> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_SECURE_API_TIMEOUT_MS
  const externalSignal = options?.signal ?? init.signal ?? undefined
  const requestUrl = `${config.api.baseUrl}${endpoint}`
  await warmUpServer()

  let lastNetworkError: unknown = null
  let lastTimeoutError = false
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    const { signal, cleanup } = createTimeoutSignal(timeoutMs, externalSignal)
    try {
      const response = await fetch(requestUrl, {
        ...init,
        signal,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${accessToken}` as string,
        },
      })

      if (response.ok) {
        cleanup()
        return response
      }

      const shouldRetryStatus = COLD_START_STATUS_CODES.has(response.status)
      if (shouldRetryStatus && attempt < MAX_RETRY_ATTEMPTS) {
        cleanup()
        await warmUpServer(true)
        await wait(COLD_START_RETRY_DELAY_MS)
        continue
      }

      cleanup()
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} ${errorText}`)
    } catch (error) {
      cleanup()
      if (error instanceof Error && error.message.startsWith('API error:')) {
        throw error
      }
      const abortedByUser = externalSignal?.aborted === true
      if (isAbortError(error) && abortedByUser) {
        throw new Error('Request aborted')
      }
      const isTimeout = isAbortError(error)
      lastTimeoutError = isTimeout
      lastNetworkError = error

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await warmUpServer(true)
        await wait(COLD_START_RETRY_DELAY_MS)
        continue
      }
    }
  }

  if (lastTimeoutError) {
    throw new Error(GENERIC_ERROR_MESSAGE)
  }

  if (isConnectivityError(lastNetworkError)) {
    throw new Error(OFFLINE_ERROR_MESSAGE)
  }

  console.error('[secureApi] Network error', {
    url: requestUrl,
    message: lastNetworkError instanceof Error ? lastNetworkError.message : String(lastNetworkError),
  })
  throw new Error(GENERIC_ERROR_MESSAGE)
}

export async function callSecureApi<T>(endpoint: string, body: unknown, options?: SecureApiOptions): Promise<T> {
  const response = await fetchSecureApi(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, options)

  return response.json()
}
