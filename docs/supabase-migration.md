# Supabase migration notes (self-hosted)

This repo currently depends on Firebase for:

- Client authentication (email + password, email verification, password reset)
- Firestore (a few “form submissions”, and several backend state collections)
- Cloud Storage (temporary encrypted audio uploads)
- Cloud Functions (the “secure API” the app calls with a bearer token)

The goal of this document is to list what exists today, and the direct Supabase equivalent for each part, so the migration can be done step-by-step without surprises.

## What Firebase is used for today

### Firebase Auth (client)

Used in the mobile app:

- Sign up, sign in, sign out
- Email verification
- Password reset / change password
- Update display name
- Delete account
- Access token retrieval for calling the backend (“secure API”)

Entry points:

- (removed) Firebase config
- `app/app/app.tsx`
- `app/app/screens/LoginScreen.tsx`
- `app/app/screens/SignupScreen.tsx`
- `app/app/screens/ResetPasswordScreen.tsx`
- `app/app/screens/ChangePasswordScreen.tsx`
- `app/app/screens/VerifyEmailScreen.tsx`
- `app/app/screens/SettingsAccountScreen.tsx`
- `app/app/services/secureApi.ts`

### Firestore

Used in the mobile app (direct client writes):

- `feedback` (Contact/feedback form)
- `praktijk_requests` (Praktijk request form)

Entry points:

- `app/app/screens/ContactFeedbackScreen.tsx`
- `app/app/screens/SubscriptionPraktijkScreen.tsx`

Used in backend functions (server-side state):

- `billingUsers` (transcription seconds accounting)
- `transcriptionOperations` (idempotency + status)
- `uploadTokens` (10-minute preflight token used once)
- `subscription_cancel_feedback` (subscription cancellation feedback)

Entry points:

- `functions/src/billingStore.ts`
- `functions/src/transcriptionSecure.ts`
- `functions/src/subscriptionCancelHttp.ts`

### Cloud Storage

Used for temporary encrypted audio uploads:

- Object path prefix: `transcriptionUploads/{uid}/...`
- Client only uploads; backend downloads, decrypts, then deletes

Entry points:

- `app/app/services/transcriptionUpload.ts`
- `functions/src/transcriptionSecure.ts`
- (removed) Firebase Storage rules

### Cloud Functions (secure API)

These endpoints are called with `Authorization: Bearer <Supabase access token>` and validated via Supabase Auth:

- `/transcription/preflight`
- `/transcription/start`
- `/billing/status` and `/billing/sync`
- `/subscriptionCancel/feedback`
- `/openaiSummary` and `/openaiChat`

Entry points:

- `functions/src/index.ts`
- `functions/src/transcriptionSecure.ts`
- `functions/src/billingHttp.ts`
- `functions/src/subscriptionCancelHttp.ts`

## Supabase equivalents (what we migrate to)

Supabase is essentially:

- **Postgres** for your database (replaces Firestore)
- **Auth** for users and sessions (replaces Firebase Auth)
- **Storage** for files (replaces Firebase Storage)
- Optional: **Edge Functions** (can replace Firebase Functions, but your current code is Node + streams, so a small self-hosted Node API is often the simplest path)

### Auth mapping

Firebase Auth → Supabase Auth (GoTrue):

- Email/password signup + login: supported
- Email verification: supported
- Password reset: supported
- Update display name: store display name in your own `profiles` table (recommended)
- Delete account: supported

Important difference:

- Firebase uses `uid` strings.
- Supabase users have an `id` (a UUID).

This matters because your backend uses the user id for:

- RevenueCat subscriber id
- Billing documents
- Upload path names

You must decide how you want to handle that id change (see “Big decisions” below).

### Firestore collections → Postgres tables

Suggested Postgres tables (names can be changed, but pick one approach and keep it consistent):

- `feedback`
  - `id` uuid primary key default gen_random_uuid()
  - `user_id` uuid null (references `auth.users(id)`)
  - `name` text null
  - `email` text null
  - `message` text not null
  - `created_at` timestamptz not null default now()

- `praktijk_requests`
  - `id` uuid primary key default gen_random_uuid()
  - `user_id` uuid not null
  - `email` text not null
  - `account_email` text null
  - `message` text not null
  - `created_at` timestamptz not null default now()

- `subscription_cancel_feedback`
  - `id` uuid primary key default gen_random_uuid()
  - `user_id` uuid not null
  - `selected_plan` text not null
  - `selected_reason` text not null
  - `other_reason_text` text null
  - `tips_text` text null
  - `account_email` text null
  - `created_at` timestamptz not null default now()

Server-only tables (only written/read by your backend service role key):

- `billing_users`
  - `user_id` uuid primary key
  - `purchased_seconds` integer not null default 0
  - `non_expiring_used_seconds` integer not null default 0
  - `cycle_used_seconds_by_key` jsonb not null default '{}'
  - `created_at` timestamptz not null default now()
  - `updated_at` timestamptz not null default now()

- `transcription_operations`
  - `operation_id` text primary key
  - `user_id` uuid not null
  - `status` text not null
  - `seconds_charged` integer null
  - `charged_cycle_seconds` integer null
  - `charged_non_expiring_seconds` integer null
  - `remaining_seconds_after` integer null
  - `plan_key` text null
  - `cycle_key` text null
  - `transcript` text null
  - `error_message` text null
  - `created_at` timestamptz not null default now()
  - `charged_at` timestamptz null
  - `completed_at` timestamptz null
  - `failed_at` timestamptz null
  - `refunded_at` timestamptz null

- `upload_tokens`
  - `token` text primary key
  - `user_id` uuid not null
  - `operation_id` text not null
  - `upload_path` text not null
  - `expires_at` timestamptz not null
  - `used_at` timestamptz null
  - `created_at` timestamptz not null default now()

### Storage mapping

Firebase Storage bucket → Supabase Storage bucket.

You can keep the same object key shape:

- `transcriptionUploads/{userId}/{operationId}/{timestamp}.csa1`

Policy intent should remain the same:

- Users can only upload into their own folder.
- Users cannot read uploads.
- Backend can read and delete uploads.

### Functions mapping (server)

You have Node code that:

- Verifies the user token
- Calls third-party APIs (Mistral Voxtral for transcription, Mistral for summaries/chat)
- Reads and deletes an encrypted file from storage
- Reads and writes billing / operation state

The simplest Supabase-friendly replacement is:

- A small self-hosted Node API (Express) that verifies Supabase JWTs.
- It uses the Supabase **service role key** to read/write Postgres and Storage.

This avoids rewriting stream-heavy code into Edge Functions.

## Big decisions we need from you

### 1) Do you need to keep existing users, or can everyone “start fresh”?

This is important because:

- You cannot safely migrate Firebase password hashes into Supabase in a simple way.
- If you want to keep accounts, the most common approach is: users log in again via a password reset flow on the new system.

Decision for this repo (current plan):

- Start fresh (no users yet).

### 2) What should the “stable user id” be going forward?

Right now you use Firebase `uid` everywhere, including RevenueCat subscriber ids.

With Supabase, the natural id is `auth.users.id` (UUID). If you switch ids:

- You need a plan for RevenueCat subscriber ids (usually: alias or migrate subscriber ids).

If you do not want to deal with that immediately, you can do a staged migration:

- First migrate Firestore + Storage + Functions away from Firebase,
  while keeping Firebase Auth temporarily.
- Then migrate Auth last.

Decision for this repo (current plan):

- Use Supabase UUIDs (`auth.users.id`) as the stable user id.

## Next steps in this repo

1) Decide the two “big decisions” above (existing users, and stable user id).
2) Stand up self-hosted Supabase locally (Docker) and confirm:
   - Auth works
   - Storage bucket exists
   - Tables exist
3) Replace the “secure API” auth verification:
   - Firebase `verifyIdToken` → Supabase JWT verification
4) Update the app:
   - Firebase Auth SDK → Supabase Auth
   - Firestore writes → Postgres inserts via Supabase
   - Storage uploads → Supabase Storage uploads

