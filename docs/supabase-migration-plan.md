# Migration plan (Firebase → Supabase, self-hosted, fresh start, UUID users)

This repo has no live users and no production data, so the goal is to migrate cleanly without needing compatibility layers.

## Target state

- Supabase Auth (email/password) is the only auth system.
- Postgres holds:
  - feedback submissions
  - praktijk requests
  - subscription cancel feedback
  - billing state
  - upload tokens + transcription operation tracking
- Supabase Storage holds the temporary encrypted upload objects.
- A self-hosted backend API replaces Firebase Functions and verifies Supabase user JWTs.

## Order of work (safe and straightforward)

### 1) Stand up Supabase locally

Goal: you can log in, create tables, and create a storage bucket.

- Start Supabase locally (CLI or Docker)
- Create a test user
- Confirm you can sign in and get a session token

### 2) Create Postgres tables

Goal: create the SQL schema you need before writing app code.

Tables to create are listed in `docs/supabase-migration.md`.

### 3) Create the Storage bucket

Goal: replace Firebase Storage.

- Create a bucket for transcription uploads.
- Keep uploads private.
- Add policies so users can only upload to their own folder, and cannot read uploads.

### 4) Create the backend API (replacement for Firebase Functions)

Goal: keep your current request shape (`Authorization: Bearer <token>`) but verify Supabase tokens instead of Firebase tokens.

Backend responsibilities:

- Verify JWT and extract `user_id` (UUID).
- Use Supabase service role for:
  - reading and deleting storage uploads
  - reading/writing billing state and operation tables
- Keep endpoints identical to what the app calls:
  - `/transcription/preflight`
  - `/transcription/start`
  - `/billing/status`
  - `/billing/sync`
  - `/subscriptionCancel/feedback`
  - `/openaiSummary`
  - `/openaiChat`

### 5) Update the mobile app

Goal: remove Firebase SDK usage and swap to Supabase.

Concrete changes:

- Replace Firebase config with `app/app/config/supabase.ts`
- Replace auth calls:
  - `signInWithEmailAndPassword` → Supabase `signInWithPassword`
  - `createUserWithEmailAndPassword` → Supabase `signUp`
  - `sendEmailVerification` → Supabase email confirmation flow
  - password reset screens → Supabase reset flow
- Replace `getIdToken()` usage in `app/app/services/secureApi.ts`:
  - use Supabase session access token instead
- Replace Firestore writes:
  - `feedback` → Postgres insert
  - `praktijk_requests` → Postgres insert
- Replace Storage upload in `app/app/services/transcriptionUpload.ts`:
  - Firebase Storage `uploadBytes` → Supabase Storage upload

### 6) Remove Firebase project configuration

Goal: delete Firebase dependencies once everything is working.

- Remove `firebase` packages from `app/package.json`
- Remove Firebase backend code and config once backend is replaced (done)

## Cutover plan

Because there is no production usage yet, the “cutover” is:

- Merge the Supabase version
- Deploy Supabase + backend API
- Ship the app builds

No data migration needed.

