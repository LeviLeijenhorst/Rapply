import { config } from '../config'

type OpenIdConfiguration = {
  authorization_endpoint: string
  token_endpoint: string
  issuer: string
}

let openIdConfigurationCache: OpenIdConfiguration | null = null
let accessTokenMemoryCache: string | null = null
let refreshTokenMemoryCache: string | null = null

const AUTH_FLOW_MAX_AGE_MS = 10 * 60 * 1000
const ENTRA_CODE_VERIFIER_KEY = 'entra_code_verifier'
const ENTRA_REDIRECT_URI_KEY = 'entra_redirect_uri'
const ENTRA_AUTH_START_TIME_KEY = 'entra_auth_start_time'
const ENTRA_OAUTH_STATE_KEY = 'entra_oauth_state'
const ENTRA_AUTH_INTENT_KEY = 'entra_auth_intent'
const ENTRA_ACCESS_TOKEN_KEY = 'entra_access_token'
const ENTRA_REFRESH_TOKEN_KEY = 'entra_refresh_token'

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function getStoredValue(key: string): string | null {
  const storage = getSessionStorage()
  if (!storage) return null
  return storage.getItem(key)
}

function setStoredValue(key: string, value: string) {
  const storage = getSessionStorage()
  if (!storage) return
  storage.setItem(key, value)
}

function removeStoredValue(key: string) {
  const storage = getSessionStorage()
  if (!storage) return
  storage.removeItem(key)
}

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

function generateOAuthState(): string {
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

function clearAuthFlowData() {
  removeStoredValue(ENTRA_CODE_VERIFIER_KEY)
  removeStoredValue(ENTRA_REDIRECT_URI_KEY)
  removeStoredValue(ENTRA_AUTH_START_TIME_KEY)
  removeStoredValue(ENTRA_OAUTH_STATE_KEY)
}

function setAuthIntent(intent: 'signup' | 'signin') {
  setStoredValue(ENTRA_AUTH_INTENT_KEY, intent)
}

export function getAuthIntent(): 'signup' | 'signin' | null {
  const raw = getStoredValue(ENTRA_AUTH_INTENT_KEY)
  if (raw === 'signup' || raw === 'signin') return raw
  return null
}

export function clearAuthIntent() {
  removeStoredValue(ENTRA_AUTH_INTENT_KEY)
}

function setStoredAccessToken(accessToken: string) {
  accessTokenMemoryCache = accessToken
  setStoredValue(ENTRA_ACCESS_TOKEN_KEY, accessToken)
}

function setStoredRefreshToken(refreshToken: string | null) {
  refreshTokenMemoryCache = refreshToken
  if (refreshToken) {
    setStoredValue(ENTRA_REFRESH_TOKEN_KEY, refreshToken)
    return
  }
  removeStoredValue(ENTRA_REFRESH_TOKEN_KEY)
}

export async function signInWithEntra(values?: { screenHint?: 'signup'; prompt?: 'create' }): Promise<void> {
  const discovery = await fetchOpenIdConfiguration()
  const redirectUri = buildRedirectUri()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateOAuthState()

  if (!getSessionStorage()) {
    throw new Error('Session storage is not available. Please disable strict browser storage restrictions and try again.')
  }
  setStoredValue(ENTRA_CODE_VERIFIER_KEY, codeVerifier)
  setStoredValue(ENTRA_REDIRECT_URI_KEY, redirectUri)
  setStoredValue(ENTRA_AUTH_START_TIME_KEY, Date.now().toString())
  setStoredValue(ENTRA_OAUTH_STATE_KEY, state)
  setAuthIntent(values?.screenHint === 'signup' ? 'signup' : 'signin')

  const params = new URLSearchParams({
    client_id: config.entra.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: `openid profile email ${config.entra.apiScope} offline_access`,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_mode: 'query',
    state,
  })
  if (values?.screenHint) {
    params.set('screen_hint', values.screenHint)
  }
  if (values?.prompt) {
    params.set('prompt', values.prompt)
  }

  const authUrl = `${discovery.authorization_endpoint}?${params.toString()}`
  window.location.assign(authUrl)
}

export async function signUpWithEntra(): Promise<void> {
  return signInWithEntra({ screenHint: 'signup', prompt: 'create' })
}

export async function handleAuthCallback(): Promise<EntraAuthResult> {
  if (typeof window === 'undefined' || !getSessionStorage()) {
    throw new Error('Not in browser environment')
  }

  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  const receivedState = urlParams.get('state')

  if (error) {
    throw new Error(`Authentication failed: ${error}`)
  }

  if (!code) {
    throw new Error('Missing authorization code')
  }

  const codeVerifier = getStoredValue(ENTRA_CODE_VERIFIER_KEY)
  const redirectUri = getStoredValue(ENTRA_REDIRECT_URI_KEY)
  const authStartTime = getStoredValue(ENTRA_AUTH_START_TIME_KEY)
  const expectedState = getStoredValue(ENTRA_OAUTH_STATE_KEY)

  if (authStartTime) {
    const startTime = Number(authStartTime)
    if (Number.isFinite(startTime) && Date.now() - startTime > AUTH_FLOW_MAX_AGE_MS) {
      clearAuthFlowData()
      throw new Error('Authentication session expired. Please try signing in again.')
    }
  }

  if (!receivedState || !expectedState || receivedState !== expectedState) {
    clearAuthFlowData()
    throw new Error('Invalid OAuth state. Please try signing in again.')
  }

  if (!codeVerifier || !redirectUri) {
    clearAuthFlowData()
    throw new Error('Missing code verifier or redirect URI. Please try signing in again.')
  }

  clearAuthFlowData()

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

  setStoredAccessToken(accessToken)
  if (tokenData.refreshToken) {
    setStoredRefreshToken(tokenData.refreshToken)
  }
  clearAuthIntent()

  window.history.replaceState({}, '', '/inloggen')

  return { accessToken }
}

export function getStoredAccessToken(): string | null {
  if (accessTokenMemoryCache) return accessTokenMemoryCache
  const accessToken = getStoredValue(ENTRA_ACCESS_TOKEN_KEY)
  if (accessToken) {
    accessTokenMemoryCache = accessToken
  }
  return accessToken
}

export function getStoredRefreshToken(): string | null {
  if (refreshTokenMemoryCache) return refreshTokenMemoryCache
  const refreshToken = getStoredValue(ENTRA_REFRESH_TOKEN_KEY)
  if (refreshToken) {
    refreshTokenMemoryCache = refreshToken
  }
  return refreshToken
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

  setStoredAccessToken(accessToken)
  if (newRefreshToken) {
    setStoredRefreshToken(newRefreshToken)
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
  accessTokenMemoryCache = null
  refreshTokenMemoryCache = null
  removeStoredValue(ENTRA_REFRESH_TOKEN_KEY)
  removeStoredValue(ENTRA_ACCESS_TOKEN_KEY)
  clearAuthFlowData()
}

// Clears locally stored Entra auth state for sign-out.
export async function signOutFromEntra(): Promise<void> {
  await clearEntraLocalTokens()
}
