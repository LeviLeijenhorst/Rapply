# Database Schema Inventory

## 1. Core identity and organization tables

### `public.users`
Columns:
1. `id` (PK)
2. `entra_user_id` (unique)
3. `email`
4. `display_name`
5. `full_name`
6. `phone_number`
7. `job_title`
8. `account_type` (`admin|paid|test`)
9. `role` (`admin|regular`)
10. `is_allowlisted`
11. `can_see_pricing_page`
12. `created_at`
13. `updated_at`

### `public.organizations`
Columns:
1. `id` (PK)
2. `name` (unique lower(name) index)
3. `postal_street`
4. `postal_house_number`
5. `postal_city`
6. `postal_code`
7. `visit_street`
8. `visit_house_number`
9. `visit_city`
10. `visit_postal_code`
11. `contact_name`
12. `contact_role`
13. `contact_phone`
14. `contact_email`
15. `created_at_unix_ms`
16. `updated_at_unix_ms`

### `public.organization_users`
Columns:
1. `organization_id` (FK -> organizations.id)
2. `user_id` (FK -> users.id)
3. `role` (`admin|regular`)
4. `created_at_unix_ms`
Primary key: `(organization_id, user_id)`

## 2. Client domain tables

### `public.clients`
Columns:
1. `id` (PK)
2. `name`
3. `client_details`
4. `employer_details`
5. `trajectory_start_date`
6. `trajectory_end_date`
7. `is_archived`
8. `created_at_unix_ms`
9. `updated_at_unix_ms`

### `public.client_organizations`
Columns:
1. `client_id` (FK -> clients.id)
2. `organization_id` (FK -> organizations.id)
3. `created_at_unix_ms`
Primary key: `(client_id, organization_id)`

### `public.client_owners`
Columns:
1. `client_id` (FK -> clients.id)
2. `user_id` (FK -> users.id)
3. `created_at_unix_ms`
Primary key: `(client_id, user_id)`

## 3. Input, transcript, summary, notes, snippets, reports

### `public.audio_uploads`
Columns:
1. `id` (PK)
2. `owner_user_id` (FK -> users.id)
3. `mime_type`
4. `bytes` (bytea)
5. `created_at_unix_ms`

### `public.inputs`
Columns:
1. `id` (PK)
2. `client_id` (FK -> clients.id)
3. `organization_id` (FK -> organizations.id, nullable)
4. `owner_user_id` (FK -> users.id, nullable)
5. `input_type` (`full_audio_recording|spoken_recap_recording|written_recap|uploaded_audio|uploaded_document`)
6. `title`
7. `source_text`
8. `source_upload_id` (FK -> audio_uploads.id, nullable)
9. `source_file_name`
10. `source_mime_type`
11. `processing_status` (`idle|transcribing|summarizing|done|error`)
12. `processing_error`
13. `created_at_unix_ms`
14. `updated_at_unix_ms`

### `public.input_transcripts`
Columns:
1. `input_id` (PK, FK -> inputs.id)
2. `transcript_text`
3. `language_code`
4. `created_at_unix_ms`
5. `updated_at_unix_ms`

### `public.input_summaries`
Columns:
1. `input_id` (PK, FK -> inputs.id)
2. `summary_text`
3. `summary_structured_json` (jsonb)
4. `created_at_unix_ms`
5. `updated_at_unix_ms`

### `public.notes`
Columns:
1. `id` (PK)
2. `client_id` (FK -> clients.id)
3. `input_id` (FK -> inputs.id, nullable)
4. `owner_user_id` (FK -> users.id, nullable)
5. `title`
6. `text`
7. `created_at_unix_ms`
8. `updated_at_unix_ms`

### `public.snippets`
Columns:
1. `id` (PK)
2. `client_id` (FK -> clients.id)
3. `source_input_id` (FK -> inputs.id, nullable)
4. `owner_user_id` (FK -> users.id, nullable)
5. `snippet_type`
6. `snippet_text`
7. `snippet_date`
8. `approval_status` (`pending|approved|rejected`)
9. `created_at_unix_ms`
10. `updated_at_unix_ms`

### `public.reports`
Columns:
1. `id` (PK)
2. `client_id` (FK -> clients.id)
3. `source_input_id` (FK -> inputs.id, nullable)
4. `owner_user_id` (FK -> users.id, nullable)
5. `title`
6. `report_type`
7. `state` (`incomplete|needs_review|complete`)
8. `report_text`
9. `report_structured_json` (jsonb)
10. `report_date`
11. `first_sick_day`
12. `wvp_week_number`
13. `created_at_unix_ms`
14. `updated_at_unix_ms`

### `public.templates`
Columns:
1. `id` (PK)
2. `organization_id` (FK -> organizations.id, nullable)
3. `owner_user_id` (FK -> users.id, nullable)
4. `name`
5. `sections_json` (jsonb)
6. `is_saved`
7. `created_at_unix_ms`
8. `updated_at_unix_ms`

## 4. Audio stream and transcription billing tables

### `public.audio_streams`
Columns:
1. `id` (PK)
2. `owner_user_id` (FK -> users.id)
3. `mime_type`
4. `total_duration_milliseconds`
5. `chunk_count`
6. `created_at_unix_milliseconds`

### `public.audio_stream_chunks`
Columns:
1. `audio_stream_id` (FK -> audio_streams.id)
2. `chunk_index`
3. `start_milliseconds`
4. `duration_milliseconds`
5. `bytes` (bytea)
6. `created_at_unix_milliseconds`
Primary key: `(audio_stream_id, chunk_index)`

### `public.transcription_operations`
Columns:
1. `operation_id` (PK)
2. `owner_user_id` (FK -> users.id)
3. `status`
4. `seconds_charged`
5. `charged_cycle_seconds`
6. `charged_non_expiring_seconds`
7. `remaining_seconds_after`
8. `plan_key`
9. `cycle_key`
10. `error_message`
11. `created_at`
12. `charged_at`
13. `completed_at`
14. `failed_at`
15. `refunded_at`

### `public.upload_tokens`
Columns:
1. `token` (PK)
2. `owner_user_id` (FK -> users.id)
3. `operation_id` (FK -> transcription_operations.operation_id)
4. `upload_blob_name`
5. `expires_at`
6. `used_at`
7. `created_at`

### `public.organization_transcription_settings`
Columns:
1. `organization_id` (PK, FK -> organizations.id)
2. `provider` (`azure|openai`)
3. `mode` (`fast_batch|realtime`)
4. `language_code`
5. `updated_at_unix_ms`
6. `updated_by_user_id` (FK -> users.id, nullable)

## 5. Billing tables (Mollie)

### `public.billing_customers`
Columns:
1. `organization_id` (PK, FK -> organizations.id)
2. `mollie_customer_id` (unique)
3. `created_at`
4. `updated_at`

### `public.billing_subscriptions`
Columns:
1. `organization_id` (PK, FK -> organizations.id)
2. `mollie_customer_id`
3. `mollie_subscription_id` (unique)
4. `status`
5. `plan_key`
6. `current_period_start_at`
7. `current_period_end_at`
8. `canceled_at`
9. `created_at`
10. `updated_at`

### `public.billing_payments`
Columns:
1. `id` (PK)
2. `organization_id` (FK -> organizations.id, nullable)
3. `mollie_payment_id` (unique)
4. `status`
5. `amount_value` (numeric(10,2))
6. `amount_currency`
7. `description`
8. `paid_at`
9. `created_at`
10. `updated_at`

## 6. E2EE key tables

### `public.e2ee_user_keys`
Columns:
1. `user_id` (PK, FK -> users.id)
2. `crypto_version`
3. `key_version`
4. `argon2_salt`
5. `argon2_time_cost`
6. `argon2_memory_cost_kib`
7. `argon2_parallelism`
8. `wrapped_ark_user_passphrase`
9. `wrapped_ark_recovery_code`
10. `wrapped_ark_server_kms`
11. `recovery_policy` (`self_service|custodian_only|hybrid`)
12. `custody_mode` (`server_managed|user_managed`)
13. `custodian_threshold`
14. `created_at_unix_ms`
15. `updated_at_unix_ms`

### `public.e2ee_object_keys`
Columns:
1. `user_id` (FK -> users.id)
2. `object_type`
3. `object_id`
4. `key_version`
5. `crypto_version`
6. `wrapped_dek`
7. `created_at_unix_ms`
8. `updated_at_unix_ms`
Primary key: `(user_id, object_type, object_id, key_version)`

## 7. Relationship summary

1. `users` <-> `organizations` via `organization_users`.
2. `clients` <-> `organizations` via `client_organizations`.
3. `clients` <-> `users` via `client_owners`.
4. `inputs`, `notes`, `snippets`, and `reports` are all client-scoped.
5. `inputs` may reference uploaded audio (`audio_uploads`).
6. `input_transcripts` and `input_summaries` are one-to-one with `inputs`.
7. Billing and transcription are organization/user scoped and linked to minute tracking.
8. E2EE keys are user scoped and object scoped for encrypted payload management.
