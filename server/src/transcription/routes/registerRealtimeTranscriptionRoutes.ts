import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { readBillingStatus } from "../../billing/store"
import { env } from "../../env"
import { asyncHandler, sendError } from "../../http"
import { readTranscriptionRuntimeSettings } from "../mode"
import { chargeSecondsOnce } from "../store"
import { markOperationCompleted } from "../actions/markOperationCompleted"
import { markOperationFailed } from "../actions/markOperationFailed"
import { readTranscriptionChargeContext } from "../actions/readTranscriptionChargeContext"
import type { RegisterTranscriptionRoutesParams } from "./types"

const REALTIME_TOKEN_TTL_SECONDS = 540

// Normalizes the Azure Speech region from configuration.
function normalizeRegion(value: string): string {
  return String(value || "").trim().toLowerCase()
}

// Normalizes the Speechmatics realtime URL from configuration.
function normalizeSpeechmaticsRealtimeUrl(value: string): string {
  const trimmed = String(value || "").trim()
  return trimmed.replace(/\/+$/g, "") || "wss://eu2.rt.speechmatics.com/v2"
}

// Issues one Azure Speech realtime token.
async function issueAzureSpeechToken(): Promise<{ token: string; region: string; expiresInSeconds: number }> {
  const key = String(env.azureSpeechKey || "").trim()
  const region = normalizeRegion(env.azureSpeechRegion)
  if (!key || !region) {
    throw new Error("Azure Speech is not configured")
  }

  const response = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Length": "0",
    },
  })
  const token = (await response.text().catch(() => "")).trim()
  if (!response.ok || !token) {
    throw new Error(`Failed to issue Azure Speech token (${response.status})`)
  }

  return { token, region, expiresInSeconds: REALTIME_TOKEN_TTL_SECONDS }
}

// Issues one Speechmatics realtime token.
async function issueSpeechmaticsRealtimeToken(): Promise<{ jwt: string; realtimeUrl: string; expiresInSeconds: number }> {
  const apiKey = String(env.speechmaticsApiKey || "").trim()
  if (!apiKey) {
    throw new Error("Speechmatics is not configured")
  }

  const response = await fetch("https://mp.speechmatics.com/v1/api_keys?type=rt", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl: REALTIME_TOKEN_TTL_SECONDS }),
  })
  const bodyText = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Failed to issue Speechmatics realtime token (${response.status})`)
  }

  let payload: any = null
  try {
    payload = bodyText ? JSON.parse(bodyText) : null
  } catch {
    payload = null
  }

  const jwt = String(payload?.key_value || payload?.jwt || payload?.token || "").trim()
  if (!jwt) {
    throw new Error("Failed to issue Speechmatics realtime token (empty token)")
  }

  return {
    jwt,
    realtimeUrl: normalizeSpeechmaticsRealtimeUrl(env.speechmaticsRealtimeUrl),
    expiresInSeconds: REALTIME_TOKEN_TTL_SECONDS,
  }
}

// Registers the realtime transcription endpoints.
export function registerRealtimeTranscriptionRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/runtime-config",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const settings = await readTranscriptionRuntimeSettings()
      const azureSpeechConfigured = !!String(env.azureSpeechKey || "").trim() && !!normalizeRegion(env.azureSpeechRegion)
      const speechmaticsConfigured = !!String(env.speechmaticsApiKey || "").trim()
      const whisperFastConfigured = !!String(env.selfHostedWhisperEndpoint || "").trim()

      res.status(200).json({
        mode: settings.mode,
        provider: settings.provider,
        providerConfigured:
          settings.provider === "azure-speech"
            ? azureSpeechConfigured
            : settings.provider === "speechmatics"
              ? speechmaticsConfigured
              : whisperFastConfigured,
        azureSpeechConfigured,
        speechmaticsConfigured,
        whisperFastConfigured,
      })
    }),
  )

  app.post(
    "/transcription/realtime/token",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const settings = await readTranscriptionRuntimeSettings()
      if (settings.mode !== "realtime") {
        sendError(res, 409, "Realtime transcription is disabled")
        return
      }

      try {
        if (settings.provider === "azure-speech") {
          res.status(200).json({ mode: settings.mode, provider: settings.provider, ...(await issueAzureSpeechToken()) })
          return
        }

        if (settings.provider === "speechmatics") {
          res.status(200).json({ mode: settings.mode, provider: settings.provider, ...(await issueSpeechmaticsRealtimeToken()) })
          return
        }
      } catch (error: any) {
        sendError(res, 500, String(error?.message || error))
        return
      }

      sendError(res, 500, "Unsupported realtime provider")
    }),
  )

  app.post(
    "/transcription/realtime/charge",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const settings = await readTranscriptionRuntimeSettings()
      if (settings.mode !== "realtime") {
        sendError(res, 409, "Realtime transcription is disabled")
        return
      }

      const operationId = typeof req.body?.operationId === "string" ? req.body.operationId.trim() : ""
      const durationSeconds = Number.isFinite(Number(req.body?.durationSeconds))
        ? Math.max(0, Math.floor(Number(req.body.durationSeconds)))
        : 0
      if (!operationId) {
        sendError(res, 400, "Missing operationId")
        return
      }
      if (durationSeconds <= 0) {
        sendError(res, 400, "Invalid durationSeconds")
        return
      }

      try {
        const chargeContext = await readTranscriptionChargeContext({ userId: user.userId })
        const charge = await chargeSecondsOnce({
          userId: user.userId,
          operationId,
          secondsToCharge: Math.max(1, durationSeconds),
          planKey: null,
          cycleStartMs: chargeContext.cycleStartMs,
          cycleEndMs: chargeContext.cycleEndMs,
          includedSecondsOverride: chargeContext.includedSecondsOverride,
          freeSecondsOverride: chargeContext.freeSecondsOverride,
          nonExpiringTotalSecondsOverride: undefined,
        })

        await markOperationCompleted({ operationId, userId: user.userId })

        const status = await readBillingStatus({
          userId: user.userId,
          planKey: null,
          cycleStartMs: chargeContext.cycleStartMs,
          cycleEndMs: chargeContext.cycleEndMs,
          includedSecondsOverride: chargeContext.includedSecondsOverride,
          freeSecondsOverride: chargeContext.freeSecondsOverride,
        })

        res.status(200).json({
          ok: true,
          secondsCharged: charge.secondsCharged,
          remainingSecondsAfter: charge.remainingSecondsAfter,
          remainingSeconds: status.remainingSeconds,
        })
      } catch (error: any) {
        const message = String(error?.message || error)
        await markOperationFailed({ operationId, userId: user.userId, errorMessage: message }).catch(() => undefined)
        sendError(res, message === "Not enough seconds remaining" ? 402 : 500, message)
      }
    }),
  )
}
