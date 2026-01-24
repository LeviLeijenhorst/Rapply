import type { Request } from "express"
import { env } from "./env"

export type AuthenticatedUser = {
  userId: string
  email: string | null
}

export const authImplementationVersion = 3

function createAuthError(message: string) {
  const err: any = new Error(message)
  err.status = 401
  return err as Error
}

function readBearerToken(req: Request): string {
  const authHeader = String(req.headers.authorization || "")
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw createAuthError("Missing Authorization header")
  }
  const token = match[1]
  const dotCount = typeof token === "string" ? (token.match(/\./g) || []).length : 0
  if (dotCount !== 2) {
    console.log("[auth] Invalid token format", { dotCount })
    throw createAuthError("Invalid or expired session")
  }
  return token
}

export async function requireSupabaseUser(req: Request): Promise<AuthenticatedUser> {
  const token = readBearerToken(req)
  try {
    const baseUrl = String(env.supabaseUrl || "").replace(/\/+$/, "")
    const url = `${baseUrl}/auth/v1/user`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.supabaseServiceRoleKey,
      },
    })

    const json: any = await response.json().catch(() => null)
    if (!response.ok) {
      const message = typeof json?.msg === "string" ? json.msg : typeof json?.error_description === "string" ? json.error_description : ""
      console.log("[auth] Supabase auth user lookup failed", { status: response.status, message: message || null })
      throw createAuthError("Invalid or expired session")
    }

    const userId = typeof json?.id === "string" ? json.id.trim() : ""
    if (!userId) {
      throw createAuthError("Invalid or expired session")
    }
    const email = typeof json?.email === "string" ? json.email : null
    return { userId, email }
  } catch (e: any) {
    const message = String(e?.message || e || "")
    const dotCount = typeof token === "string" ? (token.match(/\./g) || []).length : 0
    console.log("[auth] Invalid token received", { dotCount, message })
    throw createAuthError("Invalid or expired session")
  }
}

