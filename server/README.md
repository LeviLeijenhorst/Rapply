## Local server (Postgres + session token auth)

This folder contains the Coachscribe API server.

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
- **AZURE_SPEECH_KEY** and **AZURE_SPEECH_REGION**: required when Azure Speech is the active transcription provider
- **SPEECHMATICS_API_KEY**: required when Speechmatics is the active transcription provider
- **WHISPER_FAST_ENDPOINT**: HTTP endpoint for the batch Whisper worker (for example the Verda-hosted worker)
- **WHISPER_FAST_API_KEY**: optional bearer token for the Whisper worker
- **WHISPER_FAST_TIMEOUT_MS**: optional timeout for one batch transcription request
- **DEFAULT_TRANSCRIPTION_MODE**: `batch` or `realtime` (legacy values are still accepted)
- **DEFAULT_TRANSCRIPTION_PROVIDER**: `azure-speech`, `speechmatics`, or `whisper-fast`
- **AZURE_OPENAI_ENDPOINT** and **AZURE_OPENAI_KEY**: required for all Azure OpenAI calls
- **AZURE_OPENAI_REASONING_DEPLOYMENT**: optional but recommended; used for the report reasoning step (target model: `o3`)
- **AZURE_OPENAI_REPORT_DEPLOYMENT**: optional but recommended; used for report writing, field regeneration, and pipeline chat (target model: `gpt-5` or `gpt-5-chat`)
- **AZURE_OPENAI_CHAT_DEPLOYMENT**: fallback deployment for chat-style completions when no report deployment is configured
- **AZURE_OPENAI_SUMMARY_DEPLOYMENT**: deployment for summaries/snippet extraction; if empty, the server falls back to the chat/report deployment
- **CORS_ALLOWED_ORIGINS**: optional for local dev; required for production (comma-separated list)
- **RATE_LIMIT_WINDOW_MS** and **RATE_LIMIT_MAX_REQUESTS**: optional
- **ADMIN_FEEDBACK_EMAILS**: optional comma-separated email allowlist for `/admin/feedback/list` (default: `ltleijenhorst@gmail.com`)
- **DEFAULT_FREE_TRANSCRIPTION_MINUTES**: optional non-expiring base minute pool
- **EXTRA_TRANSCRIPTION_ONE_TIME_PRICE_EUR**: optional one-time extra minutes checkout amount

3. Initialize database schema:

```bash
cd server
npm run init-db
```

`init-db` is a clean-start reset and recreates the `public` schema from migration files.

To apply migrations without resetting data (safe for existing environments), run:

```bash
cd server
npm run apply-db-migrations
```

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
   - The workflow now applies pending SQL migrations (`npm run apply-db-migrations`) against the configured `DATABASE_URL` before deploying code.
4. Verify runtime code with:
   - `GET /health` and check `build.diagnosticLogVersion`
   - App Service log stream for `[request] POST /transcription/start reached Express (global middleware)` during a transcription start.

The workflow builds a deterministic artifact (`dist/index.cjs` + production dependencies) and deploys it as a zip package.

