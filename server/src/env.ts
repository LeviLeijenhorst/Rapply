import dotenv from "dotenv"

dotenv.config({ override: true })

// Reads a required environment variable and fails fast when it is missing.
function requireString(name: string): string {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return trimmed
}

// Reads an optional environment variable and normalizes empty values to null.
function optionalString(name: string): string | null {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  return trimmed || null
}

// Parses a boolean from common string forms used in env files.
function optionalBooleanFromString(value: string | null): boolean | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (v === "1" || v === "true" || v === "yes") return true
  if (v === "0" || v === "false" || v === "no") return false
  return null
}

// Parses a numeric value from an env string and rejects invalid numbers.
function optionalNumberFromString(value: string | null): number | null {
  if (!value) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return numeric
}

// Reads an optional numeric environment variable.
function optionalNumber(name: string): number | null {
  return optionalNumberFromString(optionalString(name))
}

// Parses comma-separated values into a normalized string array.
function parseStringList(value: string | null): string[] {
  const trimmed = String(value || "").trim()
  if (!trimmed) return []
  return trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
}

// Parses an env value as an email allowlist.
function normalizeEmailList(value: string | null): string[] {
  return parseStringList(value)
}

export const env = {
  runtimeEnvironment: optionalString("NODE_ENV") || "development",
  port: Number(optionalString("PORT") || "8787"),
  databaseUrl: requireString("DATABASE_URL"),
  databaseSsl: optionalBooleanFromString(optionalString("DATABASE_SSL")) ?? false,
  azureStorageAccountName: requireString("AZURE_STORAGE_ACCOUNT_NAME"),
  azureStorageAccountKey: requireString("AZURE_STORAGE_ACCOUNT_KEY"),
  azureStorageTranscriptionUploadsContainer: optionalString("AZURE_STORAGE_TRANSCRIPTION_UPLOADS_CONTAINER") || "transcription-uploads",
  entraOpenIdConfigurationUrl: requireString("ENTRA_OPENID_CONFIGURATION_URL"),
  entraClientId: requireString("ENTRA_CLIENT_ID"),
  entraClientSecret: requireString("ENTRA_CLIENT_SECRET"),
  entraAudience: parseStringList(requireString("ENTRA_AUDIENCE")),
  entraGraphTenantId: optionalString("ENTRA_GRAPH_TENANT_ID") || "",
  entraGraphClientId: optionalString("ENTRA_GRAPH_CLIENT_ID") || "",
  entraGraphClientSecret: optionalString("ENTRA_GRAPH_CLIENT_SECRET") || "",
  mollieApiKey: optionalString("MOLLIE_API_KEY"),
  mollieWebhookUrl: optionalString("MOLLIE_WEBHOOK_URL"),
  mollieRedirectUrl: optionalString("MOLLIE_REDIRECT_URL"),
  azureOpenAiEndpoint: optionalString("AZURE_OPENAI_ENDPOINT") || "",
  azureOpenAiKey: optionalString("AZURE_OPENAI_KEY") || "",
  azureOpenAiVersion: optionalString("AZURE_OPENAI_VERSION") || "2024-06-01",
  azureOpenAiReasoningDeployment: optionalString("AZURE_OPENAI_REASONING_DEPLOYMENT") || "",
  azureOpenAiReportDeployment: optionalString("AZURE_OPENAI_REPORT_DEPLOYMENT") || "",
  azureOpenAiChatDeployment: optionalString("AZURE_OPENAI_CHAT_DEPLOYMENT") || "",
  azureOpenAiSummaryDeployment: optionalString("AZURE_OPENAI_SUMMARY_DEPLOYMENT") || "",
  azureDocumentIntelligenceEndpoint: optionalString("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT") || "",
  azureDocumentIntelligenceKey: optionalString("AZURE_DOCUMENT_INTELLIGENCE_KEY") || "",
  azureSpeechKey: optionalString("AZURE_SPEECH_KEY") || "",
  azureSpeechRegion: optionalString("AZURE_SPEECH_REGION") || "",
  speechmaticsApiKey: optionalString("SPEECHMATICS_API_KEY") || "",
  speechmaticsBatchApiUrl: optionalString("SPEECHMATICS_BATCH_API_URL") || "https://asr.api.speechmatics.com/v2",
  speechmaticsRealtimeUrl: optionalString("SPEECHMATICS_REALTIME_URL") || "wss://eu2.rt.speechmatics.com/v2",
  whisperFastEndpoint: optionalString("WHISPER_FAST_ENDPOINT") || "",
  whisperFastApiKey: optionalString("WHISPER_FAST_API_KEY") || "",
  whisperFastTimeoutMs: optionalNumber("WHISPER_FAST_TIMEOUT_MS") ?? 20 * 60 * 1000,
  transcriptionBatchFallbackProvider: optionalString("TRANSCRIPTION_BATCH_FALLBACK_PROVIDER") || "speechmatics",
  transcriptionBatchFallbackEnabled: optionalBooleanFromString(optionalString("TRANSCRIPTION_BATCH_FALLBACK_ENABLED")) ?? false,
  defaultTranscriptionMode: optionalString("DEFAULT_TRANSCRIPTION_MODE") || "batch",
  defaultTranscriptionProvider: optionalString("DEFAULT_TRANSCRIPTION_PROVIDER") || "whisper-fast",
  corsAllowedOrigins: optionalString("CORS_ALLOWED_ORIGINS"),
  rateLimitWindowMs: Number(optionalString("RATE_LIMIT_WINDOW_MS") || "60000"),
  rateLimitMaxRequests: Number(optionalString("RATE_LIMIT_MAX_REQUESTS") || "120"),
  defaultFreeTranscriptionMinutes: optionalNumber("DEFAULT_FREE_TRANSCRIPTION_MINUTES") ?? 0,
  extraTranscriptionOneTimePriceEur: optionalNumber("EXTRA_TRANSCRIPTION_ONE_TIME_PRICE_EUR"),
  adminFeedbackEmails: normalizeEmailList(optionalString("ADMIN_FEEDBACK_EMAILS")),
  kmsProvider: optionalString("KMS_PROVIDER") || "ovh",
  localKmsMasterKeyBase64: optionalString("LOCAL_KMS_MASTER_KEY_BASE64") || "",
  ovhKmsBaseUrl: optionalString("OVH_KMS_BASE_URL") || "",
  ovhKmsServiceKeyId: optionalString("OVH_KMS_SERVICE_KEY_ID") || "",
  ovhKmsContext: optionalString("OVH_KMS_CONTEXT") || "coachscribe-user-ark",
  ovhKmsClientCertPath: optionalString("OVH_KMS_CLIENT_CERT_PATH") || "",
  ovhKmsClientKeyPath: optionalString("OVH_KMS_CLIENT_KEY_PATH") || "",
  ovhKmsCaPath: optionalString("OVH_KMS_CA_PATH") || "",
  templateDefaultsCutoverIso: optionalString("TEMPLATE_DEFAULTS_CUTOVER_ISO"),
}
