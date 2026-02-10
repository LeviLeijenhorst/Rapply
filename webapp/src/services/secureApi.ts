import { config } from '../config'
import { getValidAccessToken } from '../auth/entraAuth'

type SecureApiOptions = {
  timeoutMs?: number
}

const DEFAULT_SECURE_API_TIMEOUT_MS = 30_000

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

export async function fetchSecureApi(endpoint: string, init: RequestInit, options?: SecureApiOptions): Promise<Response> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_SECURE_API_TIMEOUT_MS
  const externalSignal = init.signal ?? undefined
  const { signal, cleanup } = createTimeoutSignal(timeoutMs, externalSignal)

  let response: Response
  try {
    response = await fetch(`${config.api.baseUrl}${endpoint}`, {
      ...init,
      signal,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}` as string,
      },
    })
  } catch (error) {
    cleanup()
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('De server reageert niet op tijd. Probeer het opnieuw.')
    }
    console.error('[secureApi] Network error', {
      url: `${config.api.baseUrl}${endpoint}`,
      message: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Kon geen verbinding maken met de server. Controleer of de server draait en of de serverconfiguratie klopt.')
  }
  cleanup()

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error: ${response.status} ${errorText}`)
  }

  return response
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
