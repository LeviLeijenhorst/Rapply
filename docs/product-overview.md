# Product Overview

Coachscribe helps reintegration coaches convert client interactions into structured knowledge and formal reports.

## Purpose

- Capture coaching conversations and recaps.
- Turn inputs into transcript-driven insights.
- Build a shared client knowledge base across coaches.
- Generate institutional report outputs.

## Core Workflow

1. Session input
2. Transcription
3. Snippet extraction
4. Summary generation
5. Snippet approval
6. Client knowledge accumulation
7. Report generation

## Entities

- `Client`
- `Session`
- `Snippet`
- `Report`
- `Note`

## Main Pages

- Clients list
- Client detail
- Session detail
- New input flow
- New report flow
- Report editor
- Organization settings

## Supported Input Types

- Full audio recording
- Spoken recap recording
- Written recap
- Uploaded audio file
- Uploaded document (future)

All inputs normalize to transcript text before downstream AI processing.

## Reporting Features

- UWV Re-integratieplan template support
- UWV Eindrapportage template support
- Uses approved snippets and selected sessions
- Report states: `incomplete`, `needs_review`, `complete`

## Privacy Positioning (EU)

- Audio is temporary operational data.
- Required lifecycle: temporary storage -> transcription -> transcript persistence -> audio deletion.
- Persistent knowledge is transcript and approved structured insight, not raw recording storage.

## Collaboration Model

- Multiple coaches can work on the same client context.
- Approved snippets and report artifacts contribute to shared client knowledge.

## Client Summaries

- Session summaries are generated as standard outputs.
- Client-level summary views can be generated from approved snippets and session summaries.
