import { config } from '../config'
import { getValidAccessToken } from '../auth/entraAuth'

export async function fetchSecureApi(endpoint: string, init: RequestInit): Promise<Response> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  let response: Response
  try {
    response = await fetch(`${config.api.baseUrl}${endpoint}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}` as string,
      },
    })
  } catch (error) {
    throw new Error('Kon geen verbinding maken met de server. Controleer of de server draait en of de serverconfiguratie klopt.')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error: ${response.status} ${errorText}`)
  }

  return response
}

export async function callSecureApi<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetchSecureApi(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return response.json()
}
