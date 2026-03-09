# Migration Rules

## 1. Architecture direction

- Folders represent product domains, not generic technical layers.
- Each major feature must have one obvious home.
- Feature orchestration belongs in domain files, not in screen files.
- UI flow belongs in `screens/` and UI-oriented hooks only.
- Infrastructure belongs in `audio/`, `encryption/`, `storage/`, and low-level `api/` transport files.

## 2. Naming

- Use descriptive English names.
- Prefer verbs for operations.
- Avoid vague names like `helpers`, `logic`, `manager`, `misc`, `common`.
- Use product terminology:
  - client
  - session
  - report
  - snippet
  - summary
  - transcript

Avoid legacy product terms in feature code and file names.

## 3. Prompt visibility

- Every AI capability must have an explicit prompt-building file when prompt construction is non-trivial.
- Raw prompt text should live in separate prompt files.
- Prompt files must be easy to locate and edit.

Preferred pattern:

```text
generateSessionSummary.ts
buildSessionSummaryPrompt.ts
prompts/sessionSummaryPrompt.md
```

## 4. CLI testing

CLI testing should live in:

```text
webapp/devtools/ai/
```

The initial commands should support:

- session summary
- session snippets
- report generation
- session chat
- client chat

The CLI should use real feature entrypoints where possible.

## 5. File deletion rules

Delete:

- one-line re-export files
- duplicate entrypoints
- legacy aliases
- dead code
- redundant wrappers

If a file exists only to forward an import, it should be removed.

## 6. File size and responsibility

- Prefer a small number of meaningful files over many tiny fragments.
- Each file should still have one clear responsibility.
- Merge tiny files when they only add indirection.
- Split files only when a file is doing multiple distinct jobs.

## 7. Migration sequence

Work feature by feature.

Planned order:

1. realtime transcription
2. summaries
3. snippets
4. client knowledge
5. reports
6. report export
7. batch transcription
8. chat

## 8. First transcription pseudocode experiment

The transcription feature will be the first place where code files get sibling pseudocode files.

Initial targets:

- `startRealtimeTranscription.ts`
- `transcribeRecordedSession.ts`
- `transcribeAudioFile.ts`
- `transcribeDocument.ts`
- `transcribeWrittenRecap.ts`
- `normalizeTranscript.ts`
