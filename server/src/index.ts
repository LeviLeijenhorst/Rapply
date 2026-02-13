import express, { type Request, type Response } from "express"
import crypto from "crypto"
import { env } from "./env"
import { asyncHandler, sendError } from "./http"
import {
  authImplementationVersion,
  requireAuthenticatedUser,
} from "./auth"
import { createCorsMiddleware, createRateLimitMiddleware, parseCorsAllowedOriginsFromEnv } from "./security"
import { applyUnlimitedTranscriptionToBillingStatus, isUnlimitedTranscriptionEmail, unlimitedTranscriptionRemainingSeconds } from "./billing/unlimitedTranscription"
import { applyFixedTranscriptionToBillingStatus, getFixedTranscriptionTotalSeconds, isFixedTranscriptionEmail } from "./billing/fixedTranscription"
import { applyTestTranscriptionToBillingStatus, getTestTranscriptionTotalSeconds, isTestTranscriptionEmail } from "./billing/testTranscription"
import { ensureBillingUser, readBillingStatus, type BillingStatus } from "./billing/store"
import { derivePlanStateFromRevenueCatSubscriber, derivePurchasedSecondsFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "./billing/revenuecat"
import { randomBase64Url } from "./transcription/random"
import { createUploadToken, consumeUploadToken, chargeSecondsIdempotent, refundSecondsIdempotent } from "./transcription/store"
import { createEncryptedUploadUrl, deleteEncryptedUpload, deleteEncryptedUploadsByPrefix, fetchEncryptedUploadStream, getEncryptedUploadSize } from "./transcription/storage"
import { computeAudioDurationSecondsFromEncryptedUpload } from "./transcription/duration"
import { runVoxtralTranscriptionFromEncryptedUpload } from "./transcription/voxtral"
import { runAzureSpeechTranscriptionFromEncryptedUpload } from "./transcription/azureSpeechTranscription"
import { generateSummary } from "./summary/summary"
import { completeChatWithAzureOpenAi } from "./chat/azureOpenAiChat"
import { execute, getDatabaseConnectionInfo, queryMany, testDatabaseConnection } from "./db"
import { updateUserDisplayName } from "./users"
import { deleteEntraUserById } from "./entraGraph"
import { createAudioBlob, readAudioBlob } from "./audioBlobs"
import { createAudioStream, createAudioStreamChunk, readAudioStreamChunk, readAudioStreamManifest, updateAudioStreamDetails } from "./audioStreams"
import * as e2eeV2 from "./e2eeV2"
import { createDefaultTemplates } from "./templates/defaultTemplates"
import {
  createCoachee,
  createNote,
  createSession,
  createTemplate,
  deleteCoachee,
  deleteNote,
  deleteSession,
  deleteTemplate,
  readAppData,
  setWrittenReport,
  updateCoachee,
  updateNote,
  updateSession,
  updateTemplate,
  updatePracticeSettings,
  type Coachee,
  type Note,
  type Session,
  type Template,
  type WrittenReport,
} from "./appData"

function applyEmailBillingOverrides(status: BillingStatus, email: string | null): BillingStatus {
  if (isUnlimitedTranscriptionEmail(email)) {
    return applyUnlimitedTranscriptionToBillingStatus(status)
  }
  if (isFixedTranscriptionEmail(email)) {
    return applyFixedTranscriptionToBillingStatus(status)
  }
  if (isTestTranscriptionEmail(email)) {
    return applyTestTranscriptionToBillingStatus(status)
  }
  return status
}

function getNonExpiringTotalSecondsOverrideForEmail(email: string | null): number | undefined {
  if (isUnlimitedTranscriptionEmail(email)) {
    return unlimitedTranscriptionRemainingSeconds
  }
  if (isFixedTranscriptionEmail(email)) {
    const totalSeconds = getFixedTranscriptionTotalSeconds()
    return totalSeconds > 0 ? totalSeconds : undefined
  }
  if (isTestTranscriptionEmail(email)) {
    const totalSeconds = getTestTranscriptionTotalSeconds()
    return totalSeconds > 0 ? totalSeconds : undefined
  }
  return undefined
}

const app = express()

app.set("trust proxy", true)

const databaseConnectionInfo = getDatabaseConnectionInfo()
console.log("[db] configured", databaseConnectionInfo)
testDatabaseConnection()
  .then(() => {
    console.log("[db] connection ok")
  })
  .catch((error: any) => {
    const message = String(error?.message || error || "")
    const stack = typeof error?.stack === "string" ? error.stack : null
    console.log("[db] connection failed", { message, stack })
  })

const corsAllowedOrigins = parseCorsAllowedOriginsFromEnv(env.corsAllowedOrigins)
app.use(
  createCorsMiddleware({
    runtimeEnvironment: env.runtimeEnvironment,
    allowedOrigins: corsAllowedOrigins,
  }),
)

app.use((req, _res, next) => {
  if (req.method === "POST" && req.path === "/transcription/start") {
    console.error("[request] POST /transcription/start reached Express (global middleware)")
  }
  next()
})

app.post(
  "/audio-blobs",
  express.raw({ type: "*/*", limit: "1024mb" }),
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const mimeType = String(req.headers["content-type"] || "").trim() || "application/octet-stream"
    const body = req.body
    if (!Buffer.isBuffer(body) || body.length === 0) {
      sendError(res, 400, "Missing audio bytes")
      return
    }

    const created = await createAudioBlob({
      userId: user.userId,
      mimeType,
      bytes: body,
      createdAtUnixMs: Date.now(),
    })

    res.status(200).json({ audioBlobId: created.id })
  }),
)

app.get(
  "/audio-blobs/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = String(req.params?.id || "").trim()
    if (!id) {
      sendError(res, 400, "Missing id")
      return
    }

    const result = await readAudioBlob({ userId: user.userId, id })
    if (!result) {
      sendError(res, 404, "Audio not found")
      return
    }

    res.setHeader("Content-Type", result.mimeType)
    res.status(200).send(result.bytes)
  }),
)

app.use(express.json({ limit: "2mb" }))

app.post(
  "/audio-streams",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const mimeType = readText(payload.mimeType, "mimeType")
    const created = await createAudioStream({ userId: user.userId, mimeType, createdAtUnixMilliseconds: Date.now() })
    res.status(200).json({ audioStreamId: created.id })
  }),
)

app.patch(
  "/audio-streams/:id",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.params?.id, "id")
    const payload = req.body || {}
    const totalDurationMilliseconds = readRequiredNumber(payload.totalDurationMilliseconds, "totalDurationMilliseconds")
    const chunkCount = readRequiredNumber(payload.chunkCount, "chunkCount")
    await updateAudioStreamDetails({ userId: user.userId, id, totalDurationMilliseconds, chunkCount })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/audio-streams/:id/chunks",
  express.raw({ type: "*/*", limit: "50mb" }),
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.params?.id, "id")
    const chunkIndex = readRequiredNumber(req.headers["x-chunk-index"], "chunkIndex")
    const startMilliseconds = readRequiredNumber(req.headers["x-start-milliseconds"], "startMilliseconds")
    const durationMilliseconds = readRequiredNumber(req.headers["x-duration-milliseconds"], "durationMilliseconds")
    const body = req.body
    if (!Buffer.isBuffer(body) || body.length === 0) {
      sendError(res, 400, "Missing chunk bytes")
      return
    }
    await createAudioStreamChunk({
      userId: user.userId,
      audioStreamId: id,
      chunkIndex,
      startMilliseconds,
      durationMilliseconds,
      bytes: body,
      createdAtUnixMilliseconds: Date.now(),
    })
    res.status(200).json({ ok: true })
  }),
)

app.get(
  "/audio-streams/:id/manifest",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.params?.id, "id")
    const result = await readAudioStreamManifest({ userId: user.userId, id })
    if (!result) {
      sendError(res, 404, "Audio not found")
      return
    }
    res.status(200).json({
      audioStreamId: result.id,
      mimeType: result.mimeType,
      totalDurationMilliseconds: result.totalDurationMilliseconds,
      chunkCount: result.chunkCount,
      chunks: result.chunks,
    })
  }),
)

app.get(
  "/audio-streams/:id/chunks/:chunkIndex",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.params?.id, "id")
    const chunkIndex = readRequiredNumber(req.params?.chunkIndex, "chunkIndex")
    const result = await readAudioStreamChunk({ userId: user.userId, id, chunkIndex })
    if (!result) {
      sendError(res, 404, "Audio not found")
      return
    }
    res.setHeader("Content-Type", "application/octet-stream")
    res.status(200).send(result.bytes)
  }),
)

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

const diagnosticLogVersion = "2026-02-12-global-request-log"
const defaultAdminFeedbackEmail = "contact@jnlsolutions.nl"
const adminFeedbackEmailSet = new Set(
  (env.adminFeedbackEmails.length ? env.adminFeedbackEmails : [defaultAdminFeedbackEmail]).map((email) => email.trim().toLowerCase()).filter(Boolean),
)

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    build: {
      authImplementationVersion,
      diagnosticLogVersion,
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
      e2eeEscrow: {
        configured: !!env.e2eeEscrowServiceUrl && !!env.e2eeEscrowServiceApiKey,
      },
    },
  })
})

app.get("/debug/transcription-provider", (_req: Request, res: Response) => {
  res.status(200).json({
    mistralKeyPresent: !!env.mistralApiKey,
    mistralModel: env.mistralTranscriptionModel,
    azureSpeechConfigured: !!env.azureSpeechKey && !!env.azureSpeechRegion,
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
  "/e2ee/v2/bootstrap",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const result = await e2eeV2.bootstrap({ userId: user.userId })
    res.status(200).json(result)
  }),
)

app.post(
  "/e2ee/v2/setup",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}

    const argon2Salt = readText(payload.argon2Salt, "argon2Salt")
    const argon2TimeCost = readRequiredNumber(payload.argon2TimeCost, "argon2TimeCost")
    const argon2MemoryCostKib = readRequiredNumber(payload.argon2MemoryCostKib, "argon2MemoryCostKib")
    const argon2Parallelism = readRequiredNumber(payload.argon2Parallelism, "argon2Parallelism")
    const wrappedArkUserPassphrase = readText(payload.wrappedArkUserPassphrase, "wrappedArkUserPassphrase")
    const wrappedArkRecoveryCode = readOptionalText(payload.wrappedArkRecoveryCode, true) ?? null
    const keyVersion = readRequiredInteger(payload.keyVersion ?? 1, "keyVersion")
    const cryptoVersion = readRequiredInteger(payload.cryptoVersion ?? 1, "cryptoVersion")
    const recoveryPolicy = readOptionalRecoveryPolicy(payload.recoveryPolicy) ?? "self_service"
    const custodianThreshold = readOptionalInteger(payload.custodianThreshold)
    validateArgon2Params({
      argon2TimeCost,
      argon2MemoryCostKib,
      argon2Parallelism,
    })

    await e2eeV2.setupUserKeys({
      userId: user.userId,
      argon2Salt,
      argon2TimeCost,
      argon2MemoryCostKib,
      argon2Parallelism,
      wrappedArkUserPassphrase,
      wrappedArkRecoveryCode,
      keyVersion,
      cryptoVersion,
      recoveryPolicy,
      custodianThreshold,
      nowUnixMs: Date.now(),
    })

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/e2ee/v2/user-key-material",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const material = await e2eeV2.readUserKeyMaterial({ userId: user.userId })
    if (!material) {
      sendError(res, 404, "E2EE not configured")
      return
    }
    res.status(200).json(material)
  }),
)

app.post(
  "/e2ee/v2/recovery-code/set",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const wrappedArkRecoveryCode = readOptionalText(payload.wrappedArkRecoveryCode, true) ?? null
    await e2eeV2.setRecoveryWrappedArk({
      userId: user.userId,
      wrappedArkRecoveryCode,
      nowUnixMs: Date.now(),
    })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/e2ee/v2/passphrase/rotate",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const argon2Salt = readText(payload.argon2Salt, "argon2Salt")
    const argon2TimeCost = readRequiredNumber(payload.argon2TimeCost, "argon2TimeCost")
    const argon2MemoryCostKib = readRequiredNumber(payload.argon2MemoryCostKib, "argon2MemoryCostKib")
    const argon2Parallelism = readRequiredNumber(payload.argon2Parallelism, "argon2Parallelism")
    const wrappedArkUserPassphrase = readText(payload.wrappedArkUserPassphrase, "wrappedArkUserPassphrase")
    const keyVersion = readRequiredInteger(payload.keyVersion, "keyVersion")
    validateArgon2Params({
      argon2TimeCost,
      argon2MemoryCostKib,
      argon2Parallelism,
    })

    await e2eeV2.rotatePassphraseWrappedArk({
      userId: user.userId,
      argon2Salt,
      argon2TimeCost,
      argon2MemoryCostKib,
      argon2Parallelism,
      wrappedArkUserPassphrase,
      keyVersion,
      nowUnixMs: Date.now(),
    })

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/e2ee/v2/object-key/upsert",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const objectType = readRequiredObjectType(payload.objectType)
    const objectId = readId(payload.objectId, "objectId")
    const keyVersion = readRequiredInteger(payload.keyVersion, "keyVersion")
    const cryptoVersion = readRequiredInteger(payload.cryptoVersion ?? 1, "cryptoVersion")
    const wrappedDek = readText(payload.wrappedDek, "wrappedDek")
    await e2eeV2.upsertObjectKey({
      userId: user.userId,
      objectType,
      objectId,
      keyVersion,
      cryptoVersion,
      wrappedDek,
      nowUnixMs: Date.now(),
    })
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/e2ee/v2/object-key/get",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const objectType = readRequiredObjectType(payload.objectType)
    const objectId = readId(payload.objectId, "objectId")
    const objectKeys = await e2eeV2.readObjectKeys({ userId: user.userId, objectType, objectId })
    res.status(200).json({ objectKeys })
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
    const name = readOptionalText(payload.name)
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
      title: readOptionalText(payload.title),
      audioBlobId: readOptionalText(payload.audioBlobId, true),
      audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds),
      uploadFileName: readOptionalText(payload.uploadFileName, true),
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
  "/templates/create",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const template = readTemplate(req.body?.template)
    await createTemplate(user.userId, template)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/templates/update",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const template = readTemplate(req.body?.template)
    await updateTemplate(user.userId, template)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/templates/delete",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.body?.id, "id")
    await deleteTemplate(user.userId, id)
    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/templates/defaults",
  asyncHandler(async (_req, res) => {
    const templates = createDefaultTemplates()
    res.status(200).json({ templates })
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
  "/practice-settings/update",
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const payload = req.body || {}
    const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
    await updatePracticeSettings(user.userId, {
      practiceName: readOptionalText(payload.practiceName, true),
      website: readOptionalText(payload.website, true),
      tintColor: readOptionalText(payload.tintColor, true),
      logoDataUrl: readOptionalText(payload.logoDataUrl, true),
      updatedAtUnixMs,
    })
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

    const text = await completeChatWithAzureOpenAi({ messages, temperature })
    res.status(200).json({ text })
  }),
)

app.post(
  "/summary/generate",
  rateLimitAi,
  asyncHandler(async (req, res) => {
    await requireAuthenticatedUser(req)

    const transcript = typeof req.body?.transcript === "string" ? req.body.transcript : ""
    const template = readSummaryTemplate(req.body?.template)

    if (!String(transcript || "").trim()) {
      sendError(res, 400, "Missing transcript")
      return
    }

    const summary = await generateSummary({ transcript, template })
    res.status(200).json({ summary })
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
  "/admin/feedback/list",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const normalizedEmail = String(user.email || "").trim().toLowerCase()
    if (!adminFeedbackEmailSet.has(normalizedEmail)) {
      sendError(res, 403, "Forbidden")
      return
    }

    const requestedLimitRaw = Number(req.body?.limit)
    const requestedLimit = Number.isFinite(requestedLimitRaw) ? Math.trunc(requestedLimitRaw) : 200
    const limit = Math.min(500, Math.max(1, requestedLimit))

    const rows = await queryMany<{
      id: string
      user_id: string
      name: string | null
      email: string | null
      message: string
      created_at: string
      account_email: string | null
    }>(
      `
      select
        f.id,
        f.user_id,
        f.name,
        f.email,
        f.message,
        f.created_at,
        u.email as account_email
      from public.feedback f
      left join public.users u on u.id = f.user_id
      order by f.created_at desc
      limit $1
      `,
      [limit],
    )

    res.status(200).json({
      items: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        accountEmail: row.account_email,
        message: row.message,
        createdAt: row.created_at,
      })),
    })
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
    const confirmTextRaw = typeof req.body?.confirmText === "string" ? req.body.confirmText.trim() : ""
    const confirmText = confirmTextRaw.toUpperCase()
    if (confirmTextRaw && confirmText !== "VERWIJDEREN") {
      sendError(res, 400, "Bevestigingstekst ongeldig")
      return
    }

    try {
      await deleteEntraUserById(user.entraUserId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log("[account/delete] Entra deletion failed", { userId: user.userId, entraUserId: user.entraUserId, message })
      const hasPermissionError =
        message.includes("Authorization_RequestDenied") ||
        message.includes("Insufficient privileges") ||
        message.includes("Permission") ||
        message.includes("permissions")
      sendError(
        res,
        502,
        hasPermissionError
          ? "Kon Entra account niet verwijderen. Controleer Microsoft Graph permissies (User.ReadWrite.All) en admin consent voor de backend app-registratie."
          : "Kon Entra account niet verwijderen. Controleer de Entra Graph configuratie op de server.",
      )
      return
    }

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

    const billingStatusRaw = await readBillingStatus({
      userId: user.userId,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
    })
    const billingStatus = applyEmailBillingOverrides(billingStatusRaw, user.email)

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
    const billingStatusRaw = await readBillingStatus({
      userId: user.userId,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
    })
    const billingStatus = applyEmailBillingOverrides(billingStatusRaw, user.email)

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
    const statusRaw = await readBillingStatus({
      userId: user.userId,
      planKey: planState.planKey,
      cycleStartMs: planState.cycleStartMs,
      cycleEndMs: planState.cycleEndMs,
    })
    const status = applyEmailBillingOverrides(statusRaw, user.email)

    const remainingSeconds = status.remainingSeconds
    const allowed = remainingSeconds > 0
    const mistralKeyPresent = !!env.mistralApiKey
    const azureSpeechConfigured = !!env.azureSpeechKey && !!env.azureSpeechRegion
    const transcriptionProvider = mistralKeyPresent ? "mistral" : azureSpeechConfigured ? "azure-speech" : "none"
    const requiresWav = transcriptionProvider === "azure-speech"
    if (!allowed) {
      res.status(200).json({ allowed: false, remainingSeconds, planKey: status.planKey, transcriptionProvider, requiresWav })
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
      transcriptionProvider,
      requiresWav,
    })
  }),
)

app.post(
  "/transcription/start",
  (req, _res, next) => {
    console.error("[transcription] POST /transcription/start received (before rate limit)")
    next()
  },
  rateLimitTranscription,
  asyncHandler(async (req, res) => {
    console.error("[transcription] POST /transcription/start hit")
    const user = await requireAuthenticatedUser(req)
    const startedAtMs = Date.now()

    const operationId = typeof req.body?.operationId === "string" ? req.body.operationId.trim() : ""
    const uploadToken = typeof req.body?.uploadToken === "string" ? req.body.uploadToken.trim() : ""
    const keyBase64 = typeof req.body?.keyBase64 === "string" ? req.body.keyBase64.trim() : ""
    const languageCode = typeof req.body?.language_code === "string" ? req.body.language_code.trim() : "nl"
    const mimeType = typeof req.body?.mime_type === "string" ? req.body.mime_type.trim() : "audio/m4a"
    const preferProvider = typeof req.body?.prefer_provider === "string" ? req.body.prefer_provider.trim() : ""
    const includeSummary = req.body?.include_summary !== false

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

    console.error("[transcription] start received", { operationId, mimeType })

    let uploadPath = ""

    let transcriptionProvider = "unknown"
    const mistralKeyPresent = !!env.mistralApiKey
    const azureSpeechConfigured = !!env.azureSpeechKey && !!env.azureSpeechRegion
    let tokenMs = 0
    let durationMs = 0
    let billingMs = 0
    let transcriptionMs = 0
    let summaryMs = 0

    try {
      const tokenStartedAtMs = Date.now()
      const consumed = await consumeUploadToken({ userId: user.userId, uploadToken, operationId })
      tokenMs = Date.now() - tokenStartedAtMs
      uploadPath = consumed.uploadPath

      const expectedPrefix = `${user.userId}/`
      if (!uploadPath.startsWith(expectedPrefix)) {
        sendError(res, 403, "Invalid uploadPath")
        return
      }

      const durationStartedAtMs = Date.now()
      const uploadBytes = await getEncryptedUploadSize({ blobName: uploadPath })
      console.error("[transcription] duration input", { operationId, uploadPath, uploadBytes, mimeType })
      let durationSeconds = 0
      try {
        const durationStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
        durationSeconds = await computeAudioDurationSecondsFromEncryptedUpload({
          encryptedStream: durationStream,
          keyBase64,
          mimeType,
          encryptedSizeBytes: uploadBytes,
        })
      } catch (firstError: any) {
        console.error("[transcription] duration first attempt failed", {
          operationId,
          uploadBytes,
          mimeType,
          errorMessage: String(firstError?.message || firstError),
        })
        const fallbackDurationStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
        durationSeconds = await computeAudioDurationSecondsFromEncryptedUpload({
          encryptedStream: fallbackDurationStream,
          keyBase64,
          mimeType: "",
          encryptedSizeBytes: uploadBytes,
        })
      }
      const secondsToCharge = Math.max(1, Math.ceil(durationSeconds))
      durationMs = Date.now() - durationStartedAtMs

      const billingStartedAtMs = Date.now()
      const subscriber = await fetchRevenueCatSubscriber(user.userId)
      const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)

      let charge: { secondsCharged: number; remainingSecondsAfter: number }
      const nonExpiringTotalSecondsOverride = getNonExpiringTotalSecondsOverrideForEmail(user.email)
      try {
        charge = await chargeSecondsIdempotent({
          userId: user.userId,
          operationId,
          secondsToCharge,
          planKey: planState.planKey,
          cycleStartMs: planState.cycleStartMs,
          cycleEndMs: planState.cycleEndMs,
          nonExpiringTotalSecondsOverride,
        })
      } catch (e: any) {
        const message = String(e?.message || e)
        if (message === "Not enough seconds remaining") {
          const statusRaw = await readBillingStatus({
            userId: user.userId,
            planKey: planState.planKey,
            cycleStartMs: planState.cycleStartMs,
            cycleEndMs: planState.cycleEndMs,
          })
          const status = applyEmailBillingOverrides(statusRaw, user.email)
          sendError(
            res,
            402,
            `Not enough seconds remaining. Needed ${secondsToCharge}s, remaining ${status.remainingSeconds}s.`,
          )
          return
        }
        throw e
      }
      billingMs = Date.now() - billingStartedAtMs

      const apiKey = env.mistralApiKey
      const azureSpeechKey = env.azureSpeechKey
      const azureSpeechRegion = env.azureSpeechRegion
      transcriptionProvider = apiKey ? "mistral" : azureSpeechKey && azureSpeechRegion ? "azure-speech" : "none"
      console.error("[transcription] start", { operationId, durationSeconds, uploadBytes, mimeType, provider: transcriptionProvider })

      if (preferProvider === "mistral" && !apiKey) {
        throw new Error("Mistral transcription was requested but MISTRAL_API_KEY is missing.")
      }

      let transcript = ""
      if (apiKey && preferProvider === "mistral") {
        const transcriptionStartedAtMs = Date.now()
        const transcriptionStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
        transcript = await runVoxtralTranscriptionFromEncryptedUpload({
          encryptedStream: transcriptionStream,
          keyBase64,
          mimeType,
          languageCode: languageCode || "nl",
          apiKey,
          model: env.mistralTranscriptionModel,
        })
        transcriptionMs = Date.now() - transcriptionStartedAtMs
      } else if (apiKey) {
        const transcriptionStartedAtMs = Date.now()
        const transcriptionStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
        transcript = await runVoxtralTranscriptionFromEncryptedUpload({
          encryptedStream: transcriptionStream,
          keyBase64,
          mimeType,
          languageCode: languageCode || "nl",
          apiKey,
          model: env.mistralTranscriptionModel,
        })
        transcriptionMs = Date.now() - transcriptionStartedAtMs
      } else if (azureSpeechKey && azureSpeechRegion) {
        const transcriptionStartedAtMs = Date.now()
        const transcriptionStream = await fetchEncryptedUploadStream({ blobName: uploadPath })
        transcript = await runAzureSpeechTranscriptionFromEncryptedUpload({
          encryptedStream: transcriptionStream,
          keyBase64,
          mimeType,
          languageCode: languageCode || "nl",
        })
        transcriptionMs = Date.now() - transcriptionStartedAtMs
      } else {
        throw new Error("No transcription provider is configured")
      }

      let summary = ""
      if (includeSummary) {
        const summaryStartedAtMs = Date.now()
        summary = await generateSummary({ transcript })
        summaryMs = Date.now() - summaryStartedAtMs
      }
      console.error("[transcription] timing", {
        operationId,
        tokenMs,
        durationMs,
        billingMs,
        transcriptionMs,
        summaryMs,
        totalMs: Date.now() - startedAtMs,
      })

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
      const errorMessage = String(e?.message || e)
      sendError(
        res,
        500,
        `${errorMessage} (provider=${transcriptionProvider}; mistralKeyPresent=${mistralKeyPresent}; azureSpeechConfigured=${azureSpeechConfigured})`,
      )
    } finally {
      try {
        if (uploadPath) {
          await deleteEncryptedUpload({ blobName: uploadPath })
        }
      } catch {}
    }
  }),
)

app.post(
  "/transcription/cancel",
  rateLimitTranscription,
  asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const operationId = typeof req.body?.operationId === "string" ? req.body.operationId.trim() : ""
    if (!operationId) {
      sendError(res, 400, "Missing operationId")
      return
    }

    await refundSecondsIdempotent({ userId: user.userId, operationId })
    res.status(200).json({ cancelled: true })
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
  const hasAzureOpenAiEndpoint = !!String(env.azureOpenAiEndpoint || "").trim()
  const hasAzureOpenAiKey = !!String(env.azureOpenAiKey || "").trim()
  const hasAzureOpenAiChatDeployment = !!String(env.azureOpenAiChatDeployment || "").trim()
  const hasAzureOpenAiSummaryDeployment = !!String(env.azureOpenAiSummaryDeployment || "").trim()
  console.log(`[server] listening on http://127.0.0.1:${env.port}`)
  console.log(`[server] mistral configured: ${hasMistralApiKey ? "yes" : "no"}; model: ${transcriptionModel}`)
  console.log(`[server] azure openai configured: ${hasAzureOpenAiEndpoint && hasAzureOpenAiKey ? "yes" : "no"}`)
  console.log(`[server] azure openai chat deployment: ${hasAzureOpenAiChatDeployment ? "yes" : "no"}`)
  console.log(`[server] azure openai summary deployment: ${hasAzureOpenAiSummaryDeployment ? "yes" : "no"}`)
})

function readId(value: unknown, fieldName: string): string {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) {
    throw new Error(`Missing ${fieldName}`)
  }
  return text
}

function readOptionalId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const text = typeof value === "string" ? value.trim() : ""
  return text || undefined
}

function readText(value: unknown, fieldName: string): string {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) {
    throw new Error(`Missing ${fieldName}`)
  }
  return text
}

function readRequiredNumber(value: unknown, fieldName: string): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`Missing ${fieldName}`)
  }
  return Number(numeric)
}

function readRequiredInteger(value: unknown, fieldName: string): number {
  const numeric = readRequiredNumber(value, fieldName)
  if (!Number.isInteger(numeric)) {
    throw new Error(`Invalid ${fieldName}`)
  }
  return numeric
}

function readOptionalText(value: unknown, allowEmpty = false): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const text = typeof value === "string" ? value.trim() : ""
  if (!text && !allowEmpty) return null
  return text
}

function readOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  return Number(numeric)
}

function readOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return null
  return Number(numeric)
}

function readOptionalRecoveryPolicy(value: unknown): e2eeV2.RecoveryPolicy | null {
  if (value === undefined || value === null) return null
  const text = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (text === "self_service" || text === "custodian_only" || text === "hybrid") {
    return text
  }
  throw new Error("Invalid recoveryPolicy")
}

const allowedE2eeObjectTypes = new Set([
  "coachee",
  "session",
  "note",
  "written_report",
  "template",
  "practice_settings",
  "audio_blob",
  "audio_stream",
])

function readRequiredObjectType(value: unknown): string {
  const objectType = readText(value, "objectType")
  if (!allowedE2eeObjectTypes.has(objectType)) {
    throw new Error("Invalid objectType")
  }
  return objectType
}

function validateArgon2Params(params: { argon2TimeCost: number; argon2MemoryCostKib: number; argon2Parallelism: number }) {
  if (!Number.isInteger(params.argon2TimeCost) || params.argon2TimeCost < 1 || params.argon2TimeCost > 10) {
    throw new Error("Invalid argon2TimeCost")
  }
  if (!Number.isInteger(params.argon2MemoryCostKib) || params.argon2MemoryCostKib < 16 * 1024 || params.argon2MemoryCostKib > 2 * 1024 * 1024) {
    throw new Error("Invalid argon2MemoryCostKib")
  }
  if (!Number.isInteger(params.argon2Parallelism) || params.argon2Parallelism < 1 || params.argon2Parallelism > 16) {
    throw new Error("Invalid argon2Parallelism")
  }
}

function readUnixMs(value: unknown, fieldName: string): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`Missing ${fieldName}`)
  }
  return Number(numeric)
}

function readOptionalTranscriptionStatus(value: unknown): Session["transcriptionStatus"] | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "idle" || trimmed === "transcribing" || trimmed === "generating" || trimmed === "done" || trimmed === "error") {
    return trimmed
  }
  return undefined
}

function readCoachee(value: unknown): Coachee {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "coachee.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "coachee.updatedAtUnixMs")
  return {
    id: readId(payload.id, "coachee.id"),
    name: readText(payload.name, "coachee.name"),
    createdAtUnixMs,
    updatedAtUnixMs,
    isArchived: typeof payload.isArchived === "boolean" ? payload.isArchived : false,
  }
}

function readSession(value: unknown): Session {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "session.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "session.updatedAtUnixMs")
  const kind = readText(payload.kind, "session.kind") as Session["kind"]
  return {
    id: readId(payload.id, "session.id"),
    coacheeId: payload.coacheeId === null ? null : readOptionalId(payload.coacheeId) ?? null,
    title: readText(payload.title, "session.title"),
    kind,
    audioBlobId: readOptionalText(payload.audioBlobId, true) ?? null,
    audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds) ?? null,
    uploadFileName: readOptionalText(payload.uploadFileName, true) ?? null,
    transcript: readOptionalText(payload.transcript, true) ?? null,
    summary: readOptionalText(payload.summary, true) ?? null,
    transcriptionStatus: readOptionalTranscriptionStatus(payload.transcriptionStatus) ?? "idle",
    transcriptionError: readOptionalText(payload.transcriptionError, true) ?? null,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

function readNote(value: unknown): Note {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "note.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "note.updatedAtUnixMs")
  return {
    id: readId(payload.id, "note.id"),
    sessionId: readId(payload.sessionId, "note.sessionId"),
    text: readText(payload.text, "note.text"),
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

function readWrittenReport(value: unknown): WrittenReport {
  const payload = (value || {}) as any
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "writtenReport.updatedAtUnixMs")
  return {
    sessionId: readId(payload.sessionId, "writtenReport.sessionId"),
    text: readText(payload.text, "writtenReport.text"),
    updatedAtUnixMs,
  }
}

function readTemplateSection(value: unknown, index: number): Template["sections"][number] {
  const payload = (value || {}) as any
  return {
    id: readId(payload.id, `template.sections[${index}].id`),
    title: readText(payload.title, `template.sections[${index}].title`),
    description: readOptionalText(payload.description, true) ?? "",
  }
}

function readTemplate(value: unknown): Template {
  const payload = (value || {}) as any
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "template.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "template.updatedAtUnixMs")
  if (!Array.isArray(payload.sections)) {
    throw new Error("Missing template.sections")
  }
  return {
    id: readId(payload.id, "template.id"),
    name: readText(payload.name, "template.name"),
    sections: payload.sections.map((section: unknown, index: number) => readTemplateSection(section, index)),
    isSaved: typeof payload.isSaved === "boolean" ? payload.isSaved : false,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}

type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

function readSummaryTemplate(value: unknown): SummaryTemplate | undefined {
  if (!value) return undefined
  const payload = (value || {}) as any
  if (!Array.isArray(payload.sections)) return undefined
  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const rawSections: { title?: unknown; description?: unknown }[] = payload.sections
  const sections: { title: string; description: string }[] = rawSections
    .map((section) => ({
      title: typeof section?.title === "string" ? section.title.trim() : "",
      description: readOptionalText(section?.description, true) ?? "",
    }))
    .filter((section) => section.title.length > 0)
  if (!sections.length) return undefined
  return { name: name || "Template", sections }
}
