## Production checklist (CoachScribe)

### Infrastructure

- Hetzner Cloud Firewall:
  - allow: 22, 80, 443
  - block everything else
- SSH keys only (no password login)
- Automatic security updates enabled (Ubuntu)

### Supabase

- API reachable at `https://supabase.coachscribe.nl`
- Studio reachable at `https://admin.coachscribe.nl` (protected)
- SMTP configured and tested:
  - signup email arrives
  - password reset email arrives
- RLS enabled on all user data tables (this repo’s migration already does this)
- Storage bucket is private (`transcription-uploads`)

### CoachScribe server API

- API reachable at `https://backend.coachscribe.nl/health`
- `NODE_ENV=production`
- `CORS_ALLOWED_ORIGINS` set to your allowed origins
- Rate limiting enabled (defaults are fine to start)
- No sensitive logging (no transcripts, tokens, encryption keys)

### App configuration

- `SUPABASE_URL` points to production
- `SUPABASE_PUBLISHABLE_KEY` is production publishable key
- `FUNCTIONS_BASE_URL` points to production server API

### Backups

- Daily Postgres backups automated
- Backups stored off the VM
- You performed a restore test at least once

