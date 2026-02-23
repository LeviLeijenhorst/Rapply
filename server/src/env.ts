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
  revenueCatSecretKey: optionalString("REVENUECAT_SECRET_KEY"),
  mollieApiKey: optionalString("MOLLIE_API_KEY"),
  mollieWebhookUrl: optionalString("MOLLIE_WEBHOOK_URL"),
  mollieRedirectUrl: optionalString("MOLLIE_REDIRECT_URL"),
  azureOpenAiEndpoint: optionalString("AZURE_OPENAI_ENDPOINT") || "",
  azureOpenAiKey: optionalString("AZURE_OPENAI_KEY") || "",
  azureOpenAiVersion: optionalString("AZURE_OPENAI_VERSION") || "2024-06-01",
  azureOpenAiChatDeployment: optionalString("AZURE_OPENAI_CHAT_DEPLOYMENT") || "",
  azureOpenAiSummaryDeployment: optionalString("AZURE_OPENAI_SUMMARY_DEPLOYMENT") || "",
  azureSpeechKey: optionalString("AZURE_SPEECH_KEY") || "",
  azureSpeechRegion: optionalString("AZURE_SPEECH_REGION") || "",
  defaultTranscriptionMode: optionalString("DEFAULT_TRANSCRIPTION_MODE") || "azure-fast-batch",
  corsAllowedOrigins: optionalString("CORS_ALLOWED_ORIGINS"),
  rateLimitWindowMs: Number(optionalString("RATE_LIMIT_WINDOW_MS") || "60000"),
  rateLimitMaxRequests: Number(optionalString("RATE_LIMIT_MAX_REQUESTS") || "120"),
  unlimitedTranscriptionEmails: normalizeEmailList(optionalString("UNLIMITED_TRANSCRIPTION_EMAILS")),
  fixedTranscriptionEmails: normalizeEmailList(optionalString("FIXED_TRANSCRIPTION_EMAILS")),
  fixedTranscriptionTotalMinutes: optionalNumber("FIXED_TRANSCRIPTION_TOTAL_MINUTES") ?? 0,
  defaultFreeTranscriptionMinutes: optionalNumber("DEFAULT_FREE_TRANSCRIPTION_MINUTES") ?? 120,
  testTranscriptionEmails: normalizeEmailList(optionalString("TEST_TRANSCRIPTION_EMAILS")),
  testTranscriptionTotalHours: optionalNumber("TEST_TRANSCRIPTION_TOTAL_HOURS") ?? 80,
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
