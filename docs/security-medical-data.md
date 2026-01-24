# Security checklist (medical data)

This app will handle very sensitive information (therapy audio and full transcriptions). “Secure as possible” means we must be honest about where data goes and who can access it.

## The biggest risk in the current design

Even if you self-host Supabase:

- Audio/transcripts are currently sent to **third-party providers** (Mistral Voxtral for transcription, and Mistral for summaries/chat).

That means:

- Your patients’ data leaves your infrastructure.
- You must decide whether that is acceptable, and under what contracts and settings (data processing agreement, EU region, retention settings, no-training settings).

If you want the strongest privacy possible, the long-term direction is:

- self-host transcription and summarization models, or
- use providers that offer strict medical-data terms and region controls, and keep only the minimum data necessary.

## General rules (easy wins)

- Do not store secrets in the mobile app.
  - Assume the client is public and can be reverse engineered.
- Keep the database closed by default:
  - Enable Row Level Security (RLS) on every table that contains user data.
- Keep storage closed by default:
  - Use private buckets.
  - Use short-lived signed URLs if downloads are needed.
- Encrypt in transit:
  - HTTPS everywhere in production.
- Minimize retention:
  - Delete uploads as soon as they are processed (you already do this conceptually).
  - Avoid keeping raw audio unless you truly need it.
- Logging:
  - Never log transcripts, audio URLs, encryption keys, or tokens.

## Specific to this repo

### Audio uploads

Good:

- The client encrypts the audio before upload.

Important:

- The encryption key must never be logged.
- The server must delete the encrypted upload after processing (keep this behavior).

### Backend endpoints

Your current Firebase Functions accept requests from any origin (`Access-Control-Allow-Origin: *`).

For medical data, the production backend should:

- only accept requests from your app and your own domains, and
- reject unknown origins (for browsers), and
- always require a valid user token.

### Supabase keys

- `anon` key: can be in the app.
- `service_role` key: must only exist on the backend server.
  - It bypasses RLS and can read everything.

## What “secure as possible” will look like in practice

For production on Hetzner, we will aim for:

- locked-down firewall (only 443 + SSH)
- automatic security updates
- encrypted backups off the server
- least-privilege database policies (RLS)
- strong secrets rotated from defaults
- minimal data retention

