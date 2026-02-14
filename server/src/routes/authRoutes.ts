import type { Express } from "express"
import { requireAuthenticatedUser } from "../auth"
import { env } from "../env"
import { asyncHandler, sendError } from "../http"

// Loads and validates the OpenID token endpoint from Entra configuration.
async function readTokenEndpoint(): Promise<string> {
  const configResponse = await fetch(env.entraOpenIdConfigurationUrl)
  if (!configResponse.ok) {
    throw new Error(`Failed to load OpenID configuration (${configResponse.status})`)
  }
  const openIdConfig = (await configResponse.json()) as any
  const tokenEndpoint = typeof openIdConfig?.token_endpoint === "string" ? openIdConfig.token_endpoint.trim() : ""
  if (!tokenEndpoint) {
    throw new Error("Missing token endpoint in OpenID configuration")
  }
  return tokenEndpoint
}

// Posts form-encoded token requests to Entra and returns the JSON response.
async function postTokenRequest(params: URLSearchParams): Promise<any> {
  const tokenEndpoint = await readTokenEndpoint()
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.warn("[auth] token request failed", { status: tokenResponse.status, errorText })
    const error = new Error("Token request failed")
    ;(error as any).status = tokenResponse.status
    throw error
  }
  return (await tokenResponse.json()) as any
}

// Registers identity endpoints and Entra token exchange flows.
export function registerAuthRoutes(app: Express): void {
  app.post(
    "/auth/me",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      res.status(200).json({ userId: user.userId, email: user.email, displayName: user.displayName, entraUserId: user.entraUserId })
    }),
  )

  app.post(
    "/auth/exchange-code",
    asyncHandler(async (req, res) => {
      const code = typeof req.body?.code === "string" ? req.body.code.trim() : ""
      const codeVerifier = typeof req.body?.codeVerifier === "string" ? req.body.codeVerifier.trim() : ""
      const redirectUri = typeof req.body?.redirectUri === "string" ? req.body.redirectUri.trim() : ""

      if (!code) {
        sendError(res, 400, "Missing code")
        return
      }
      if (!codeVerifier) {
        sendError(res, 400, "Missing codeVerifier")
        return
      }
      if (!redirectUri) {
        sendError(res, 400, "Missing redirectUri")
        return
      }

      const tokenParams = new URLSearchParams({
        client_id: env.entraClientId,
        client_secret: env.entraClientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      })

      try {
        const tokenData = await postTokenRequest(tokenParams)
        const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : ""
        const refreshToken = typeof tokenData?.refresh_token === "string" ? tokenData.refresh_token : null
        if (!accessToken) {
          sendError(res, 502, "Missing access token from provider")
          return
        }
        res.status(200).json({ accessToken, refreshToken })
      } catch (error: any) {
        const status = typeof error?.status === "number" ? error.status : 502
        sendError(res, status, "Token exchange failed")
      }
    }),
  )

  app.post(
    "/auth/refresh-token",
    asyncHandler(async (req, res) => {
      const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : ""
      if (!refreshToken) {
        sendError(res, 400, "Missing refreshToken")
        return
      }

      const tokenParams = new URLSearchParams({
        client_id: env.entraClientId,
        client_secret: env.entraClientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      })

      try {
        const tokenData = await postTokenRequest(tokenParams)
        const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : ""
        const nextRefreshToken = typeof tokenData?.refresh_token === "string" ? tokenData.refresh_token : refreshToken
        if (!accessToken) {
          sendError(res, 502, "Missing access token from provider")
          return
        }
        res.status(200).json({ accessToken, refreshToken: nextRefreshToken })
      } catch (error: any) {
        const status = typeof error?.status === "number" ? error.status : 502
        sendError(res, status, "Token refresh failed")
      }
    }),
  )
}
