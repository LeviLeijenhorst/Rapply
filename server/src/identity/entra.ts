import { createRemoteJWKSet, jwtVerify } from "jose"
import { env } from "../env"

type EntraClaims = {
  sub?: string
  oid?: string
  tid?: string
  email?: string
  preferred_username?: string
  name?: string
  given_name?: string
  family_name?: string
  aud?: string | string[]
  iss?: string
  exp?: number
}

type OpenIdConfiguration = {
  issuer: string
  jwks_uri: string
}

let openIdConfigurationCache: OpenIdConfiguration | null = null
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null

// Intent: loadOpenIdConfiguration
async function loadOpenIdConfiguration(): Promise<OpenIdConfiguration> {
  if (openIdConfigurationCache) return openIdConfigurationCache

  const url = String(env.entraOpenIdConfigurationUrl || "").trim()
  if (!url) {
    throw new Error("Missing ENTRA_OPENID_CONFIGURATION_URL")
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load OpenID configuration (${response.status})`)
  }

  const json = (await response.json()) as any
  const issuer = typeof json?.issuer === "string" ? json.issuer.trim().replace(/\/+$/, "") : ""
  const jwksUri = typeof json?.jwks_uri === "string" ? json.jwks_uri.trim() : ""

  if (!issuer || !jwksUri) {
    throw new Error("Invalid OpenID configuration")
  }

  openIdConfigurationCache = { issuer, jwks_uri: jwksUri }
  return openIdConfigurationCache
}

// Intent: getJwks
async function getJwks(): Promise<ReturnType<typeof createRemoteJWKSet>> {
  if (jwksCache) return jwksCache
  const config = await loadOpenIdConfiguration()
  jwksCache = createRemoteJWKSet(new URL(config.jwks_uri))
  return jwksCache
}

export type VerifiedEntraIdentity = {
  entraUserId: string
  email: string | null
  displayName: string | null
  givenName: string | null
  surname: string | null
}

// Intent: verifyEntraAccessToken
export async function verifyEntraAccessToken(accessToken: string): Promise<VerifiedEntraIdentity> {
  const token = String(accessToken || "").trim()
  if (!token) {
    throw new Error("Missing access token")
  }

  const config = await loadOpenIdConfiguration()
  const jwks = await getJwks()

  const verified = await jwtVerify(token, jwks, {
    issuer: config.issuer,
    audience: env.entraAudience,
  })

  const payload = verified.payload as unknown as EntraClaims
  const entraUserId = typeof payload?.oid === "string" && payload.oid.trim() ? payload.oid.trim() : typeof payload?.sub === "string" ? payload.sub.trim() : ""
  if (!entraUserId) {
    throw new Error("Missing user id in token")
  }

  const email =
    typeof payload?.email === "string" && payload.email.trim()
      ? payload.email.trim()
      : typeof payload?.preferred_username === "string" && payload.preferred_username.trim()
        ? payload.preferred_username.trim()
        : null

  const displayName = typeof payload?.name === "string" && payload.name.trim() ? payload.name.trim() : null
  const givenName = typeof payload?.given_name === "string" && payload.given_name.trim() ? payload.given_name.trim() : null
  const surname = typeof payload?.family_name === "string" && payload.family_name.trim() ? payload.family_name.trim() : null

  return { entraUserId, email, displayName, givenName, surname }
}

