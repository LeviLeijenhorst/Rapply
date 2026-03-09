# processRecordedSession

## Purpose

Process completed recorded audio into session artifacts.

## Inputs

- `sessionId`
- `audioBlob`
- `mimeType`
- `shouldSaveAudio`
- optional realtime transcript override and charge payload
- session update callback

## Pipeline

1. Ensure only one active run per session.
2. Optionally encrypt and upload source audio, then persist `audioBlobId`.
3. If realtime transcript override exists:
   - charge realtime usage
   - generate structured summary from transcript override
4. Otherwise:
   - run batch transcription
   - if provider returns summary, store it
   - else generate structured summary from transcript
5. Update session status and pending-preview state.
6. Handle cancellation and user-friendly errors.
