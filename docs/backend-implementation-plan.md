# Backend Implementation Plan

Scope:
- Feature 1: browser-based meeting recording (backend only)
- Feature 2: one-time Pipedrive import (backend only)
- No UI implementation in this plan

Conventions:
- Domain-first folders
- Explicit file names
- One responsibility per file
- No catch-all files (`helpers.ts`, `manager.ts`, `common.ts`, `misc.ts`)
- Product terms only (`client`, `session`, `transcript`, `summary`, `report`)

## Phase 0 - Foundation

Goal:
- Prepare shared backend seams so both features can be added cleanly.

Tasks:
1. Extract transcription route logic into explicit action files under `server/src/transcription/actions/`.
2. Keep route files thin and orchestration-free.
3. Add a stable place for long-lived connection setup (for recording ingest socket).

Deliverables:
1. New action files in `server/src/transcription/actions/` for:
   - charge context
   - charge/refund
   - provider resolution
   - batch run entrypoint
   - completion/failure finalization
2. Refactored:
   - `server/src/transcription/routes/registerTranscriptionStartRoutes.ts`
   - `server/src/transcription/routes/registerTranscriptionRealtimeRoutes.ts`

Done when:
1. Existing transcription endpoints behave exactly as before.
2. `cd server && npx tsc --noEmit` passes.
3. `cd server && npm run build` passes.

## Phase 1 - Meeting Recording Schema

Goal:
- Add recording lifecycle persistence without overloading `sessions`.

Tasks:
1. Add migration `server/sql/029_meeting_recordings.sql`.
2. Create table `meeting_recordings` for lifecycle and ingest state.
3. Reuse existing `audio_streams` and `audio_stream_chunks` for chunk bytes.

Required columns (`meeting_recordings`):
1. `id`
2. `owner_user_id`
3. `session_id`
4. `audio_stream_id`
5. `status`
6. `language_code`
7. `mime_type`
8. `sample_rate_hz`
9. `channel_count`
10. `source_app`
11. `provider`
12. `started_at_unix_ms`
13. `last_chunk_at_unix_ms`
14. `ended_at_unix_ms`
15. `expected_next_sequence`
16. `received_chunk_count`
17. `received_bytes`
18. `received_duration_ms`
19. `partial_transcript_text`
20. `final_transcript_text`
21. `stop_reason`
22. `error_message`
23. `created_at_unix_ms`
24. `updated_at_unix_ms`

Done when:
1. Migration is idempotent and safe to apply.
2. Indexes exist for `owner_user_id`, `session_id`, and active `status`.

## Phase 2 - Meeting Recording Domain

Goal:
- Add explicit recording domain modules and REST control endpoints.

Create folder:
- `server/src/meetingRecordings/`

Create files:
1. `server/src/meetingRecordings/store.ts`
2. `server/src/meetingRecordings/routes/registerMeetingRecordingRoutes.ts`
3. `server/src/meetingRecordings/createMeetingRecording.ts`
4. `server/src/meetingRecordings/readMeetingRecording.ts`
5. `server/src/meetingRecordings/stopMeetingRecording.ts`
6. `server/src/meetingRecordings/cancelMeetingRecording.ts`
7. `server/src/meetingRecordings/createMeetingRecordingToken.ts`
8. `server/src/meetingRecordings/consumeMeetingRecordingToken.ts`

Endpoints:
1. `POST /meeting-recordings/start`
2. `GET /meeting-recordings/:id`
3. `POST /meeting-recordings/:id/stop`
4. `POST /meeting-recordings/:id/cancel`

Registration updates:
1. Wire `registerMeetingRecordingRoutes` in `server/src/routes/registerRoutes.ts`.
2. Ensure any raw body routes are mounted before JSON body parsing in `server/src/index.ts`.

Session policy:
1. If `sessionId` passed: validate ownership and reuse.
2. Else: create new session.
3. Set `session.inputType = "recording"` and `session.transcriptionStatus = "transcribing"` at start.

Done when:
1. Recording start creates/links session and recording rows.
2. Stop/cancel endpoints are idempotent.

## Phase 3 - Meeting Recording Ingest (WebSocket + Chunk Persistence)

Goal:
- Support browser chunk stream ingestion with sequencing and auth.

Create files:
1. `server/src/meetingRecordings/registerMeetingRecordingSocket.ts`
2. `server/src/meetingRecordings/appendMeetingRecordingChunk.ts`
3. `server/src/meetingRecordings/expireStaleMeetingRecordings.ts`

Tasks:
1. Move server startup to explicit HTTP server creation.
2. Attach recording socket registration.
3. Validate ingest token on socket init.
4. Persist each chunk to `audio_stream_chunks`.
5. Update sequence and counters in `meeting_recordings`.
6. Ack chunk sequence to client.
7. Reject sequence gaps.
8. Handle duplicate chunk sequence idempotently.

Failure policies:
1. No chunks after start -> mark interrupted after timeout.
2. Socket disconnect -> grace window then interrupted/finalizing.
3. Invalid token -> immediate close.

Done when:
1. Chunks are persisted in order.
2. Recording state updates are visible via `GET /meeting-recordings/:id`.

## Phase 4 - Meeting Recording Finalization and Transcript Writeback

Goal:
- Turn captured stream into final session transcript and optional summary.

Create files:
1. `server/src/meetingRecordings/finalizeMeetingRecording.ts`
2. `server/src/meetingRecordings/runMeetingRecordingTranscription.ts`

Tasks:
1. Prefer live transcription path if available.
2. Fallback to batch transcription path using persisted chunks.
3. On success:
   - write `transcript_text` to session
   - set `transcription_status = "done"`
   - optionally run summary
4. On failure:
   - set session `transcription_status = "error"`
   - persist error details on recording row
5. Cleanup temporary audio bytes after successful finalization.

Done when:
1. A completed recording produces a usable session transcript.
2. Interrupted recordings either produce partial salvageable transcript or clear error state.

## Phase 5 - Pipedrive Schema

Goal:
- Add minimal durable import infrastructure.

Add migrations:
1. `server/sql/030_pipedrive_oauth.sql`
2. `server/sql/031_pipedrive_imports.sql`

Tables:
1. `integration_oauth_states`
2. `integration_connections`
3. `pipedrive_import_jobs`
4. `pipedrive_raw_entities`
5. `external_source_links`

Storage policy:
1. OAuth tokens encrypted at rest (reuse KMS pattern).
2. Raw API payloads stored as `jsonb` for debugging and remapping.

Done when:
1. Schema supports OAuth, queued jobs, raw snapshots, and idempotent linking.

## Phase 6 - Pipedrive OAuth Domain

Goal:
- Implement backend OAuth handshake and connection persistence.

Create folder:
- `server/src/integrations/pipedrive/`

Create files:
1. `server/src/integrations/pipedrive/routes/registerPipedriveRoutes.ts`
2. `server/src/integrations/pipedrive/store.ts`
3. `server/src/integrations/pipedrive/createPipedriveAuthorizationUrl.ts`
4. `server/src/integrations/pipedrive/completePipedriveAuthorization.ts`
5. `server/src/integrations/pipedrive/refreshPipedriveAccessToken.ts`
6. `server/src/integrations/pipedrive/readPipedriveConnection.ts`

Endpoints:
1. `POST /integrations/pipedrive/oauth/start`
2. `GET /integrations/pipedrive/oauth/callback`

Done when:
1. A user can complete OAuth once and persist a valid connection.
2. Expired tokens can be refreshed server-side.

## Phase 7 - Pipedrive Import Job Pipeline

Goal:
- Run one-time import asynchronously with progress tracking.

Create files:
1. `server/src/integrations/pipedrive/createPipedriveImportJob.ts`
2. `server/src/integrations/pipedrive/readPipedriveImportJob.ts`
3. `server/src/integrations/pipedrive/claimNextPipedriveImportJob.ts`
4. `server/src/integrations/pipedrive/runPipedriveImportJob.ts`
5. `server/src/integrations/pipedrive/storePipedriveRawEntity.ts`
6. `server/src/integrations/pipedrive/fetchPipedrivePersons.ts`
7. `server/src/integrations/pipedrive/fetchPipedriveOrganizations.ts`
8. `server/src/integrations/pipedrive/fetchPipedriveActivities.ts`
9. `server/src/integrations/pipedrive/fetchPipedriveNotes.ts`
10. `server/src/integrations/pipedrive/fetchPipedriveFiles.ts`

Endpoints:
1. `POST /integrations/pipedrive/imports`
2. `GET /integrations/pipedrive/imports/:jobId`

Execution model:
1. Background worker loop in server process.
2. Claim queued jobs with DB row lock.
3. Persist progress by entity type and page.

Done when:
1. Imports run asynchronously.
2. Status endpoint reports live progress and terminal state.

## Phase 8 - Pipedrive Mapping and Apply

Goal:
- Keep mapping logic explicit and versionable.

Create files:
1. `server/src/integrations/pipedrive/mapPipedrivePersonToClient.ts`
2. `server/src/integrations/pipedrive/mapPipedriveOrganizationToClientFields.ts`
3. `server/src/integrations/pipedrive/mapPipedriveActivityToSession.ts`
4. `server/src/integrations/pipedrive/mapPipedriveNoteToSessionNote.ts`
5. `server/src/integrations/pipedrive/applyPipedriveImportMappings.ts`

Mapping baseline:
1. `person -> client`
2. `organization -> clientDetails/employerDetails`
3. `activity -> session` (when meeting-like)
4. `note -> session note` (when session link exists)
5. `file -> raw only` in v1

Idempotency:
1. Use `external_source_links` before create/update.
2. Re-run import must not duplicate internal rows.

Done when:
1. Re-running same import is safe.
2. Mapping can be changed without changing fetch logic.

## Phase 9 - Failure Handling Hardening

Goal:
- Make both pipelines operationally safe.

Meeting recording cases:
1. missing chunks
2. duplicate chunks
3. out-of-order chunks
4. unexpected disconnect
5. provider failure
6. finalize timeout

Pipedrive cases:
1. OAuth state mismatch/expiry
2. API rate limits
3. pagination interruption
4. token refresh failure
5. malformed payload
6. partial mapping failures

Done when:
1. Failures are reflected in durable status fields.
2. Jobs/recordings never remain indefinitely in in-progress states.

## Phase 10 - Verification and Rollout

Required checks per phase:
1. `cd server && npx tsc --noEmit`
2. `cd server && npm run build`

Required targeted tests:
1. meeting recording lifecycle
2. recording timeout finalization
3. OAuth state validation
4. paginated import continuation
5. idempotent re-import

Rollout sequence:
1. Ship meeting recording schema + read-only endpoints first.
2. Ship ingest + finalization behind a feature flag.
3. Ship Pipedrive OAuth.
4. Ship import job fetch-only with raw persistence.
5. Enable mapping/apply after raw quality checks.

## Immediate Next Build Slice

Start with this first slice:
1. Phase 0
2. Phase 1
3. Phase 2 (without socket ingest yet)

Reason:
- It creates stable contracts quickly.
- It avoids committing to ingest transport details before lifecycle/state APIs are real.
