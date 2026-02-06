import { config } from '../config'

type OpenIdConfiguration = {
  authorization_endpoint: string
  token_endpoint: string
  issuer: string
}

let openIdConfigurationCache: OpenIdConfiguration | null = null

async function fetchOpenIdConfiguration(): Promise<OpenIdConfiguration> {
  if (openIdConfigurationCache) return openIdConfigurationCache

  const response = await fetch(config.entra.openIdConfigurationUrl)
  if (!response.ok) {
    throw new Error(`Failed to load OpenID configuration (${response.status})`)
  }

  const json = await response.json()
  openIdConfigurationCache = {
    authorization_endpoint: json.authorization_endpoint,
    token_endpoint: json.token_endpoint,
    issuer: json.issuer,
  }

  return openIdConfigurationCache
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

function base64UrlEncode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier)
  return base64UrlEncode(hashed)
}

function buildRedirectUri(): string {
  const configuredBaseUrl = config.entra.redirectBaseUrl?.trim()
  if (configuredBaseUrl) {
    return `${configuredBaseUrl.replace(/\/$/, '')}/auth/callback`
  }
  if (typeof window === 'undefined') return 'http://localhost:8081/auth/callback'
  return `${window.location.origin}/auth/callback`
}

export type EntraAuthResult = {
  accessToken: string
}

type AccessTokenPayload = {
  exp?: number
}

export async function signInWithEntra(values?: { screenHint?: 'signup' }): Promise<void> {
  const discovery = await fetchOpenIdConfiguration()
  const redirectUri = buildRedirectUri()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('entra_code_verifier', codeVerifier)
    localStorage.setItem('entra_redirect_uri', redirectUri)
    localStorage.setItem('entra_auth_start_time', Date.now().toString())
  }

  const params = new URLSearchParams({
    client_id: config.entra.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: `openid profile email ${config.entra.apiScope} offline_access`,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_mode: 'query',
  })
  if (values?.screenHint) {
    params.set('screen_hint', values.screenHint)
  }

  const authUrl = `${discovery.authorization_endpoint}?${params.toString()}`
  window.location.assign(authUrl)
}

export async function signUpWithEntra(): Promise<void> {
  return signInWithEntra({ screenHint: 'signup' })
}

export async function handleAuthCallback(): Promise<EntraAuthResult> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    throw new Error('Not in browser environment')
  }

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')

  if (error) {
    throw new Error(`Authentication failed: ${error}`)
  }

  if (!code) {
    throw new Error('Missing authorization code')
  }

  const codeVerifier = localStorage.getItem('entra_code_verifier')
  const redirectUri = localStorage.getItem('entra_redirect_uri')
  const authStartTime = localStorage.getItem('entra_auth_start_time')

  if (authStartTime) {
    const startTime = Number(authStartTime)
    if (Number.isFinite(startTime) && Date.now() - startTime > 10 * 60 * 1000) {
      localStorage.removeItem('entra_code_verifier')
      localStorage.removeItem('entra_redirect_uri')
      localStorage.removeItem('entra_auth_start_time')
      throw new Error('Authentication session expired. Please try signing in again.')
    }
  }

  if (!codeVerifier || !redirectUri) {
    throw new Error('Missing code verifier or redirect URI. Please try signing in again.')
  }

  localStorage.removeItem('entra_code_verifier')
  localStorage.removeItem('entra_redirect_uri')
  localStorage.removeItem('entra_auth_start_time')

  let tokenResponse: Response
  const exchangeUrl = `${config.api.baseUrl}/auth/exchange-code`
  try {
    tokenResponse = await fetch(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri,
      }),
    })
  } catch (error) {
    console.error('[auth/exchange-code] request failed', {
      exchangeUrl,
      redirectUri,
      pageOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to reach the API server. Please check the API base URL and server status.')
  }

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Token exchange failed: ${errorText}`)
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.accessToken

  if (!accessToken) {
    throw new Error('Missing access token')
  }

  localStorage.setItem('entra_access_token', accessToken)
  if (tokenData.refreshToken) {
    localStorage.setItem('entra_refresh_token', tokenData.refreshToken)
  }

  window.history.replaceState({}, '', '/inloggen')

  return { accessToken }
}

export function getStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('entra_access_token')
}

export function getStoredRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('entra_refresh_token')
}

function decodeAccessTokenPayload(accessToken: string): AccessTokenPayload | null {
  try {
    const tokenParts = accessToken.split('.')
    if (tokenParts.length < 2) return null
    const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')
    const paddingLength = (4 - (base64.length % 4)) % 4
    const padded = base64 + '='.repeat(paddingLength)
    const json = atob(padded)
    return JSON.parse(json) as AccessTokenPayload
  } catch {
    return null
  }
}

function isAccessTokenExpired(accessToken: string): boolean {
  const payload = decodeAccessTokenPayload(accessToken)
  const expiresAtSeconds = typeof payload?.exp === 'number' ? payload.exp : null
  if (!expiresAtSeconds) return true
  const nowSeconds = Math.floor(Date.now() / 1000)
  const refreshWindowSeconds = 60
  return expiresAtSeconds - nowSeconds <= refreshWindowSeconds
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  const response = await fetch(`${config.api.baseUrl}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    await clearEntraLocalTokens()
    return null
  }

  const tokenData = await response.json()
  const accessToken = typeof tokenData?.accessToken === 'string' ? tokenData.accessToken : ''
  const newRefreshToken = typeof tokenData?.refreshToken === 'string' ? tokenData.refreshToken : null

  if (!accessToken) {
    await clearEntraLocalTokens()
    return null
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('entra_access_token', accessToken)
    if (newRefreshToken) {
      localStorage.setItem('entra_refresh_token', newRefreshToken)
    }
  }

  return accessToken
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getStoredAccessToken()
  if (!accessToken) return null
  if (!isAccessTokenExpired(accessToken)) return accessToken
  return await refreshAccessToken()
}

export async function clearEntraLocalTokens(): Promise<void> {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem('entra_refresh_token')
  localStorage.removeItem('entra_access_token')
  localStorage.removeItem('entra_code_verifier')
  localStorage.removeItem('entra_redirect_uri')
  localStorage.removeItem('entra_auth_start_time')
}
