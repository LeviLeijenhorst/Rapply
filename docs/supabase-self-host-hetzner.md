# Self-host Supabase on Hetzner (practical checklist)

This is a simple, safe setup for a first production Supabase instance on Hetzner Cloud.

## What you will host

- Supabase stack (Postgres + Auth + Storage + API gateway)
- A reverse proxy for HTTPS and routing (recommended)

For this repo, your app also needs a backend API for the “secure API” endpoints. Because your current code uses Node streams and Node libraries, the simplest migration is to run a small Node server next to Supabase later (not in the first “bring Supabase up” step).

## Recommended Hetzner setup

- A Hetzner Cloud VPS (Ubuntu 24.04)
- Minimum: 4 GB RAM (Supabase runs multiple services)
- 1 public IPv4

## Domain and HTTPS

Pick two subdomains (example):

- `api.yourdomain.com` for Supabase API
- `studio.yourdomain.com` for Supabase Studio

HTTPS is required for auth flows and for mobile apps in practice.

## Email (SMTP) is not optional

Supabase Auth needs email sending for:

- Email verification
- Password reset

If you do not configure SMTP, signup will “work”, but users will not receive verification/reset emails, which will break your current app flows.

## SMTP (practical explanation)

SMTP is simply “how servers send emails”.

In production you must configure Supabase to use an SMTP provider, otherwise:

- verification emails will not arrive
- password reset emails will not arrive

Common options:

- a transactional email provider (recommended): Postmark, Mailgun, SendGrid, Amazon SES
- your own mail server (harder, more maintenance)

What you will need from your provider:

- SMTP host (example: `smtp.postmarkapp.com`)
- SMTP port (usually `587` for STARTTLS)
- username + password
- sender address (example: `no-reply@yourdomain.com`)

Important:

- Use STARTTLS (`587`) unless your provider tells you otherwise.
- Test the full flow: signup → email arrives → click link → app recognizes confirmed email.

## Backups

At minimum:

- Postgres daily backups
- Keep backups off the VPS (Hetzner Storage Box is a simple option)

## How to deploy Supabase (high level)

Use the official Supabase Docker Compose setup and run it on the VPS.

Reference (official docs):

- Self-hosting guide: `https://supabase.com/docs/guides/self-hosting`

Notes:

- Change all default secrets before exposing anything publicly.
- Keep internal ports closed (only expose 80/443 from the reverse proxy).

## What you need to fill in (before going live)

- `SITE_URL` (your public site URL)
- `API_EXTERNAL_URL` (the public Supabase API URL)
- SMTP settings (host, port, user, password, sender)
- Postgres password
- JWT secret

## Security basics (do these)

- Enable Hetzner Cloud Firewall:
  - Allow: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - Block everything else
- SSH:
  - Use SSH keys
  - Disable password login
- Updates:
  - Keep the VPS updated

## Local development (recommended)

Before renting a server, run Supabase locally so you can:

- Create tables and policies
- Verify auth flows
- Test storage uploads

You can do that with the Supabase CLI locally, or with the official Docker Compose.

