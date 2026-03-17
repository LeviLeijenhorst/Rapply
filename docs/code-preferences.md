# Coachscribe Code Preferences

This document defines implementation rules for the active migrated product (`webapp` + `server`), with emphasis on the pipeline.

## 1. Architectural defaults

- Server is the canonical source of truth.
- Frontend state is fetch/cache/UI state only.
- AI orchestration lives on the server.
- Frontend must call backend tools with explicit names; it must not assemble prompts or reasoning context.
- Avoid thin passthrough files that obscure ownership. Prefer domain modules with clear responsibility.

## 2. Canonical pipeline terminology

Use these terms consistently in pipeline surfaces, types, routes, and docs:

- `client`
- `trajectory`
- `input`
- `note`
- `snippet`
- `report`

Avoid legacy naming in new pipeline surfaces:

- `coachee`
- `session` (when the domain object is an input)
- `writtenReport`

## 3. Pipeline identity rules

- `fieldId` is the canonical report question id.
- Snippets are question-specific and keyed by `fieldId`.
- Structured report JSON (`report_structured_json`) is the editable report source of truth.
- Freeform `report_text` is derived/export support only.

## 4. AI and prompt ownership

- No prompts in frontend pipeline code.
- No frontend evidence grouping for pipeline chat or report generation.
- Backend tools own:
  - prompt construction
  - context grouping
  - evidence selection
  - model routing

## 5. Domain foldering and file ownership

- Organize by domain (`pipeline`, `reports`, `snippets`, `chat`, `clients`, `inputs`, `trajectories`, `notes`).
- Keep one file focused on one responsibility.
- Prefer explicit names (`generateReport`, `regenerateReportField`, `sendReportChatMessage`) over generic names.

## 6. TypeScript and quality rules

- No `@ts-nocheck` in pipeline surfaces.
- Prefer explicit shared types for report fields, field versions, and pipeline chat responses.
- Keep transformations deterministic and side-effect free where possible.

## 7. Export and template rules

- UWV export reads from structured report field maps deterministically.
- Do not reparse freeform markdown as report editing source.
- Current implementation supports the two active UWV templates; template loading must remain extensible so `tussentijdse rapportage` can be added without redesign.
