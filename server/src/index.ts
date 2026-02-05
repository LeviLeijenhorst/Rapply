import express, { type Request, type Response } from "express"
import crypto from "crypto"
import { env } from "./env"
import { asyncHandler, sendError } from "./http"
import {
  authImplementationVersion,
  requireAuthenticatedUser,
} from "./auth"
import { createCorsMiddleware, createRateLimitMiddleware, parseCorsAllowedOriginsFromEnv } from "./security"
import { ensureBillingUser, readBillingStatus } from "./billing/store"
import { derivePlanStateFromRevenueCatSubscriber, derivePurchasedSecondsFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "./billing/revenuecat"
import { randomBase64Url } from "./transcription/random"
import { createUploadToken, consumeUploadToken, chargeSecondsIdempotent, refundSecondsIdempotent } from "./transcription/store"
import { createEncryptedUploadUrl, deleteEncryptedUpload, deleteEncryptedUploadsByPrefix, fetchEncryptedUploadStream } from "./transcription/storage"
import { computeAudioDurationSecondsFromEncryptedUpload } from "./transcription/duration"
import { runVoxtralTranscriptionFromEncryptedUpload } from "./transcription/voxtral"
import { generateSummaryWithMistral } from "./summary/mistralSummary"
import { completeChatWithMistral } from "./chat/mistralChat"
import { execute } from "./db"
import { updateUserDisplayName } from "./users"
import {
  createCoachee,
  createNote,
  createSession,
  deleteCoachee,
  deleteNote,
  deleteSession,
  readAppData,
  setWrittenReport,
  updateCoachee,
  updateNote,
  updateSession,
  type Coachee,
  type Note,
  type Session,
  type WrittenReport,
} from "./appData"

const app = express()

app.set("trust proxy", true)

const corsAllowedOrigins = parseCorsAllowedOriginsFromEnv(env.corsAllowedOrigins)
app.use(
  createCorsMiddleware({
    runtimeEnvironment: env.runtimeEnvironment,
    allowedOrigins: corsAllowedOrigins,
  }),
)

app.use(express.json({ limit: "2mb" }))

const rateLimitWindowMs = Number.isFinite(env.rateLimitWindowMs) ? env.rateLimitWindowMs : 60_000
const rateLimitMaxRequests = Number.isFinite(env.rateLimitMaxRequests) ? env.rateLimitMaxRequests : 120

const rateLimitAi = createRateLimitMiddleware({ windowMs: rateLimitWindowMs, maxRequests: rateLimitMaxRequests, keyPrefix: "ai" })
const rateLimitBilling = createRateLimitMiddleware({ windowMs: rateLimitWindowMs, maxRequests: rateLimitMaxRequests, keyPrefix: "billing" })
const rateLimitTranscription = createRateLimitMiddleware({
  windowMs: rateLimitWindowMs,
  maxRequests: rateLimitMaxRequests,
  keyPrefix: "transcription",
})
const rateLimitAccount = createRateLimitMiddleware({ windowMs: rateLimitWindowMs, maxRequests: 10, keyPrefix: "account" })

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    build: {
      authImplementationVersion,
    },
    config: {
      database: {
        hasDatabaseUrl: !!env.databaseUrl,
        ssl: env.databaseSsl ? "on" : "off",
      },
      azureStorage: {
        hasAccountName: !!env.azureStorageAccountName,
        hasAccountKey: !!env.azureStorageAccountKey,
        transcriptionUploadsContainer: env.azureStorageTranscriptionUploadsContainer,
      },
      entra: {
        hasOpenIdConfigurationUrl: !!env.entraOpenIdConfigurationUrl,
        hasAudience: !!env.entraAudience,
      },
      mistral: {
        hasApiKey: !!env.mistralApiKey,
        transcriptionModel: env.mistralTranscriptionModel,
      },
      revenuecat: {
        hasSecretKey: !!env.revenueCatSecretKey,
      },
      security: {
        runtimeEnvironment: env.runtimeEnvironment,
        hasCorsAllowlist: !!corsAllowedOrigins?.length,
        rateLimitWindowMs,
        rateLimitMaxRequests,
      },
    },
  })
})

app.post(
  "/auth/me",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    res.status(200).json({ userId: user.userId, email: user.email, displayName: user.displayName, entraUserId: user.entraUserId })
  }),
)

app.post(
  "/auth/exchange-code",
  asyncHandler(async (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : ""
    const codeVerifier = typeof req.body?.codeVerifier === "string" ? req.body.codeVerifier.trim() : ""
    const redirectUri = typeof req.body?.redirectUri === "string" ? req.body.redirectUri.trim() : ""

    if (!code) {
      sendError(res, 400, "Missing code")
      return
    }
    if (!codeVerifier) {
      sendError(res, 400, "Missing codeVerifier")
      return
    }
    if (!redirectUri) {
      sendError(res, 400, "Missing redirectUri")
      return
    }

    console.log("[auth/exchange-code] using client credentials", {
      clientId: env.entraClientId,
      secretLength: env.entraClientSecret.length,
    })

    const configResponse = await fetch(env.entraOpenIdConfigurationUrl)
    if (!configResponse.ok) {
      sendError(res, 502, `Failed to load OpenID configuration (${configResponse.status})`)
      return
    }

    const openIdConfig = (await configResponse.json()) as any
    const tokenEndpoint = typeof openIdConfig?.token_endpoint === "string" ? openIdConfig.token_endpoint.trim() : ""
    if (!tokenEndpoint) {
      sendError(res, 502, "Missing token endpoint in OpenID configuration")
      return
    }

    const tokenParams = new URLSearchParams({
      client_id: env.entraClientId,
      client_secret: env.entraClientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    })

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      sendError(res, tokenResponse.status, `Token exchange failed: ${errorText}`)
      return
    }

    const tokenData = (await tokenResponse.json()) as any
    const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : ""
    const refreshToken = typeof tokenData?.refresh_token === "string" ? tokenData.refresh_token : null

    if (!accessToken) {
      sendError(res, 502, "Missing access token from provider")
      return
    }

    res.status(200).json({ accessToken, refreshToken })
  }),
)

app.post(
  "/auth/refresh-token",
  asyncHandler(async (req, res) => {
    const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : ""
    if (!refreshToken) {
      sendError(res, 400, "Missing refreshToken")
      return
    }

    const configResponse = await fetch(env.entraOpenIdConfigurationUrl)
    if (!configResponse.ok) {
      sendError(res, 502, `Failed to load OpenID configuration (${configResponse.status})`)
      return
    }

    const openIdConfig = (await configResponse.json()) as any
    const tokenEndpoint = typeof openIdConfig?.token_endpoint === "string" ? openIdConfig.token_endpoint.trim() : ""
    if (!tokenEndpoint) {
      sendError(res, 502, "Missing token endpoint in OpenID configuration")
      return
    }

    const tokenParams = new URLSearchParams({
      client_id: env.entraClientId,
      client_secret: env.entraClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    })

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      sendError(res, tokenResponse.status, `Token refresh failed: ${errorText}`)
      return
    }

    const tokenData = (await tokenResponse.json()) as any
    const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : ""
    const nextRefreshToken = typeof tokenData?.refresh_token === "string" ? tokenData.refresh_token : refreshToken

    if (!accessToken) {
      sendError(res, 502, "Missing access token from provider")
      return
    }

    res.status(200).json({ accessToken, refreshToken: nextRefreshToken })
  }),
)

app.post(
  "/app-data",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const data = await readAppData(user.userId)
    res.status(200).json(data)
  }),
)

app.post(
  "/coachees/create",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const coachee = readCoachee(req.body?.coachee)
    await createCoachee(user.userId, coachee)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/coachees/update",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const id = readId(payload.id, "id")
    const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
    const nameRaw = readOptionalText(payload.name)
    const name = typeof nameRaw === "string" ? nameRaw : undefined
    const isArchived = typeof payload.isArchived === "boolean" ? payload.isArchived : undefined
    await updateCoachee(user.userId, { id, name, isArchived, updatedAtUnixMs })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/coachees/delete",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.body?.id, "id")
    await deleteCoachee(user.userId, id)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/sessions/create",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const session = readSession(req.body?.session)
    await createSession(user.userId, session)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/sessions/update",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const id = readId(payload.id, "id")
    const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
    await updateSession(user.userId, {
      id,
      updatedAtUnixMs,
      coacheeId: payload.coacheeId === null ? null : readOptionalId(payload.coacheeId),
      title: (() => {
        const titleRaw = readOptionalText(payload.title)
        return typeof titleRaw === "string" ? titleRaw : undefined
      })(),
      transcript: readOptionalText(payload.transcript, true),
      summary: readOptionalText(payload.summary, true),
      transcriptionStatus: readOptionalTranscriptionStatus(payload.transcriptionStatus),
      transcriptionError: readOptionalText(payload.transcriptionError, true),
    })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/sessions/delete",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.body?.id, "id")
    await deleteSession(user.userId, id)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/notes/create",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const note = readNote(req.body?.note)
    await createNote(user.userId, note)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/notes/update",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const id = readId(payload.id, "id")
    const text = readText(payload.text, "text")
    const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
    await updateNote(user.userId, { id, text, updatedAtUnixMs })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/notes/delete",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.body?.id, "id")
    await deleteNote(user.userId, id)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/written-reports/set",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const report = readWrittenReport(req.body?.report)
    await setWrittenReport(user.userId, report)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/account/displayName",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName : null
    await updateUserDisplayName({ userId: user.userId, displayName })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/chat",
  rateLimitAi,
  asyncHandler(async (req, res) => {
    await requireAuthenticatedUser(req)

    const messages = req.body?.messages
    const temperature = req.body?.temperature

    const text = await completeChatWithMistral({ messages, temperature })
    res.status(200).json({ text })
  }),
)

app.post(
  "/subscriptionCancel/feedback",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    const selectedPlan = typeof req.body?.selectedPlan === "string" ? req.body.selectedPlan.trim() : ""
    const selectedReason = typeof req.body?.selectedReason === "string" ? req.body.selectedReason.trim() : ""
    const otherReasonText = typeof req.body?.otherReasonText === "string" ? req.body.otherReasonText.trim() : ""
    const tipsText = typeof req.body?.tipsText === "string" ? req.body.tipsText.trim() : ""

    if (!selectedPlan || !selectedReason) {
      sendError(res, 400, "Missing selectedPlan or selectedReason")
      return
    }

    await execute(
      `
      insert into public.subscription_cancel_feedback (
        id, user_id, selected_plan, selected_reason, other_reason_text, tips_text, account_email
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [crypto.randomUUID(), user.userId, selectedPlan, selectedReason, otherReasonText || null, tipsText || null, user.email],
    )

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/feedback",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""

    if (!message) {
      sendError(res, 400, "Missing message")
      return
    }

    await execute(
      `
      insert into public.feedback (id, user_id, name, email, message)
      values ($1, $2, $3, $4, $5)
      `,
      [crypto.randomUUID(), user.userId, name || null, email || null, message],
    )

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/praktijk/request",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : ""

    if (!email || !message) {
      sendError(res, 400, "Missing email or message")
      return
    }

    await execute(
      `
      insert into public.praktijk_requests (id, user_id, email, account_email, message)
      values ($1, $2, $3, $4, $5)
      `,
      [crypto.randomUUID(), user.userId, email, user.email, message],
    )

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/account/delete",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    await deleteEncryptedUploadsByPrefix({ prefix: `${user.userId}/` })

    await execute(`delete from public.users where id = $1`, [user.userId])

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/billing/sync",
  rateLimitBilling,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    await ensureBillingUser(user.userId)

    const subscriber = await fetchRevenueCatSubscriber(user.userId)
    const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
    const purchasedSecondsFromRevenueCat = derivePurchasedSecondsFromRevenueCatSubscriber(subscriber)

    await execute(`update public.billing_users set purchased_seconds = $1, updated_at = now() where user_id = $2`, [purchasedSecondsFromRevenueCat, user.userId])

    const billingStatus = await readBillingStatus({
      userId: user.userId,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
    })

    res.status(200).json({
      ok: true,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
      billingStatus,
    })
  }),
)

app.post(
  "/billing/status",
  rateLimitBilling,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    await ensureBillingUser(user.userId)

    const subscriber = await fetchRevenueCatSubscriber(user.userId)
    const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
    const billingStatus = await readBillingStatus({
      userId: user.userId,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
    })

    res.status(200).json({
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
      billingStatus,
    })
  }),
)

app.post(
  "/transcription/preflight",
  rateLimitTranscription,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    await ensureBillingUser(user.userId)

    const subscriber = await fetchRevenueCatSubscriber(user.userId)
    const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
    const status = await readBillingStatus({
      userId: user.userId,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
    })

    const remainingSeconds = status.remainingSeconds
    const allowed = remainingSeconds > 0
    if (!allowed) {
      res.status(200).json({ allowed: false, remainingSeconds, planKey: status.planKey })
      return
    }

    const operationId = randomBase64Url(16)
    const uploadPath = `${user.userId}/${operationId}/${Date.now()}.csa1`
    const token = await createUploadToken({ userId: user.userId, operationId, uploadPath })
    const upload = await createEncryptedUploadUrl({ blobName: uploadPath, expiresInSeconds: 10 * 60 })

    res.status(200).json({
      allowed: true,
      remainingSeconds,
      planKey: status.planKey,
      operationId,
      uploadToken: token.uploadToken,
      uploadPath,
      uploadUrl: upload.uploadUrl,
      uploadHeaders: upload.uploadHeaders,
      uploadTokenExpiresAtMs: token.expiresAtMs,
    })
  }),
)

app.post(
  "/transcription/start",
  rateLimitTranscription,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)

    const operationId = typeof req.body?.operationId === "string" ? req.body.operationId.trim() : ""
    const uploadToken = typeof req.body?.uploadToken === "string" ? req.body.uploadToken.trim() : ""
    const keyBase64 = typeof req.body?.keyBase64 === "string" ? req.body.keyBase64.trim() : ""
    const languageCode = typeof req.body?.language_code === "string" ? req.body.language_code.trim() : "nl"
    const mimeType = typeof req.body?.mime_type === "string" ? req.body.mime_type.trim() : "audio/m4a"

    if (!operationId) {
      sendError(res, 400, "Missing operationId")
      return
    }
    if (!uploadToken) {
      sendError(res, 400, "Missing uploadToken")
      return
    }
    if (!keyBase64) {
      sendError(res, 400, "Missing keyBase64")
      return
    }

    let uploadPath = ""

    try {
      const consumed = await consumeUploadToken({ userId: user.userId, uploadToken, operationId })
      uploadPath = consumed.uploadPath

      const expectedPrefix = `${user.userId}/`
      if (!uploadPath.startsWith(expectedPrefix)) {
        sendError(res, 403, "Invalid uploadPath")
        return
      }

      const durationStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
      const durationSeconds = await computeAudioDurationSecondsFromEncryptedUpload({ encryptedStream: durationStream, keyBase64, mimeType })
      const secondsToCharge = Math.max(1, Math.ceil(durationSeconds))

      const subscriber = await fetchRevenueCatSubscriber(user.userId)
      const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)

      const charge = await chargeSecondsIdempotent({
        userId: user.userId,
        operationId,
        secondsToCharge,
        planKey: planState.planKey,
        cycleStartMs: planState.cycleStartMs,
        cycleEndMs: planState.cycleEndMs,
      })

      const apiKey = env.mistralApiKey
      if (!apiKey) {
        throw new Error("Mistral API key is not configured")
      }

      const transcriptionStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
      const transcript = await runVoxtralTranscriptionFromEncryptedUpload({
        encryptedStream: transcriptionStream,
        keyBase64,
        mimeType,
        languageCode: languageCode || "nl",
        apiKey,
        model: env.mistralTranscriptionModel,
      })

      const summary = await generateSummaryWithMistral({ transcript })

      await execute(
        `
        update public.transcription_operations
        set status = 'completed',
            completed_at = now()
        where operation_id = $1
          and user_id = $2
        `,
        [operationId, user.userId],
      )

      res.status(200).json({
        transcript,
        text: transcript,
        summary,
        secondsCharged: charge.secondsCharged,
        remainingSecondsAfter: charge.remainingSecondsAfter,
        planKey: planState.planKey,
      })
    } catch (e: any) {
      try {
        await refundSecondsIdempotent({ userId: user.userId, operationId })
        await execute(
          `
          insert into public.transcription_operations (operation_id, user_id, status, failed_at, error_message)
          values ($1, $2, 'failed', now(), $3)
          on conflict (operation_id) do update
            set user_id = excluded.user_id,
                status = excluded.status,
                failed_at = now(),
                error_message = excluded.error_message
          `,
          [operationId, user.userId, String(e?.message || e)],
        )
      } catch {}
      sendError(res, 500, String(e?.message || e))
    } finally {
      try {
        if (uploadPath) {
          await deleteEncryptedUpload({ blobName: uploadPath })
        }
      } catch {}
    }
  }),
)

app.use((req: Request, res: Response) => {
  sendError(res, 404, `Not found: ${req.method} ${req.path}`)
})

app.use((err: any, _req: any, res: any, _next: any) => {
  const message = typeof err?.message === "string" ? err.message : String(err || "Unknown error")
  const status = typeof err?.status === "number" ? err.status : 500
  res.status(status).json({ error: message })
})

app.listen(env.port, () => {
  const hasMistralApiKey = !!env.mistralApiKey
  const transcriptionModel = env.mistralTranscriptionModel
  console.log(`[server] listening on http://127.0.0.1:${env.port}`)
  console.log(`[server] mistral configured: ${hasMistralApiKey ? "yes" : "no"}; model: ${transcriptionModel}`)
})

