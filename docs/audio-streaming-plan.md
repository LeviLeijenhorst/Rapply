# Secure + Instant Playback Plan (Web)

## Goal
- End-to-end encrypted audio.
- No plaintext stored on the server.
- Playback feels instant after saving and after reload.
- Scrubbing works fast.
- Warn the user if they close the app while chunking or upload is still running.

## Core idea (one sentence)
Encrypt small time-based chunks immediately, upload them in the background, and only require the first few seconds to be ready for playback.

## Recording flow (microphone)
1. Record with `MediaRecorder` and a short timeslice (500–1000 ms).
2. Each chunk is encrypted immediately with AES-GCM.
3. Encrypted chunks are stored locally and uploaded in the background.
4. Playback can start as soon as the first 5–10 seconds are ready.

## Upload flow (existing audio file)
1. Start chunking immediately (do not encrypt the whole file first).
2. Encrypt each chunk with AES-GCM.
3. Store encrypted chunks locally and upload in the background.
4. Playback can start as soon as the first 5–10 seconds are ready.
5. If the user tries to close the app while this is still running, show a warning.

## Playback flow
1. Load encrypted chunks for the first 5–10 seconds from local storage if available.
2. If a chunk is missing locally, fetch it from the server.
3. Decrypt chunks in memory only.
4. Append decrypted bytes to a MediaSource buffer.
5. Maintain a small buffer window (10–30 seconds).
6. On scrub, fetch and decrypt chunks for the new time window.

## Key management
- One random AES-256 key per recording.
- The key is wrapped with the user device key.
- The server never sees keys.

## What we do not do
- We do not store plaintext audio on the server.
- We do not encrypt the whole file as a single blob for uploads.
- We do not require the full file to be processed before playback.

## User experience summary
- Save → Play feels instant.
- Reload → Play feels instant after the first chunks are fetched.
- Close during upload shows a warning.
- Scrubbing is fast.
