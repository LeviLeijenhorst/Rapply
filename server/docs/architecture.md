# Server Architecture

## Domain-Oriented Structure

The server is organized around functional domains:

- `auth/` authentication and user identity
- `billing/` subscription and minute accounting
- `transcription/` upload, provider selection, charging, and transcript lifecycle
- `chat/` conversational AI behavior and scope policies
- `summary/` AI summary and report text generation
- `routes/` HTTP registration grouped by domain
- `appData/` persistence-layer domain entities and mutations
- `e2ee/` encryption key material and object key management
- `ai/shared/` shared AI text normalization/chunking/sanitization
- `errors/` explicit typed domain errors
- `types/` explicit core domain types

## Architecture Conventions

- Action-focused files with explicit responsibilities.
- Explicit parser imports from domain parser modules (no catch-all parser barrel).
- No dead, unreferenced billing override modules retained.
- Transcription route helpers split into action modules under `routes/transcription/actions`.

## Runtime Validation

- TypeScript strict typecheck (`npx tsc --noEmit`) must pass.
- Production bundle build (`npm run build`) must pass.
