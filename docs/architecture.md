# Architecture

## Module Boundaries

- `app`: bootstrap, shell, providers, routing
- `screens`: UI composition, selectors, view models only
- `ai`: pipeline and application logic (no React)
- `audio`: recording, upload, temporary processing lifecycle
- `api`: backend transport wrappers by feature
- `storage`: provider + stores
- `security`: encryption/crypto/providers
- `types`: domain entities
- `ui`: reusable visual components, inputs, layout, modal primitives
- `utils`: narrow text/date/id helpers

## Separation Rules

- Screens must not implement AI pipeline logic.
- AI modules must not import React or UI components.
- Storage must stay inside `storage/providers` and `storage/stores`.
- Audio lifecycle logic must stay under `audio/*`.

## Naming Rules

Legacy naming is normalized:

- `coachee` -> `client`
- `sessie` -> `session`
- `rapportage` -> `report`

This applies to file names, symbols, route names, variables, and API facades.

## Domain Model

- `Client`
- `Session`
- `Snippet`
- `Report`
- `Note`

`Session` is an interaction. Reports and notes are separate entities.

## AI Layer

AI module structure:

- `ai/pipeline`
- `ai/transcription`
- `ai/summaries`
- `ai/snippets`
- `ai/reports`
- `ai/chat`

Authoritative pipeline entry point:

- `ai/pipeline/processSessionInput.ts`
