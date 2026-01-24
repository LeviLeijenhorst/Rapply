import express from "express"
import cors from "cors"
import { env } from "./env"
import { asyncHandler, sendError } from "./http"
import { authImplementationVersion, requireSupabaseUser } from "./auth"
import { supabaseAdmin } from "./supabaseAdmin"
import { createCorsMiddleware, createRateLimitMiddleware, parseCorsAllowedOriginsFromEnv } from "./security"
import { ensureBillingUser, readBillingStatus } from "./billing/store"
import { derivePlanStateFromRevenueCatSubscriber, derivePurchasedSecondsFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "./billing/revenuecat"
import { randomBase64Url } from "./transcription/random"
import { createUploadToken, consumeUploadToken, chargeSecondsIdempotent, refundSecondsIdempotent } from "./transcription/store"
import { fetchEncryptedUploadStream } from "./transcription/storage"
import { computeAudioDurationSecondsFromEncryptedUpload } from "./transcription/duration"
import { runVoxtralTranscriptionFromEncryptedUpload } from "./transcription/voxtral"
import { generateSummaryWithMistral } from "./summary/mistralSummary"
import { completeChatWithMistral } from "./chat/mistralChat"

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

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    build: {
      authImplementationVersion,
    },
    config: {
      supabase: {
        hasUrl: !!env.supabaseUrl,
        hasServiceRoleKey: !!env.supabaseServiceRoleKey,
        serviceRoleKeyDotCount: (env.supabaseServiceRoleKey.match(/\./g) || []).length,
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
  "/summary",
  rateLimitAi,
  asyncHandler(async (req, res) => {
    await requireSupabaseUser(req)

    const transcript = typeof req.body?.transcript === "string" ? req.body.transcript : ""
    const summary = await generateSummaryWithMistral({ transcript })

    res.status(200).json({ summary })
  }),
)

app.post(
  "/chat",
  rateLimitAi,
  asyncHandler(async (req, res) => {
    await requireSupabaseUser(req)

    const messages = req.body?.messages
    const temperature = req.body?.temperature

    const text = await completeChatWithMistral({ messages, temperature })
    res.status(200).json({ text })
  }),
)

app.post(
  "/subscriptionCancel/feedback",
  asyncHandler(async (req, res) => {
    const user = await requireSupabaseUser(req)

    const selectedPlan = typeof req.body?.selectedPlan === "string" ? req.body.selectedPlan.trim() : ""
    const selectedReason = typeof req.body?.selectedReason === "string" ? req.body.selectedReason.trim() : ""
    const otherReasonText = typeof req.body?.otherReasonText === "string" ? req.body.otherReasonText.trim() : ""
    const tipsText = typeof req.body?.tipsText === "string" ? req.body.tipsText.trim() : ""

    if (!selectedPlan || !selectedReason) {
      sendError(res, 400, "Missing selectedPlan or selectedReason")
      return
    }

    const insertResult = await supabaseAdmin.from("subscription_cancel_feedback").insert({
      user_id: user.userId,
      selected_plan: selectedPlan,
      selected_reason: selectedReason,
      other_reason_text: otherReasonText || null,
      tips_text: tipsText || null,
      account_email: user.email,
    })
    if (insertResult.error) {
      sendError(res, 500, insertResult.error.message)
      return
    }

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/account/delete",
  rateLimitAccount,
  asyncHandler(async (req, res) => {
    const user = await requireSupabaseUser(req)

    async function deleteBucketFolderRecursively(params: { bucket: string; folder: string }) {
      const bucket = params.bucket
      const rootFolder = params.folder.replace(/^\/+|\/+$/g, "")
      if (!rootFolder) return

      const filePathsToRemove: string[] = []
      const foldersToVisit: string[] = [rootFolder]
      const visited = new Set<string>()

      while (foldersToVisit.length > 0) {
        const folder = foldersToVisit.pop()!
        if (visited.has(folder)) continue
        visited.add(folder)

        const listResult = await supabaseAdmin.storage.from(bucket).list(folder, { limit: 1000, offset: 0 })
        if (listResult.error) {
          continue
        }

        const entries = Array.isArray(listResult.data) ? listResult.data : []
        for (const entry of entries) {
          const name = typeof (entry as any)?.name === "string" ? String((entry as any).name).trim() : ""
          if (!name) continue
          const isFolder = !(entry as any)?.id
          const fullPath = `${folder}/${name}`
          if (isFolder) {
            foldersToVisit.push(fullPath)
          } else {
            filePathsToRemove.push(fullPath)
          }
        }
      }

      const chunkSize = 100
      for (let i = 0; i < filePathsToRemove.length; i += chunkSize) {
        const chunk = filePathsToRemove.slice(i, i + chunkSize)
        const removeResult = await supabaseAdmin.storage.from(bucket).remove(chunk)
        if (removeResult.error) {
          throw new Error(removeResult.error.message)
        }
      }
    }

    await deleteBucketFolderRecursively({ bucket: "transcription-uploads", folder: user.userId })

    await supabaseAdmin.auth.admin.deleteUser(user.userId)

    res.status(200).json({ ok: true })
  }),
)

app.post(
  "/billing/sync",
  rateLimitBilling,
  asyncHandler(async (req, res) => {
    const user = await requireSupabaseUser(req)

    await ensureBillingUser(user.userId)

    const subscriber = await fetchRevenueCatSubscriber(user.userId)
    const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
    const purchasedSecondsFromRevenueCat = derivePurchasedSecondsFromRevenueCatSubscriber(subscriber)

    await supabaseAdmin
      .from("billing_users")
      .update({ purchased_seconds: purchasedSecondsFromRevenueCat })
      .eq("user_id", user.userId)
      .throwOnError()

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
    const user = await requireSupabaseUser(req)

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
    const user = await requireSupabaseUser(req)

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

    res.status(200).json({
      allowed: true,
      remainingSeconds,
      planKey: status.planKey,
      operationId,
      uploadToken: token.uploadToken,
      uploadPath,
      uploadTokenExpiresAtMs: token.expiresAtMs,
    })
  }),
)

app.post(
  "/transcription/start",
  rateLimitTranscription,
  asyncHandler(async (req, res) => {
    const user = await requireSupabaseUser(req)

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

      const durationStream = await fetchEncryptedUploadStream({ bucket: "transcription-uploads", path: uploadPath })
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

      const transcriptionStream = await fetchEncryptedUploadStream({ bucket: "transcription-uploads", path: uploadPath })
      const transcript = await runVoxtralTranscriptionFromEncryptedUpload({
        encryptedStream: transcriptionStream,
        keyBase64,
        mimeType,
        languageCode: languageCode || "nl",
        apiKey,
        model: env.mistralTranscriptionModel,
      })

      const updateResult = await supabaseAdmin
        .from("transcription_operations")
        .update({ status: "completed", completed_at: new Date().toISOString(), transcript })
        .eq("operation_id", operationId)
        .eq("user_id", user.userId)
      if (updateResult.error) {
        throw new Error(updateResult.error.message)
      }

      res.status(200).json({
        transcript,
        text: transcript,
        secondsCharged: charge.secondsCharged,
        remainingSecondsAfter: charge.remainingSecondsAfter,
        planKey: planState.planKey,
      })
    } catch (e: any) {
      try {
        await refundSecondsIdempotent({ userId: user.userId, operationId })
        await supabaseAdmin
          .from("transcription_operations")
          .upsert({
            operation_id: operationId,
            user_id: user.userId,
            status: "failed",
            failed_at: new Date().toISOString(),
            error_message: String(e?.message || e),
          })
          .throwOnError()
      } catch {}
      sendError(res, 500, String(e?.message || e))
    } finally {
      try {
        if (uploadPath) {
          await supabaseAdmin.storage.from("transcription-uploads").remove([uploadPath])
        }
      } catch {}
    }
  }),
)

app.use((req, res) => {
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

