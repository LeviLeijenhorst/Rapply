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

function requireSupabaseServiceRoleKey(name: string): string {
  const value = requireString(name)

  const isJwt = (value.match(/\./g) || []).length === 2
  const isNewStyle = value.startsWith("sb_secret_")

  if (!isJwt && !isNewStyle) {
    throw new Error(
      `Invalid ${name}: expected a Supabase service role key. For local Supabase, use the "Secret" value from "npx supabase status" (it starts with "sb_secret_").`,
    )
  }

  return value
}

function optionalString(name: string): string | null {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  return trimmed || null
}

export const env = {
  runtimeEnvironment: optionalString("NODE_ENV") || "development",
  port: Number(optionalString("PORT") || "8787"),
  supabaseUrl: requireString("SUPABASE_URL"),
  supabaseServiceRoleKey: requireSupabaseServiceRoleKey("SUPABASE_SERVICE_ROLE_KEY"),
  revenueCatSecretKey: optionalString("REVENUECAT_SECRET_KEY"),
  mistralApiKey: optionalString("MISTRAL_API_KEY"),
  mistralChatModel: optionalString("MISTRAL_CHAT_MODEL") || "mistral-small-latest",
  mistralSummaryModel: optionalString("MISTRAL_SUMMARY_MODEL") || "mistral-small-latest",
  mistralTranscriptionModel: optionalString("MISTRAL_TRANSCRIPTION_MODEL") || "voxtral-mini-latest",
  corsAllowedOrigins: optionalString("CORS_ALLOWED_ORIGINS"),
  rateLimitWindowMs: Number(optionalString("RATE_LIMIT_WINDOW_MS") || "60000"),
  rateLimitMaxRequests: Number(optionalString("RATE_LIMIT_MAX_REQUESTS") || "120"),
}

