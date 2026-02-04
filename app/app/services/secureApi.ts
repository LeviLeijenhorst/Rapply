import { Platform } from "react-native"

import { logger } from "@/utils/logger"

import { getApiBaseUrl } from "./apiBaseUrl"
import { requireAccessToken } from "./auth"

export async function getSecureApiIdToken() {
  try {
    return await requireAccessToken()
  } catch (error: any) {
    logger.error("[secureApi] Failed to get ID token")
    throw error
  }
}

export async function postToSecureApi(path: string, body: unknown) {
  const token = await getSecureApiIdToken()
  const baseUrl = getApiBaseUrl()
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
