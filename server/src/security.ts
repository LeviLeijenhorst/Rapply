import type { Request, Response, NextFunction } from "express"
import cors, { type CorsOptions } from "cors"

function normalizeOrigin(value: string): string {
  const trimmed = String(value || "").trim()
  return trimmed.replace(/\/+$/g, "")
}

function parseCommaSeparatedList(value: string | null): string[] {
  const raw = typeof value === "string" ? value : ""
  return raw
    .split(",")
    .map((x) => normalizeOrigin(x))
    .filter((x) => !!x)
}

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
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }
      const normalized = normalizeOrigin(origin)
      if (!allowedOrigins || allowedOrigins.length === 0) {
        callback(null, true)
        return
      }
      callback(null, allowedOrigins.includes(normalized))
    },
  }

  return cors(options)
}

type RateLimitBucket = {
  windowStartMs: number
  count: number
}

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
      res.status(429).json({ error: "Too many requests, please try again later" })
      return
    }

    next()
  }
}

export function parseCorsAllowedOriginsFromEnv(value: string | null): string[] | null {
  const parsed = parseCommaSeparatedList(value)
  return parsed.length > 0 ? parsed : null
}

