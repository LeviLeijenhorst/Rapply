## Local server (Supabase JWT verified)

This folder contains a small server that replaces the old Firebase Functions.

### Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Create `server/.env` (do not commit it). Copy `server/env.example` and fill in the values.

- **SUPABASE_URL**: use your local Supabase URL (for example `http://127.0.0.1:54321`)
- **SUPABASE_SERVICE_ROLE_KEY**: use the **Secret** value from `npx supabase status` (it starts with `sb_secret_`)
- **REVENUECAT_SECRET_KEY**: optional for local dev (billing plan detection)
- **MISTRAL_API_KEY**: required if you want to run transcription (Voxtral Small)
- **MISTRAL_TRANSCRIPTION_MODEL**: optional (defaults to Voxtral Small)
- **CORS_ALLOWED_ORIGINS**: optional for local dev; required for production (comma-separated list)
- **RATE_LIMIT_WINDOW_MS** and **RATE_LIMIT_MAX_REQUESTS**: optional

3. Start the server:

```bash
cd server
npm run dev
```

It will listen on `http://127.0.0.1:8787` by default.

### Android physical device

If you run on a physical Android phone via USB, make sure you also run:

```powershell
adb reverse tcp:8787 tcp:8787
```

