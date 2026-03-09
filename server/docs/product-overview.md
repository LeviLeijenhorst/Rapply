# Product Overview

Coachscribe server supports reintegration and coaching workflows for professional coaches.

## Core Features

- Client management for trajectories and participant context.
- Session management across recorded audio, uploaded audio, uploaded documents, and written recaps.
- Session outputs: transcript, summary, snippets, and notes.
- Snippet approval workflow with `pending`, `approved`, and `rejected` states.
- Report generation from client context, approved snippets, and report templates.
- AI chat in two scopes:
  - client scope (approved snippets + summaries)
  - session scope (single session only)

## Compliance and Processing

- Data processing is intended to run in EU-hosted infrastructure.
- Uploaded source audio is used for transcription and removed after processing.
- Approved snippets form the client knowledge base used by reports and chat.
