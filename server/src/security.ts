import type { Request, Response, NextFunction } from "express"
import cors, { type CorsOptions } from "cors"

// Normalizes an origin by trimming and removing trailing slashes.
function normalizeOrigin(value: string): string {
  const trimmed = String(value || "").trim()
  return trimmed.replace(/\/+$/g, "")
}

function normalizeHostname(value: string): string {
  const normalized = String(value || "").trim().toLowerCase()
  return normalized.startsWith("www.") ? normalized.slice(4) : normalized
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isOriginAllowed(allowedOrigins: string[], origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin)
  const parsedOrigin = tryParseUrl(normalizedOrigin)
  const originHostname = normalizeHostname(parsedOrigin?.hostname || "")

  for (const allowedOrigin of allowedOrigins) {
    const normalizedAllowedOrigin = normalizeOrigin(allowedOrigin)
    if (!normalizedAllowedOrigin) {
      continue
    }

    if (normalizedAllowedOrigin === normalizedOrigin) {
      return true
    }

    const parsedAllowedOrigin = tryParseUrl(normalizedAllowedOrigin)
    if (parsedOrigin && parsedAllowedOrigin) {
      if (
        normalizeHostname(parsedAllowedOrigin.hostname) === originHostname &&
        parsedAllowedOrigin.protocol === parsedOrigin.protocol
      ) {
        return true
      }
      continue
    }

    if (!parsedOrigin) {
      continue
    }

    const normalizedAllowedHost = normalizeHostname(
      normalizedAllowedOrigin
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, ""),
    )

    if (normalizedAllowedHost && normalizedAllowedHost === originHostname) {
      return true
    }
  }

  return false
}

// Parses a comma-separated env allowlist into normalized origin values.
function parseCommaSeparatedList(value: string | null): string[] {
  const raw = typeof value === "string" ? value : ""
  return raw
    .split(",")
    .map((x) => normalizeOrigin(x))
    .filter((x) => !!x)
}

// Builds the CORS middleware with strict production requirements.
export function createCorsMiddleware(params: {
  runtimeEnvironment: string
  allowedOrigins: string[] | null
}) {
  const runtimeEnvironment = String(params.runtimeEnvironment || "development").trim() || "development"
  const allowedOrigins = params.allowedOrigins

  if (runtimeEnvironment === "production") {
    if (!allowedOrigins || allowedOrigins.length === 0) {
      throw new Error("Missing CORS_ALLOWED_ORIGINS for production")
    }
  }

  const options: CorsOptions = {
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "x-ingest-token",
      "x-chunk-index",
      "x-start-milliseconds",
      "x-duration-milliseconds",
    ],
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true)
        return
      }
      if (runtimeEnvironment !== "production") {
        callback(null, true)
        return
      }
      const normalized = normalizeOrigin(origin)
      if (!allowedOrigins || allowedOrigins.length === 0) {
        callback(null, true)
        return
      }
      callback(null, isOriginAllowed(allowedOrigins, normalized))
    },
  }

  return cors(options)
}

type RateLimitBucket = {
  windowStartMs: number
  count: number
}

// Intent: createRateLimitMiddleware
export function createRateLimitMiddleware(params: {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}) {
  const windowMs = Number.isFinite(params.windowMs) ? Math.max(1_000, Math.floor(params.windowMs)) : 60_000
  const maxRequests = Number.isFinite(params.maxRequests) ? Math.max(1, Math.floor(params.maxRequests)) : 120
  const keyPrefix = String(params.keyPrefix || "global").trim() || "global"

  const buckets = new Map<string, RateLimitBucket>()

  return (req: Request, res: Response, next: NextFunction) => {
    const nowMs = Date.now()

    const ip =
      typeof req.ip === "string" && req.ip.trim()
        ? req.ip.trim()
        : typeof req.socket?.remoteAddress === "string"
          ? String(req.socket.remoteAddress)
          : "unknown"

    const key = `${keyPrefix}:${ip}`
    const existing = buckets.get(key)
    const isNewWindow = !existing || nowMs - existing.windowStartMs >= windowMs
    const bucket: RateLimitBucket = isNewWindow ? { windowStartMs: nowMs, count: 0 } : existing!

    bucket.count += 1
    buckets.set(key, bucket)

    if (bucket.count > maxRequests) {
      console.log("[rate-limit] blocked", {
        keyPrefix,
        method: req.method,
        path: req.path,
        ip,
        count: bucket.count,
        maxRequests,
        windowMs,
      })
      res.status(429).json({ error: "Too many requests, please try again later" })
      return
    }

    next()
  }
}

// Parses and validates configured CORS allowlist values from env.
export function parseCorsAllowedOriginsFromEnv(value: string | null): string[] | null {
  const parsed = parseCommaSeparatedList(value)
  return parsed.length > 0 ? parsed : null
}
