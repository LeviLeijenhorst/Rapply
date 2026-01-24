/**
 * These are configuration settings for the production environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
export default {
  API_URL: "https://api.rss2json.com/v1/",
  FUNCTIONS_BASE_URL: requireEnv("EXPO_PUBLIC_FUNCTIONS_BASE_URL"),
  AUTH_ACTION_CONTINUE_URL: "https://coachscribe.nl/",
  REVENUECAT_IOS_API_KEY: requireEnv("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"),
  REVENUECAT_ANDROID_API_KEY: requireEnv("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"),
  SUPABASE_URL: requireEnv("EXPO_PUBLIC_SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: requireEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
}

function requireEnv(name: string): string {
  const value = (process.env as any)?.[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) {
    throw new Error(`Missing ${name} for production build. Configure it in EAS environment variables.`)
  }
  return trimmed
}
