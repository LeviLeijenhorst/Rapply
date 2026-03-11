# Modal Inventory: New Input Modal

Surface:
1. `NewSessionModal` (modal-driven workflow for recording/uploading/transcribing new input).

Primary source:
1. `webapp/src/screens/record/NewSessionModal.tsx`
2. `webapp/src/screens/record/workflows/useNewSessionRecordingFlow.ts`
3. `webapp/src/screens/record/workflows/newSessionModalActions.ts`
4. `webapp/src/api/transcription/recorded/processRecordedSession.ts`

## 1. Features

1. Multi-step modal flow:
1. Select input type.
2. Consent step (when required).
3. Recording step.
4. Recorded preview/review step.
5. Upload step.
2. Supports options including conversation recording, report-summary recording, and upload-based flows.
3. Coachee + trajectory + template selection within modal.
4. Real-time transcription support path (runtime-config + token + live segments).
5. Recorded-audio processing path:
1. Optional encrypted audio storage.
2. Transcript generation.
3. Structured summary generation.
4. Session status updates (`transcribing`, `generating`, `done`, `error`).
6. Minutes checks and insufficient-minutes modal with subscription CTA.
7. Minimize/restore recording UI layer.
8. Note-taking panel while recording.
9. Create/open session on success.

## 2. Main functions used by this modal

Core modal/workflow:
1. `runPrimaryFooterAction`
2. `useNewSessionRecordingFlow`
3. `createAndOpenSession`
4. `processRecordedSession`
5. `startRealtimeTranscription`
6. `fetchRealtimeTranscriptionRuntime`
7. `readRemainingTranscriptionSeconds`
8. `readAudioDurationSeconds`

Local app-data actions invoked:
1. `createSession`
2. `updateSession`
3. `createNote`

## 3. Backend endpoints touched by this modal flow

Billing/runtime checks:
1. `POST /billing/status`
2. `POST /transcription/runtime-config`
3. `POST /transcription/realtime/token`
4. `POST /transcription/realtime/charge`

Transcription batch flow:
1. `POST /transcription/preflight`
2. `POST /transcription/start`
3. `POST /transcription/cancel`
4. `POST /summary/generate`

Audio/session persistence:
1. `POST /audio-blobs`
2. `POST /sessions/create`
3. `POST /sessions/update`
4. `POST /notes/create` (recording notes path)

## 4. Notes

1. This modal is a critical product surface even though it is not a standalone route.
2. It should be treated as a first-class inventory object in migration planning.
