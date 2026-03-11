import { env } from "../env"

// Intent: readTenantIdFromOpenIdConfigurationUrl
function readTenantIdFromOpenIdConfigurationUrl(openIdConfigurationUrl: string): string | null {
  const match = String(openIdConfigurationUrl || "").match(/\/([0-9a-fA-F-]{36}|[a-zA-Z0-9.-]+)\/v2\.0\//)
  if (!match?.[1]) return null
  return match[1]
}

// Intent: requireGraphConfig
function requireGraphConfig() {
  const tenantId = env.entraGraphTenantId || readTenantIdFromOpenIdConfigurationUrl(env.entraOpenIdConfigurationUrl) || ""
  const clientId = String(env.entraGraphClientId || "").trim()
  const clientSecret = String(env.entraGraphClientSecret || "").trim()

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing Entra Graph configuration")
  }

  return { tenantId, clientId, clientSecret }
}

// Intent: fetchGraphAccessToken
async function fetchGraphAccessToken(): Promise<string> {
  const { tenantId, clientId, clientSecret } = requireGraphConfig()
  const tokenEndpoint = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  })

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch Graph token (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as any
  const accessToken = typeof payload?.access_token === "string" ? payload.access_token.trim() : ""
  if (!accessToken) {
    throw new Error("Graph token response missing access_token")
  }
  return accessToken
}

// Intent: deleteEntraUserById
export async function deleteEntraUserById(entraUserId: string): Promise<void> {
  const id = String(entraUserId || "").trim()
  if (!id) {
    throw new Error("Missing Entra user id")
  }

  const accessToken = await fetchGraphAccessToken()
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 404) {
    return
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete Entra user (${response.status}): ${errorText}`)
  }
}
