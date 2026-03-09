import { env } from "../../env"
import { decryptPipedriveSecret } from "./decryptPipedriveSecret"
import { encryptPipedriveSecret } from "./encryptPipedriveSecret"
import { readPipedriveConnection, updatePipedriveConnectionTokens } from "./store"

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expires_in?: number
}

export async function refreshPipedriveAccessToken(params: { userId: string; connectionId: string }): Promise<{ accessToken: string }> {
  const connection = await readPipedriveConnection({ userId: params.userId, connectionId: params.connectionId })
  if (!connection || connection.status !== "active") {
    throw new Error("Pipedrive connection not found")
  }
  if (!env.pipedriveClientId || !env.pipedriveClientSecret) {
    throw new Error("Pipedrive OAuth is not configured")
  }

  const refreshToken = await decryptPipedriveSecret(connection.refreshTokenEncrypted)
  const form = new URLSearchParams()
  form.set("grant_type", "refresh_token")
  form.set("refresh_token", refreshToken)
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
  const nextRefreshToken = String(payload?.refresh_token || refreshToken).trim()
  if (!response.ok || !accessToken || !nextRefreshToken) {
    throw new Error("Failed to refresh Pipedrive access token")
  }

  const expiresIn = Number(payload?.expires_in || 0)
  const tokenExpiresAtIso = Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

  await updatePipedriveConnectionTokens({
    userId: params.userId,
    connectionId: params.connectionId,
    accessTokenEncrypted: await encryptPipedriveSecret(accessToken),
    refreshTokenEncrypted: await encryptPipedriveSecret(nextRefreshToken),
    tokenScope: payload?.scope ? String(payload.scope) : null,
    tokenType: payload?.token_type ? String(payload.token_type) : null,
    tokenExpiresAtIso,
  })

  return { accessToken }
}
