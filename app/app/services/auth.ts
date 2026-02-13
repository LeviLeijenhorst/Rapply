import AsyncStorage from "@react-native-async-storage/async-storage"
import { logger } from "@/utils/logger"
import { getApiBaseUrl } from "./apiBaseUrl"
import { clearEntraLocalTokens, signInWithEntra, tryRefreshAccessToken } from "./entraAuth"

export type AuthSession = {
  accessToken: string
  userId: string
  email: string | null
  displayName: string | null
}

type SignInOptions = {
  screenHint?: "signup"
}

const storageKey = "coachscribe_auth_session_v1"
const signInInFlightKey = "coachscribe_signin_inflight_v1"
const signInInFlightTtlMs = 2 * 60 * 1000

type AuthSessionListener = (session: AuthSession | null) => void
const listeners = new Set<AuthSessionListener>()

let cachedSession: AuthSession | null | undefined = undefined

function notify() {
  for (const listener of listeners) {
    try {
      listener(cachedSession ?? null)
    } catch {}
  }
}

export function onAuthSessionChange(listener: AuthSessionListener): () => void {
  listeners.add(listener)
  Promise.resolve().then(() => {
    try {
      listener(cachedSession ?? null)
    } catch {}
  })
  return () => {
    listeners.delete(listener)
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  if (cachedSession !== undefined) return cachedSession
  try {
    const raw = await AsyncStorage.getItem(storageKey)
    if (!raw) {
      cachedSession = null
      return null
    }
    const json = JSON.parse(raw)
    const accessToken = typeof json?.accessToken === "string" ? json.accessToken : ""
    const userId = typeof json?.userId === "string" ? json.userId : ""
    const email = typeof json?.email === "string" ? json.email : ""
    const displayName = typeof json?.displayName === "string" ? json.displayName : null
    if (!accessToken || !userId || !email) {
      cachedSession = null
      await AsyncStorage.removeItem(storageKey)
      return null
    }
    cachedSession = { accessToken, userId, email, displayName }
    return cachedSession
  } catch (e: any) {
    logger.error("[auth] Failed to read session", { message: String(e?.message || e || "") })
    cachedSession = null
    return null
  }
}

async function setAuthSession(session: AuthSession | null): Promise<void> {
  cachedSession = session
  if (!session) {
    await AsyncStorage.removeItem(storageKey)
    notify()
    return
  }
  await AsyncStorage.setItem(storageKey, JSON.stringify(session))
  notify()
}

export async function isSignInInFlight(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(signInInFlightKey)
    const ts = raw ? Number(raw) : NaN
    if (!Number.isFinite(ts)) return false
    return Date.now() - ts < signInInFlightTtlMs
  } catch {
    return false
  }
}

async function setSignInInFlight(value: boolean) {
  try {
    if (!value) {
      await AsyncStorage.removeItem(signInInFlightKey)
      return
    }
    await AsyncStorage.setItem(signInInFlightKey, String(Date.now()))
  } catch {}
}

async function postJson(path: string, body: unknown, accessToken: string | null): Promise<any> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body ?? {}) })
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  if (!res.ok) {
    const message = (json && (json.error || json.message)) || text || `Request failed (${res.status})`
    throw new Error(String(message))
  }
  return json
}

export async function requireAccessToken(): Promise<string> {
  const session = await getAuthSession()
  const token = session?.accessToken ?? ""
  if (token) return token

  const refreshed = await tryRefreshAccessToken()
  if (!refreshed) {
    throw new Error("Not signed in")
  }

  const hydrated = await hydrateSessionFromAccessToken(refreshed)
  await setAuthSession(hydrated)
  return refreshed
}

export async function requireUserId(): Promise<string> {
  const session = await getAuthSession()
  const userId = session?.userId ?? ""
  if (!userId) throw new Error("Not signed in")
  return userId
}

async function hydrateSessionFromAccessToken(accessToken: string): Promise<AuthSession> {
  const result = await postJson("/auth/me", {}, accessToken)
  const userId = typeof result?.userId === "string" ? result.userId : ""
  const email = typeof result?.email === "string" ? result.email : null
  const displayName = typeof result?.displayName === "string" ? result.displayName : null
  if (!userId) {
    throw new Error("Failed to load user session")
  }
  return { accessToken, userId, email, displayName }
}

function logJwtSummary(token: string) {
  try {
    const parts = String(token || "").split(".")
    if (parts.length < 2) return
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payloadPart + "=".repeat((4 - (payloadPart.length % 4)) % 4)
    const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8"))
    logger.info("[auth] token summary", {
      iss: json?.iss,
      aud: json?.aud,
      exp: json?.exp,
      scp: json?.scp,
      roles: json?.roles,
    })
  } catch (e: any) {
    logger.warn("[auth] failed to decode token summary", { message: String(e?.message || e || "") })
  }
}

export async function signIn(options?: SignInOptions): Promise<void> {
  await setSignInInFlight(true)
  logger.info("[auth] signIn: entra start")
  try {
    const result = await signInWithEntra(options)
    logJwtSummary(result.accessToken)
    logger.info("[auth] signIn: entra ok, hydrating session")
    const hydrated = await hydrateSessionFromAccessToken(result.accessToken)
    logger.info("[auth] signIn: hydrate ok")
    await setAuthSession(hydrated)
  } finally {
    await setSignInInFlight(false)
  }
}

export async function signOut(): Promise<void> {
  try {
    await clearEntraLocalTokens()
  } catch {}
  await setAuthSession(null)
}

export async function updateAccountDisplayName(displayName: string | null): Promise<void> {
  const token = await requireAccessToken()
  await postJson("/account/displayName", { displayName }, token)
  const session = await getAuthSession()
  if (!session) return
  await setAuthSession({ ...session, displayName: typeof displayName === "string" ? displayName.trim() : null })
}

export async function isPasswordChangeSupported(): Promise<boolean> {
  return false
}

