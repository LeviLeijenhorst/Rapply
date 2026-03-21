# Transcription Migration Memory

This directory is the shared handoff space for the batch transcription migration.

Use these files as the source of truth before changing related code:

- `memory.md`: stable context, constraints, decisions, and current-state notes.
- `refined-plan.md`: the execution plan that replaces the original PDF where needed.
- `worklog.md`: progress notes, open questions, and next steps for other agents.

Code areas currently in scope:

- `server/src/transcription/**`
- `server/src/summaries/**`
- `app/app/services/transcription*.ts`
- deployment/config for the future Whisper worker

Current direction:

- Keep the control plane in Express.js.
- Treat the Whisper runtime as a separate GPU worker, not a second general backend.
- Decouple transcript creation from summary generation.
- Preserve realtime transcription as fallback while batch Whisper is rolled out.
