import Config from "@/config"
import { getSupabaseAccessToken } from "@/config/supabase"
import { logger } from "@/utils/logger"
import { Platform } from "react-native"

export function getSecureApiBaseUrl() {
  const value = (Config as any).FUNCTIONS_BASE_URL
  if (typeof value === "string" && value.trim()) {
    const url = value.trim().replace(/\/+$/, "")
    logger.debug("[secureApi] Base URL resolved")
    return url
  }
  logger.error("[secureApi] Missing FUNCTIONS_BASE_URL in config")
  throw new Error("Missing FUNCTIONS_BASE_URL")
}

export async function getSecureApiIdToken() {
  try {
    const token = await getSupabaseAccessToken()
    return token
  } catch (error: any) {
    logger.error("[secureApi] Failed to get ID token")
    throw error
  }
}

export async function postToSecureApi(path: string, body: unknown) {
  const token = await getSecureApiIdToken()
  try {
    const dotCount = typeof token === "string" ? (token.match(/\./g) || []).length : 0
    logger.debug("[secureApi] Token format check", { dotCount, tokenLength: typeof token === "string" ? token.length : null })
  } catch {}
  const baseUrl = getSecureApiBaseUrl()
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`
  let res: Response
  try {
    res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    })
  } catch (error: any) {
    logger.error("[secureApi] Network request failed", { url, path })
    try {
      if (__DEV__ && Platform.OS === "android" && url.startsWith("http://127.0.0.1:8787/")) {
        logger.warn("[secureApi] Android physical device tip: run adb reverse tcp:8787 tcp:8787")
      }
    } catch {}
    throw error
  }

  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  if (!res.ok) {
    const message = (json && (json.error || json.message)) || text || `Request failed (${res.status})`
    logger.error("[secureApi] Request failed", { url, path, status: res.status, message })
    throw new Error(`Request failed (${res.status}): ${String(message)}`)
  }
  return json
}


