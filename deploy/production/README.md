# Production deployment (Hetzner) - CoachScribe

This folder is meant to make your production deployment reproducible.

## What you will deploy

- Supabase (self-hosted) using the official Docker Compose setup
- CoachScribe API (`server/`) as a Docker container
- Caddy as a reverse proxy for HTTPS and routing

## Domains (recommended)

Use three subdomains:

- `supabase.yourdomain.com` → Supabase API (Kong)
- `admin.yourdomain.com` → Supabase Studio
- `backend.yourdomain.com` → CoachScribe server API (your secure endpoints)

Your mobile app will use:

- `SUPABASE_URL=https://supabase.yourdomain.com`
- `FUNCTIONS_BASE_URL=https://api.yourdomain.com`

## Hetzner VM

Recommended:

- Ubuntu 24.04
- 4 GB RAM minimum
- Hetzner Cloud Firewall:
  - allow: 22, 80, 443
  - block everything else

## Step 1 - Prepare the server

- Install Docker + Docker Compose plugin
- Set up SSH keys and disable password login

## Step 2 - Run Supabase (official self-host setup)

Supabase publishes an official self-host Docker Compose setup.

On your Hetzner VM:

1) Create a folder, for example:

```bash
mkdir -p /opt/supabase
cd /opt/supabase
```

2) Follow Supabase’s self-host guide and create the Supabase `.env` with strong secrets.

Important:

- Set `SITE_URL` to your real website URL
- Set `API_EXTERNAL_URL` to `https://supabase.yourdomain.com`
- Configure SMTP (email verification + password reset depends on it)

## Step 3 - Add CoachScribe API + Caddy

Copy these files to the VM:

- `deploy/production/coachscribe-compose.yml`
- `deploy/production/Caddyfile`
- `deploy/production/env.example` (create your real `env.production` from it)

Place them in:

```bash
mkdir -p /opt/coachscribe
```

## Step 4 - Start everything

Start Supabase first (from `/opt/supabase`).

Then start CoachScribe API + Caddy (from `/opt/coachscribe`):

```bash
docker compose --env-file env.production -f coachscribe-compose.yml up -d
```

Important:

- Supabase must expose:
  - Kong on port `8000` (for `supabase.yourdomain.com`)
  - Studio on port `3000` (for `admin.yourdomain.com`)
- Ideally bind them to localhost on the VM (more private):
  - `127.0.0.1:8000:8000`
  - `127.0.0.1:3000:3000`

## Step 5 - Verification checklist

- `https://backend.yourdomain.com/health` returns `ok: true`
- `https://supabase.yourdomain.com/rest/v1/` responds (should be 404 or 401 but reachable)
- Signup sends a verification email (SMTP works)
- Login works from the app on a real network (no localhost)

## Backups (minimum)

You should make Postgres backups from the VM and keep a copy off the VM.

This repo includes minimal scripts:

- `deploy/production/backup/backup.sh`
- `deploy/production/backup/restore.sh`

Example usage:

```bash
cd /opt/coachscribe
chmod +x backup/backup.sh backup/restore.sh
./backup/backup.sh <POSTGRES_CONTAINER_NAME> ./backups
```

Then upload `./backups` to Hetzner Storage Box (or another off-server storage).

