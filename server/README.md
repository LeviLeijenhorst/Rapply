## Local server (Postgres + session token auth)

This folder contains a small server that replaces the old Firebase Functions.

### Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Create `server/.env` (do not commit it). Copy `server/env.example` and fill in the values.

- **DATABASE_URL**: Postgres connection string for your Azure Postgres Flexible Server (or local Postgres)
- **DATABASE_SSL**: set to `1` in production on Azure
- **AZURE_STORAGE_ACCOUNT_NAME** and **AZURE_STORAGE_ACCOUNT_KEY**: for Azure Blob Storage
- **AZURE_STORAGE_TRANSCRIPTION_UPLOADS_CONTAINER**: container name (default: `transcription-uploads`)
- **REVENUECAT_SECRET_KEY**: optional for local dev (billing plan detection)
- **MISTRAL_API_KEY**: required if you want to run transcription (Voxtral)
- **MISTRAL_TRANSCRIPTION_MODEL**: optional (defaults to Voxtral)
- **CORS_ALLOWED_ORIGINS**: optional for local dev; required for production (comma-separated list)
- **RATE_LIMIT_WINDOW_MS** and **RATE_LIMIT_MAX_REQUESTS**: optional
- **UNLIMITED_TRANSCRIPTION_EMAILS**: optional comma-separated email list with effectively unlimited transcription minutes
- **FIXED_TRANSCRIPTION_EMAILS** and **FIXED_TRANSCRIPTION_TOTAL_MINUTES**: optional comma-separated email list that gets a fixed non-expiring minute pool (for example `2000`)

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

