import crypto from "crypto"
import { env } from "../../env"
import { createIntegrationOauthState } from "./store"

const OAUTH_STATE_TTL_SECONDS = 60 * 10

function toBase64Url(value: Buffer): string {
  return value.toString("base64url")
}

function createCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest()
  return toBase64Url(hash)
}

export async function createPipedriveAuthorizationUrl(params: { userId: string }): Promise<{ authorizationUrl: string }> {
  if (!env.pipedriveClientId || !env.pipedriveOauthRedirectUri) {
    throw new Error("Pipedrive OAuth is not configured")
  }

  const state = toBase64Url(crypto.randomBytes(24))
  const codeVerifier = toBase64Url(crypto.randomBytes(48))
  const codeChallenge = createCodeChallenge(codeVerifier)
  const expiresAtIso = new Date(Date.now() + OAUTH_STATE_TTL_SECONDS * 1000).toISOString()

  await createIntegrationOauthState({
    userId: params.userId,
    state,
    codeVerifier,
    redirectUri: env.pipedriveOauthRedirectUri,
    expiresAtIso,
  })

  const authorizationUrl = new URL(env.pipedriveOauthAuthorizeUrl)
  authorizationUrl.searchParams.set("client_id", env.pipedriveClientId)
  authorizationUrl.searchParams.set("redirect_uri", env.pipedriveOauthRedirectUri)
  authorizationUrl.searchParams.set("response_type", "code")
  authorizationUrl.searchParams.set("state", state)
  authorizationUrl.searchParams.set("scope", "deals:full,persons:full,organizations:full,activities:full,notes:full,files:full")
  authorizationUrl.searchParams.set("code_challenge", codeChallenge)
  authorizationUrl.searchParams.set("code_challenge_method", "S256")

  return { authorizationUrl: authorizationUrl.toString() }
}
