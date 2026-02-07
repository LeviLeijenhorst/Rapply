import dotenv from "dotenv"

dotenv.config({ override: true })

function requireString(name: string): string {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return trimmed
}

function optionalString(name: string): string | null {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  return trimmed || null
}

function optionalBooleanFromString(value: string | null): boolean | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (v === "1" || v === "true" || v === "yes") return true
  if (v === "0" || v === "false" || v === "no") return false
  return null
}

function parseStringList(value: string): string | string[] {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""
  const parts = trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length <= 1 ? trimmed : parts
}

function normalizeEmailList(value: string | null): string[] {
  if (!value) return []
  const parsed = parseStringList(value)
  if (Array.isArray(parsed)) return parsed
  return parsed ? [parsed] : []
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
  revenueCatSecretKey: optionalString("REVENUECAT_SECRET_KEY"),
  azureOpenAiEndpoint: optionalString("AZURE_OPENAI_ENDPOINT") || "",
  azureOpenAiKey: optionalString("AZURE_OPENAI_KEY") || "",
  azureOpenAiVersion: optionalString("AZURE_OPENAI_VERSION") || "2024-06-01",
  azureOpenAiChatDeployment: optionalString("AZURE_OPENAI_CHAT_DEPLOYMENT") || "",
  azureOpenAiSummaryDeployment: optionalString("AZURE_OPENAI_SUMMARY_DEPLOYMENT") || "",
  azureSpeechKey: optionalString("AZURE_SPEECH_KEY") || "",
  azureSpeechRegion: optionalString("AZURE_SPEECH_REGION") || "",
  mistralApiKey: optionalString("MISTRAL_API_KEY") || "",
  mistralChatModel: optionalString("MISTRAL_CHAT_MODEL") || "mistral-small-latest",
  mistralTranscriptionModel: optionalString("MISTRAL_TRANSCRIPTION_MODEL") || "voxtral-mini-latest",
  corsAllowedOrigins: optionalString("CORS_ALLOWED_ORIGINS"),
  rateLimitWindowMs: Number(optionalString("RATE_LIMIT_WINDOW_MS") || "60000"),
  rateLimitMaxRequests: Number(optionalString("RATE_LIMIT_MAX_REQUESTS") || "120"),
  unlimitedTranscriptionEmails: normalizeEmailList(optionalString("UNLIMITED_TRANSCRIPTION_EMAILS")),
}

