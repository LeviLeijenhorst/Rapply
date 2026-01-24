## EAS env vars (production)

We use EAS environment variables for production values so the repo does not contain production URLs/keys.

### Variables to set in EAS

Set these in the EAS build profile you use for production (and optionally preview):

- `EXPO_PUBLIC_FUNCTIONS_BASE_URL`
  - Example: `https://backend.coachscribe.nl`
- `EXPO_PUBLIC_SUPABASE_URL`
  - Example: `https://supabase.coachscribe.nl`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - Example: the Supabase anon key (starts with `eyJ...`)
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
  - Your RevenueCat public iOS API key
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
  - Your RevenueCat public Android API key

### Where they are used

`app/app/config/config.prod.ts` reads these values in production builds.

Notes:

- These values are not “secrets” (they are shipped inside the app bundle), but we still keep them out of Git for cleanliness.
- Never put server secrets (Supabase service role key, Mistral key, RevenueCat secret key) in EAS env vars for the app.

