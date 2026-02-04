import Config from "@/config"
import { logger } from "@/utils/logger"

export function getApiBaseUrl(): string {
  const value = (Config as any).FUNCTIONS_BASE_URL
  if (typeof value === "string" && value.trim()) {
    return value.trim().replace(/\/+$/, "")
  }
  logger.error("[api] Missing FUNCTIONS_BASE_URL in config")
  throw new Error("Missing FUNCTIONS_BASE_URL")
}

