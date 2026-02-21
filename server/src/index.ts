import express from "express"
import { getDatabaseConnectionInfo, testDatabaseConnection } from "./db"
import { env } from "./env"
import { sendError } from "./http"
import { registerAudioRoutes } from "./routes/audioRoutes"
import { registerRoutes } from "./routes/registerRoutes"
import { createCorsMiddleware, createRateLimitMiddleware, parseCorsAllowedOriginsFromEnv } from "./security"

const app = express()
const diagnosticLogVersion = "2026-02-13-route-modules"

// Logs whether database connectivity works, without exposing credentials.
function logDatabaseConnectionStatus(): void {
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
}

// Logs key runtime configuration flags for startup diagnostics.
function logRuntimeConfiguration(): void {
  const hasAzureOpenAiEndpoint = !!String(env.azureOpenAiEndpoint || "").trim()
  const hasAzureOpenAiKey = !!String(env.azureOpenAiKey || "").trim()
  const hasAzureOpenAiChatDeployment = !!String(env.azureOpenAiChatDeployment || "").trim()
  const hasAzureOpenAiSummaryDeployment = !!String(env.azureOpenAiSummaryDeployment || "").trim()
  console.log(`[server] listening on http://127.0.0.1:${env.port}`)
  console.log(`[server] azure openai configured: ${hasAzureOpenAiEndpoint && hasAzureOpenAiKey ? "yes" : "no"}`)
  console.log(`[server] azure openai chat deployment: ${hasAzureOpenAiChatDeployment ? "yes" : "no"}`)
  console.log(`[server] azure openai summary deployment: ${hasAzureOpenAiSummaryDeployment ? "yes" : "no"}`)
}

app.set("trust proxy", true)
logDatabaseConnectionStatus()

const corsAllowedOrigins = parseCorsAllowedOriginsFromEnv(env.corsAllowedOrigins)
const corsMiddleware = createCorsMiddleware({
  runtimeEnvironment: env.runtimeEnvironment,
  allowedOrigins: corsAllowedOrigins,
})
app.use(corsMiddleware)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(204)
    return
  }
  next()
})

// Keep raw upload routes before JSON body parsing middleware.
registerAudioRoutes(app)
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
const rateLimitAccount = createRateLimitMiddleware({ windowMs: rateLimitWindowMs, maxRequests: 60, keyPrefix: "account" })

  registerRoutes(app, {
  diagnosticLogVersion,
  rateLimitAi,
  rateLimitBilling,
  rateLimitTranscription,
  rateLimitAccount,
  hasDatabaseUrl: !!env.databaseUrl,
  databaseSsl: env.databaseSsl ? "on" : "off",
  hasAzureStorageAccountName: !!env.azureStorageAccountName,
  hasAzureStorageAccountKey: !!env.azureStorageAccountKey,
  hasEntraOpenIdConfigurationUrl: !!env.entraOpenIdConfigurationUrl,
  hasEntraAudience: env.entraAudience.length > 0,
    hasRevenueCatSecretKey: !!env.revenueCatSecretKey,
    hasMollieApiKey: !!env.mollieApiKey,
    hasMollieWebhookUrl: !!env.mollieWebhookUrl,
    hasMollieRedirectUrl: !!env.mollieRedirectUrl,
    runtimeEnvironment: env.runtimeEnvironment,
  hasCorsAllowlist: !!corsAllowedOrigins?.length,
  rateLimitWindowMs,
  rateLimitMaxRequests,
  azureSpeechConfigured: !!env.azureSpeechKey && !!env.azureSpeechRegion,
})

app.use((req, res) => {
  sendError(res, 404, `Not found: ${req.method} ${req.path}`)
})

app.use((err: any, _req: any, res: any, _next: any) => {
  const message = typeof err?.message === "string" ? err.message : String(err || "Unknown error")
  const status = typeof err?.status === "number" ? err.status : 500
  res.status(status).json({ error: message })
})

app.listen(env.port, () => {
  logRuntimeConfiguration()
})
