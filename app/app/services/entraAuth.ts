import * as WebBrowser from "expo-web-browser"
import * as AuthSession from "expo-auth-session"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Linking from "expo-linking"

import Config from "@/config"
import { logger } from "@/utils/logger"

WebBrowser.maybeCompleteAuthSession()

export type EntraAuthResult = {
  accessToken: string
}

type OpenIdConfiguration = {
  authorization_endpoint: string
  token_endpoint: string
}

async function fetchOpenIdConfiguration(openIdConfigurationUrl: string): Promise<OpenIdConfiguration> {
  const url = String(openIdConfigurationUrl || "").trim()
  if (!url) {
    throw new Error("Missing ENTRA_OPENID_CONFIGURATION_URL")
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load Entra OpenID configuration (${response.status})`)
  }

  const json: any = await response.json()
  const authorizationEndpoint = typeof json?.authorization_endpoint === "string" ? json.authorization_endpoint.trim() : ""
  const tokenEndpoint = typeof json?.token_endpoint === "string" ? json.token_endpoint.trim() : ""

  if (!authorizationEndpoint || !tokenEndpoint) {
    throw new Error("Invalid Entra OpenID configuration")
  }

  return {
    authorization_endpoint: authorizationEndpoint,
    token_endpoint: tokenEndpoint,
  }
}

function readEntraConfig() {
  const openIdConfigurationUrl = String((Config as any).ENTRA_OPENID_CONFIGURATION_URL || "").trim()
  const clientId = String((Config as any).ENTRA_CLIENT_ID || "").trim()
  const apiScope = String((Config as any).ENTRA_API_SCOPE || "").trim()

  if (!openIdConfigurationUrl) {
    throw new Error("Missing ENTRA_OPENID_CONFIGURATION_URL in config")
  }
  if (!clientId) {
    throw new Error("Missing ENTRA_CLIENT_ID in config")
  }
  if (!apiScope) {
    throw new Error("Missing ENTRA_API_SCOPE in config")
  }

  return { openIdConfigurationUrl, clientId, apiScope }
}

function buildRedirectUri(): string {
  // Prefer AuthSession.makeRedirectUri for native/dev-client compatibility.
  // Note: depending on platform, the redirect can end up with an extra slash (`...://auth/`).
  // We register `coachscribe://auth` in Entra and accept the callback variants.
  return AuthSession.makeRedirectUri({ scheme: "coachscribe", path: "auth" })
}

const refreshTokenStorageKey = "coachscribe_entra_refresh_token_v1"

async function readRefreshToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(refreshTokenStorageKey)
  const token = typeof raw === "string" && raw.trim() ? raw.trim() : null
  return token
}

async function writeRefreshToken(value: string | null): Promise<void> {
  if (!value) {
    await AsyncStorage.removeItem(refreshTokenStorageKey)
    return
  }
  await AsyncStorage.setItem(refreshTokenStorageKey, value)
}

export async function clearEntraLocalTokens(): Promise<void> {
  await writeRefreshToken(null)
}

export async function signInWithEntra(): Promise<EntraAuthResult> {
  const { openIdConfigurationUrl, clientId, apiScope } = readEntraConfig()

  const discovery = await fetchOpenIdConfiguration(openIdConfigurationUrl)
  const redirectUri = buildRedirectUri()
  logger.info("[entra] redirectUri", { redirectUri })

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ["openid", "profile", "email", apiScope, "offline_access"],
    usePKCE: true,
  })

  const authUrl = await request.makeAuthUrlAsync({
    authorizationEndpoint: discovery.authorization_endpoint,
  })
  logger.info("[entra] authUrl ready")

  const response = await request.promptAsync(
    {
      authorizationEndpoint: discovery.authorization_endpoint,
    },
    { showInRecents: true },
  )

  logger.info("[entra] promptAsync result", { type: response.type, paramsKeys: Object.keys((response as any)?.params || {}) })

  if (response.type !== "success") {
    const params: any = (response as any)?.params
    const error = typeof (response as any)?.error === "string" ? (response as any).error : ""
    const errorDescription = typeof params?.error_description === "string" ? params.error_description : ""
    const errorText = [error, errorDescription].filter(Boolean).join(" - ")
    throw new Error(`Sign in ${response.type}${errorText ? `: ${errorText}` : ""}`)
  }

  if (!response.params?.code) {
    throw new Error("Sign in failed (missing code)")
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: response.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? "",
      },
    },
    {
      tokenEndpoint: discovery.token_endpoint,
    },
  )

  const accessToken = typeof tokenResponse?.accessToken === "string" ? tokenResponse.accessToken.trim() : ""
  const refreshToken = typeof (tokenResponse as any)?.refreshToken === "string" ? String((tokenResponse as any).refreshToken).trim() : ""

  if (!accessToken) {
    throw new Error("Sign in failed (missing access token)")
  }
  logger.info("[entra] token exchange ok", { hasRefreshToken: !!refreshToken })

  try {
    if (refreshToken) {
      await writeRefreshToken(refreshToken)
    }
  } catch (e: any) {
    logger.warn("[entra] Failed to store refresh token", { message: String(e?.message || e || "") })
  }

  return { accessToken }
}

export async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = await readRefreshToken()
  if (!refreshToken) return null

  const { openIdConfigurationUrl, clientId, apiScope } = readEntraConfig()
  const discovery = await fetchOpenIdConfiguration(openIdConfigurationUrl)

  try {
    const tokenResponse: any = await AuthSession.refreshAsync(
      {
        clientId,
        refreshToken,
        scopes: ["openid", "profile", "email", apiScope, "offline_access"],
      },
      {
        tokenEndpoint: discovery.token_endpoint,
      },
    )

    const accessToken = typeof tokenResponse?.accessToken === "string" ? tokenResponse.accessToken.trim() : ""
    const nextRefreshToken = typeof tokenResponse?.refreshToken === "string" ? tokenResponse.refreshToken.trim() : ""

    if (nextRefreshToken) {
      await writeRefreshToken(nextRefreshToken)
    }

    return accessToken || null
  } catch (e: any) {
    logger.warn("[entra] Refresh token failed", { message: String(e?.message || e || "") })
    return null
  }
}

