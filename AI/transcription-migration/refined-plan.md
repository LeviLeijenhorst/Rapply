# Refined Plan

## Architecture Choice

Use an Express.js control plane plus a separate Whisper GPU worker.

Why:

- The existing backend, auth, billing, and data model already live in Express.js.
- Moving the whole orchestration layer to Python would create two backends with overlapping responsibilities.
- Python still makes sense for the GPU worker because Whisper and faster-whisper are strongest there.
- This gives the benefits of Python for inference without paying the cost of a second product backend.

## Target Architecture

1. Mobile app records and encrypts audio.
2. Express preflights the job, returns an upload target, and records operation metadata.
3. Mobile uploads encrypted audio to storage.
4. Express starts a batch transcription using the configured provider.
5. In the target state, the provider is the Verda-hosted Whisper worker.
6. Express receives the transcript, stores job results, and triggers summary generation.
7. Downstream AI pipeline continues with summaries, snippets, and reports.

## Current Provider Reality Check

- Verda serverless containers currently bill in 10-minute intervals for running replicas.
- Verda explicitly recommends batch jobs for long inference durations above roughly 3 minutes.
- Verda batch jobs are async by default and each job gets its own replica.
- Verda can scale containers to zero when idle, but persistent storage still needs balance protection because zero balance can lead to deleted volumes.

Implication:

- Short recordings can use a request/response container path if cold-start and billing economics are acceptable.
- Longer recordings should use the provider's async batch-job flow instead of a long-lived HTTP request.
- Balance alerts and auto top-up are operational requirements, not optional polish.

## Execution Phases

### Phase 1: Cleanup and Decoupling

- Normalize provider/mode configuration names.
- Remove the assumption that transcript and summary are one server response.
- Introduce a dedicated self-hosted Whisper provider contract.
- Create shared migration memory for future agents.

### Phase 2: Express Control Plane Hardening

- Extend `transcription_operations` with provider, mode, external job id, and result metadata.
- Add explicit operation polling endpoints for async job handling.
- Persist transcript/error state server-side instead of only returning it inline.
- Add structured logging around upload, provider latency, and billing.

### Phase 3: Whisper Worker

- Implement a Python worker using faster-whisper.
- Package it as a container for Verda Serverless Containers.
- Cache model weights on persistent disk.
- Start with multilingual Whisper rather than Distil-Whisper for Dutch support.
- Validate Dutch and English quality first with a turbo-oriented multilingual checkpoint, then optimize speed if needed.
- Add health checks and readiness checks to avoid cold-start 500s.

### Phase 4: Verda Deployment

- Deploy short jobs on a request-driven serverless container.
- If long-running jobs prove unstable through the request path, move them to the provider's job/batch primitive.
- Configure alerts and automatic top-up safeguards.
- Measure cold start, throughput, queue wait, and cost per recorded hour.

### Phase 5: Rollout

- Keep realtime fallback active.
- Route a small percentage of recordings to the Whisper worker first.
- Compare quality, latency, and error rate for Dutch and English.
- Switch default batch provider once throughput is consistently better than realtime fallback economics.

## Open Questions

- Do we want Express to synchronously wait for worker completion at first, or move straight to async polling?
- What recording duration should trigger a provider-side batch job instead of a request/response path?
- Should summaries remain app-triggered, or should they move fully server-side after transcript persistence is added?

## Recommended Immediate Next Step

Implement the Python faster-whisper worker behind the HTTP contract already defined in the server, then wire the server to use it in a non-production environment.
