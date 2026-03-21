# Stable Memory

## Goal

Replace the current fragile transcription flow with an EU-hosted batch transcription pipeline that is fast enough to remove the product dependency on realtime transcription for normal recordings.

## Why This Exists

- Speechmatics batch transcription is too slow for the product.
- Realtime transcription is being used as a workaround, not because it is the desired architecture.
- The product value is structured context for coaches, not realtime speech tech itself.
- The transcription layer should become a reliable upstream step for summaries, snippets, and reports.

## Constraints

- EU-hosted.
- Minimal operations burden.
- No Kubernetes.
- Scale GPU usage down to zero when idle.
- Backend stack is primarily Express.js / TypeScript.
- Dutch and English must work well.
- Typical load is roughly 10 users with 2-3 concurrent transcription jobs.
- Existing mobile flow uploads encrypted audio and expects the server to handle secure transcription.

## Current State

- The mobile app encrypts audio locally, uploads it, and calls `/transcription/start`.
- The server decrypts the upload and calls the configured provider inline.
- Summary generation was incorrectly coupled to transcription completion in the app.
- Runtime naming was confusing:
  - `azure-fast-batch` meant "batch mode" even when Speechmatics was the real provider.
  - provider and mode semantics were mixed together.
- Realtime routes exist for Azure Speech and Speechmatics token issuance and charging.

## Directional Decisions

1. Keep the control plane in Express.js.
2. Do not create a second general-purpose backend just because the worker may be written in Python.
3. Model the GPU service as a dedicated batch Whisper worker with a narrow HTTP contract.
4. Keep realtime transcription available as a fallback path during rollout.
5. Make transcript creation and summary generation separate steps.

## Near-Term Code Decisions

- Normalize transcription runtime config to:
  - mode: `batch` or `realtime`
  - provider: `azure-speech`, `speechmatics`, or `self-hosted-whisper`
- Add a self-hosted Whisper provider contract on the server side.
- Keep old env aliases readable so existing environments do not break immediately.

## Worker Contract

Expected HTTP contract for the batch Whisper worker:

- Method: `POST`
- Content type: multipart form data
- Fields:
  - `audio`: binary audio payload
  - `language`: language code such as `nl` or `en`
- Auth: optional bearer token
- Response: JSON with `text` or `transcript`

This contract is intentionally simple so the worker can be implemented in Python without forcing the rest of the platform into Python.
