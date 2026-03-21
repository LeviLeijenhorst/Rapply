# Worklog

## 2026-03-21

- Extracted and reviewed the PDF plan.
- Confirmed the current app/server transcription flow is synchronous and tightly coupled.
- Found a concrete bug: the server returns an empty summary from `/transcription/start`, while the app treated summary as required.
- Normalized server runtime config naming around explicit provider and mode semantics.
- Added a self-hosted Whisper batch provider contract to the server.
- Decoupled summary generation from transcript creation in the app.

## Next Recommended Tasks

1. Add async operation fields and polling routes to `transcription_operations`.
2. Implement the Python faster-whisper worker.
3. Add an integration test or manual smoke test for transcript-only success plus summary generation success/failure.
4. Decide when to use sync request/response versus provider-managed batch jobs.
