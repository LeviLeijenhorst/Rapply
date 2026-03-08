import type { Request } from "express"
import { verifyEntraAccessToken } from "./entra"
import { ensureUserFromEntra } from "./users"
import { decodeJwt, decodeProtectedHeader } from "jose"
import { env } from "./env"

export type AuthenticatedUser = {
  userId: string
  entraUserId: string
  email: string | null
  displayName: string | null
  givenName: string | null
  surname: string | null
  accountType: "admin" | "paid" | "test"
}

export const authImplementationVersion = 7

// Intent: createAuthError
function createAuthError(message: string) {
  const err: any = new Error(message)
  err.status = 401
  return err as Error
}

// Intent: createDependencyError
function createDependencyError(message: string) {
  const err: any = new Error(message)
  err.status = 503
  return err as Error
}

// Intent: readBearerToken
function readBearerToken(req: Request): string {
  const authHeader = String(req.headers.authorization || "")
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw createAuthError("Missing Authorization header")
  }
  const token = String(match[1] || "").trim()
  if (!token) {
    throw createAuthError("Missing Authorization header")
  }
  return token
}

// Intent: requireAuthenticatedUser
export async function requireAuthenticatedUser(req: Request): Promise<AuthenticatedUser> {
  const token = readBearerToken(req)

  let entra: Awaited<ReturnType<typeof verifyEntraAccessToken>>
  try {
    entra = await verifyEntraAccessToken(token)
  } catch (e: any) {
    const message = String(e?.message || e || "")
    try {
      const header = decodeProtectedHeader(token) as any
      const payload = decodeJwt(token) as any
      console.warn("[auth] Entra token verification failed", {
        message,
        expectedAudience: env.entraAudience,
        tokenDiagnostics: {
          hasIssuer: Boolean(payload?.iss),
          audienceType: Array.isArray(payload?.aud) ? "array" : typeof payload?.aud,
          hasExpiry: Number.isFinite(Number(payload?.exp)),
          hasScopes: typeof payload?.scp === "string" && payload.scp.trim().length > 0,
          hasRoles: Array.isArray(payload?.roles) && payload.roles.length > 0,
          tenantClaimPresent: Boolean(payload?.tid),
          objectIdClaimPresent: Boolean(payload?.oid),
          keyId: typeof header?.kid === "string" ? header.kid : null,
          algorithm: typeof header?.alg === "string" ? header.alg : null,
        },
      })
    } catch {
      console.warn("[auth] Entra token verification failed", { message, expectedAudience: env.entraAudience })
    }
    throw createAuthError("Invalid or expired session")
  }

  try {
    const user = await ensureUserFromEntra({
      entraUserId: entra.entraUserId,
      email: entra.email,
      displayName: entra.displayName,
    })

    return {
      userId: user.userId,
      entraUserId: user.entraUserId,
      email: user.email,
      displayName: user.displayName,
      givenName: entra.givenName,
      surname: entra.surname,
      accountType: user.accountType,
    }
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : null
    if (status === 401 || status === 403) {
      const authError: any = new Error(String(e?.message || "Forbidden"))
      authError.status = status
      throw authError as Error
    }
    const message = String(e?.message || e || "")
    console.warn("[auth] Failed to ensure user in DB", { message })
    throw createDependencyError("Backend temporarily unavailable")
  }
}

