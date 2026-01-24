# Run Supabase locally on Windows (secure setup)

This project will handle sensitive medical data. The safest way to start is to run Supabase locally first, with strong secrets, and to be very strict about what runs in the client app versus what runs on a server.

## What you need (prerequisites)

Supabase local development uses Docker containers. On Windows, that usually means:

- WSL2 (Windows Subsystem for Linux)
- Docker Desktop (Linux containers)
- Supabase CLI

### 1) Install WSL2

Open PowerShell **as Administrator** and run:

```powershell
wsl --install
```

Then restart your computer when Windows asks you to.

After the restart, confirm it works:

```powershell
wsl --status
```

### 2) Install Docker Desktop

Make sure Docker Desktop is installed and running.

If you use Chocolatey (you do on this machine), open PowerShell **as Administrator** and run:

```powershell
choco install docker-desktop -y
```

After installation:

- Start Docker Desktop
- In Docker Desktop settings, ensure it is using the WSL2 backend

Verify Docker works:

```powershell
docker --version
docker compose version
```

### 3) Install Supabase CLI

Important: installing the Supabase CLI globally with npm (`npm install -g supabase`) is **not supported** and will error.

Install the Supabase CLI as a dev dependency in this repo instead (supported), and run it via `npx`:

```powershell
cd A:\Code\Coachscribe
npm install --save-dev supabase
```

Verify:

```powershell
npx supabase --version
```

## Start Supabase locally

From the repository root (`A:\Code\Coachscribe`), run:

```powershell
cd A:\Code\Coachscribe
npx supabase init
npx supabase start
```

The `supabase start` output will print:

- local API URL
- `anon` key (safe to use in the app)
- `service_role` key (must stay on the server only)
- Studio URL

## Start the local server API (replaces Firebase Functions in dev)

The mobile app calls a backend API via `FUNCTIONS_BASE_URL`. In dev we point this to a local server on your PC.

1) Install server dependencies:

```powershell
cd A:\Code\Coachscribe\server
npm install
```

2) Create `A:\Code\Coachscribe\server\.env` (do not commit it) and fill in:

- `SUPABASE_URL` (your local API URL)
- `SUPABASE_SERVICE_ROLE_KEY` (use the **Secret** value from `npx supabase status`, it starts with `sb_secret_`)
- `MISTRAL_API_KEY` (only needed if you want transcription)
- `MISTRAL_TRANSCRIPTION_MODEL` (optional, defaults to Voxtral Small)
- `CORS_ALLOWED_ORIGINS` (optional for local dev; required for production; comma-separated list like `https://yourdomain.com,https://www.yourdomain.com`)
- `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` (optional; basic protection against spamming expensive endpoints)

3) Start the server:

```powershell
cd A:\Code\Coachscribe\server
npm run dev
```

## Apply this repo’s database schema

This repo stores the schema in `supabase/migrations`.

To apply migrations to your local Supabase database, run:

```powershell
cd A:\Code\Coachscribe
npx supabase db reset
```

## Android physical device (important for localhost)

If you run the app on a real Android phone, `http://127.0.0.1:54321` points to the **phone**, not your PC.

To make the phone reach your PC’s local Supabase, run this while the phone is connected via USB:

```powershell
adb reverse tcp:54321 tcp:54321
```

The app also calls a local backend server in dev (`FUNCTIONS_BASE_URL`). If you run that server on your PC (default port `8787`), you also need:

```powershell
adb reverse tcp:8787 tcp:8787
```

If login suddenly starts failing again with “Network request failed”, re-run:

```powershell
adb reverse --list
adb reverse tcp:54321 tcp:54321
adb reverse tcp:8787 tcp:8787
```

## Important security rules (do these from the start)

- Never put secrets in the mobile app config files (`app/app/config/config.*.ts`).
  - Anything in the app bundle can be extracted.
- Only the Supabase **anon key** belongs in the app.
- The Supabase **service role key** must only be used on your backend server.

## If something fails

Copy/paste the output of these commands and I will help you pinpoint the root cause:

```powershell
wsl --status
docker --version
docker compose version
supabase --version
supabase start
```

