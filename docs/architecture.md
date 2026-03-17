# Coachscribe Architecture (Webapp + Server)

## Scope

This architecture applies to the migrated product surfaces:

- `webapp`
- `server`

Expo `app` and Next.js `website` are out of scope for this pipeline architecture.

## Canonical domains

Pipeline domain objects:

- `client`
- `trajectory` (one active trajectory per client)
- `input`
- `note` (`clientId` + optional `sourceInputId`)
- `snippet` (`fieldId` question-specific)
- `report` (structured report JSON as source of truth)

## Ownership boundaries

### Server owns

- source-of-truth persistence for all pipeline entities
- AI prompt construction
- evidence selection and grouping
- model routing
- report reasoning + generation flow
- chat context assembly for client/input/report chat

### Webapp owns

- user interaction and selection UI
- rendering and editing structured report fields
- optimistic/cache state and refresh behavior
- calling named backend tools

Frontend pipeline code must not construct AI prompts or context payloads.

## Pipeline tools (backend endpoints)

Primary tool endpoints:

- `createInput`
- `extractDocumentText`
- `generateSnippets`
- `approveSnippet` / `rejectSnippet`
- `generateReport`
- `regenerateReportField`
- `saveReportFieldEdit`
- `sendClientChatMessage`
- `sendInputChatMessage`
- `sendReportChatMessage`

Chat endpoints return a uniform contract:

- `answer`
- `waitingMessage`
- `tool`
- `memoryUpdate`
- `toneUpdate`
- optional `fieldUpdates`

## Report model

`report_structured_json` is canonical for report editing and regeneration.

Per `fieldId` we store:

- `fieldType` (`programmatic` | `ai` | `manual`)
- `answer`
- `factualBasis`
- `reasoning`
- `confidence`
- `versions` (source + metadata)

`report_text` is derived for rendering/export compatibility; it is not the editable source of truth.

## Generation and regeneration flow

### Input flow

1. Create input.
2. Extract document text when applicable (PDF/DOCX).
3. Generate snippets automatically.
4. Require snippet approval before snippets enter chat/report evidence.

### Report generation

1. Coach selects template + inputs + notes.
2. Server loads only approved snippets from selected inputs plus selected notes.
3. Programmatic fields are filled from Coachscribe data only.
4. Server performs one reasoning call per report and stores factual basis + reasoning + confidence per `fieldId`.
5. Server performs one report generation call using stored factual bases.

### Field regeneration

- Uses stored factual basis only.
- Does not rerun reasoning.
- Appends a new field version and updates current answer.

## Export

UWV Word export is deterministic from structured report fields:

- map `fieldId` -> template `exportNumberKey` values
- derive template context values from structured fields
- generate export payload from structured state, not from reparsed freeform markdown edits

## Template strategy

Current supported templates:

- Re-integratieplan Werkfit maken
- Eindrapportage Werkfit maken

Template loading and field mapping are structured so `tussentijdse rapportage` can be added as a new template definition without redesigning pipeline interfaces.
