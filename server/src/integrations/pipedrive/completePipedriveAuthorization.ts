import { env } from "../../env"
import { encryptPipedriveSecret } from "./encryptPipedriveSecret"
import { consumeIntegrationOauthState, upsertPipedriveConnection } from "./store"

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expires_in?: number
}

export async function completePipedriveAuthorization(params: { state: string; code: string }): Promise<{ connectionId: string; userId: string }> {
  if (!env.pipedriveClientId || !env.pipedriveClientSecret) {
    throw new Error("Pipedrive OAuth is not configured")
  }

  const oauthState = await consumeIntegrationOauthState({ state: params.state })
  if (!oauthState) {
    throw new Error("Invalid or expired OAuth state")
  }

  const form = new URLSearchParams()
  form.set("grant_type", "authorization_code")
  form.set("code", params.code)
  form.set("redirect_uri", oauthState.redirectUri)
  form.set("code_verifier", oauthState.codeVerifier)
  form.set("client_id", env.pipedriveClientId)
  form.set("client_secret", env.pipedriveClientSecret)

  const response = await fetch(env.pipedriveOauthTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  })

  const payload = (await response.json().catch(() => null)) as TokenResponse | null
  const accessToken = String(payload?.access_token || "").trim()
  const refreshToken = String(payload?.refresh_token || "").trim()
  if (!response.ok || !accessToken || !refreshToken) {
    throw new Error("Failed to complete Pipedrive OAuth")
  }

  const expiresIn = Number(payload?.expires_in || 0)
  const tokenExpiresAtIso = Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

  const connection = await upsertPipedriveConnection({
    userId: oauthState.userId,
    accessTokenEncrypted: await encryptPipedriveSecret(accessToken),
    refreshTokenEncrypted: await encryptPipedriveSecret(refreshToken),
    tokenScope: payload?.scope ? String(payload.scope) : null,
    tokenType: payload?.token_type ? String(payload.token_type) : null,
    tokenExpiresAtIso,
    accountLabel: "Pipedrive",
  })

  return { connectionId: connection.connectionId, userId: oauthState.userId }
}
