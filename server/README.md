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
- **AZURE_SPEECH_KEY** and **AZURE_SPEECH_REGION**: required for transcription
- **AZURE_OPENAI_ENDPOINT**, **AZURE_OPENAI_KEY**, and **AZURE_OPENAI_SUMMARY_DEPLOYMENT**: required for summary generation
- **CORS_ALLOWED_ORIGINS**: optional for local dev; required for production (comma-separated list)
- **RATE_LIMIT_WINDOW_MS** and **RATE_LIMIT_MAX_REQUESTS**: optional
- **ADMIN_FEEDBACK_EMAILS**: optional comma-separated email allowlist for `/admin/feedback/list` (default: `ltleijenhorst@gmail.com`)
- **UNLIMITED_TRANSCRIPTION_EMAILS**: optional comma-separated email list with effectively unlimited transcription minutes
- **FIXED_TRANSCRIPTION_EMAILS** and **FIXED_TRANSCRIPTION_TOTAL_MINUTES**: optional comma-separated email list that gets a fixed non-expiring minute pool (for example `2000`)

3. Initialize database schema:

```bash
cd server
npm run init-db
```

`init-db` is a clean-start reset and recreates the `public` schema from migration files.

4. Start the server:

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

## Azure App Service deployment (coachscribe-api)

Use only the GitHub workflow `.github/workflows/main_coachscribe-api.yml` for API deployments.

1. In Azure Portal, disconnect **Deployment Center** source sync for `coachscribe-api` to avoid Oryx/source-based deploys racing with the workflow artifact deploy.
2. Ensure app startup command is `node dist/index.cjs`.
3. Deploy by pushing to `main` (changes in `server/**`) or running the workflow manually.
4. Verify runtime code with:
   - `GET /health` and check `build.diagnosticLogVersion`
   - App Service log stream for `[request] POST /transcription/start reached Express (global middleware)` during a transcription start.

The workflow builds a deterministic artifact (`dist/index.cjs` + production dependencies) and deploys it as a zip package.

