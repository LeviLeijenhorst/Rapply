# AI Pipeline

## Pipeline Steps

1. Input ingestion (audio, document, or written recap).
2. Transcription (when required by input type).
3. Summary generation.
4. Snippet extraction.
5. Snippet approval workflow.
6. Knowledge base update from approved snippets.
7. Report generation from templates and approved knowledge.

## Snippet Extraction Rules

- Written recap inputs preserve original wording as much as possible.
- Transcript/document inputs may be reformulated for clarity and report usefulness.

## Operational Notes

- Session-scoped chat enforces strict per-session context isolation.
- Client-scoped chat uses broader approved client knowledge.
- AI modules use shared token/chunking and output sanitation helpers.
