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
      console.log("[auth] Entra token verification failed", {
        message,
        expectedAudience: env.entraAudience,
        token: {
          iss: payload?.iss,
          aud: payload?.aud,
          exp: payload?.exp,
          scp: payload?.scp,
          roles: payload?.roles,
          tid: payload?.tid,
          oid: payload?.oid,
        },
        header: {
          kid: header?.kid,
          alg: header?.alg,
        },
      })
    } catch {
      console.log("[auth] Entra token verification failed", { message, expectedAudience: env.entraAudience })
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
    }
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : null
    if (status === 401 || status === 403) {
      const authError: any = new Error(String(e?.message || "Forbidden"))
      authError.status = status
      throw authError as Error
    }
    const message = String(e?.message || e || "")
    const stack = typeof e?.stack === "string" ? e.stack : null
    console.log("[auth] Failed to ensure user in DB", { message, stack })
    throw createDependencyError("Backend temporarily unavailable")
  }
}

