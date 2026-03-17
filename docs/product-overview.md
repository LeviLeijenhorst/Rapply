# Relibra — Product & System Overview

This document describes the functionality and domain model of the Relibra web application.

It combines the **product vision**, **core domain concepts**, and **system behavior**.

Relibra is designed for reintegration professionals who need to manage client trajectories, document sessions, and generate formal reports while minimizing administrative overhead.

All data processing and storage must occur inside the European Union.

---

# 1. Product Overview

Relibra helps reintegration coaches capture client interactions, build structured client knowledge, and generate formal reports with AI assistance.

The system focuses on:

- reducing administrative work
- generating reports faster
- maintaining a structured client trajectory
- supporting collaboration between coaches

The system turns fragmented coaching notes, recordings, and documents into an organized client record that can be reused across reporting, analysis, and collaboration.

---

# 2. Core Workflow

1. Input is added to a client (recorded conversation, uploaded audio, recorded recap, written recap or document).
2. recorded conversations, uploaded audio, recorded recap and non textual documents are transcribed.
3. AI extracts snippets from all inputs.
4. Extracted insights become candidate knowledge items.
5. Coaches review and approve snippets.
6. Approved snippets accumulate across sessions.
7. Reports and AI interactions use the accumulated client knowledge.

This workflow allows knowledge to build over time across multiple sessions.

---

# 3. Core Entities

## Client

A **client** represents a person receiving coaching or reintegration support.

Each client contains:

- personal information
- inputs
- notes
- snippets
- reports

Multiple coaches may access and collaborate within the same client context. By default clients belong to one coach but clients can be shared, making them have multiple assigned coaches.

The client record acts as the central container for all information related to a trajectory.

---

## Session

A **session** represents a coaching interaction or recap related to a client.

Sessions act as the primary container for new information entering the system.

Sessions may originate from multiple input types.

Supported input types:

- recorded audio
- uploaded audio file
- written recap
- uploaded document (future)

Sessions produce several outputs:

- transcript (if audio input)
- structured summary
- snippets
- notes

---

## Snippet (internal)

A **snippet** is a structured piece of insight extracted from transcripts or notes.

Examples include:

- observations
- facts
- conclusions
- progress updates

Snippets form the building blocks of the client knowledge base.

Snippet fields include:

- text
- snippet type
- source session
- approval status

Snippet states:

- pending
- approved
- rejected

Approved snippets become part of the client knowledge base.

Snippets are **not exposed directly in the UI** but are used internally to power summaries, reports, and AI interactions.

---

## Note

A **note** is manual text written directly by the coach.

Notes can exist independently or alongside session inputs.

Notes are included in AI context and can contribute to client understanding.

---

## Report

A **report** is a structured document generated from client knowledge.

Reports are typically generated using:

- approved snippets
- selected sessions
- client information
- predefined report templates

Reports represent formal outputs used for external communication or compliance.

Report states:

- incomplete
- needs_review
- complete

---

# 4. Transcription

Audio inputs are transcribed automatically.

Processing flow:

audio → transcription

Audio should only be stored until transcription is complete.

After transcription:

- the transcript is retained
- the audio recording should be deleted

Persistent knowledge consists of transcripts and structured insights rather than raw recordings.

---

# 5. Summaries

Each session generates a **structured summary**.

Purpose:

- provide a quick recap for the coach
- optionally provide a shareable recap for the client

Summaries are generated from the transcript or written recap.

---

# 6. Client Knowledge

Approved snippets collectively form the **client knowledge base**.

The client knowledge base represents accumulated understanding of the client's trajectory.

This knowledge base is used by:

- report generation
- AI chat
- cross-session insights
- higher-level summaries

Knowledge builds progressively as sessions are processed.

---

# 7. AI Interaction

AI interaction is embedded within the client and session workspaces.

Two primary AI interaction contexts exist.

---

## Client AI Interaction

Available inside the **Client Detail** page.

Context includes:

- approved snippets
- session summaries
- client notes
- client metadata

Purpose:

Allow coaches to ask questions about the entire trajectory.

Example:

"What did the client discuss with another coach last week?"

---

## Session AI Interaction

Available inside the **Session Detail** page.

Context includes:

- transcript
- snippets
- session summary
- session notes

Purpose:

Allow exploration of a specific session and assist with reviewing or refining outputs.

---

# 8. Main Pages

## Clients List

Overview of all clients within an organization.

Functions include:

- search
- filtering
- client creation

---

## Client Detail

The central workspace for a client.

Displays:

- client information
- session timeline
- accumulated summaries
- generated reports

AI interaction is available here for trajectory-level questions.

---

## Session Detail

Workspace for reviewing and processing a single session.

Displays:

- session inputs
- transcripts
- generated summaries
- extracted insights
- notes

AI interaction is available here for session-level exploration.

---

## New Input Flow

Flow for adding new information to a client.

Supported inputs include:

- audio recording
- spoken recap
- written recap
- uploaded audio
- uploaded document (future)

All inputs are processed and attached to a session.

---

## New Report Flow

Flow for generating a report from accumulated client knowledge.

Users can:

- select sessions
- choose a template
- generate a draft

---

## Report Editor

Environment for reviewing and editing generated reports.

Allows:

- manual editing
- AI assistance
- export to external formats

---

## Organization Settings

Configuration area for organizational behavior.

Examples include:

- template management
- user management
- data policies

---

# 9. Input Types

Sessions can be created from the following inputs.

### Audio Recording

The coach records the conversation directly inside the application.

### Audio Upload

The coach uploads an existing recording.

### Written Recap

The coach writes a recap after the session.

For written recaps, snippet extraction should preserve wording as closely as possible.

### Document Upload (future)

Documents related to the trajectory can be ingested and analyzed.

---

# 10. Reporting Features

The system supports template-based reporting workflows.

Currently supported templates include:

- UWV re-integratieplan
- UWV eindrapportage

Reports are generated using:

- approved snippets
- client information
- template structure

Additional templates may be added over time.

---

# 11. Privacy and Data Handling (EU)

All data processing and storage must occur inside the European Union.

The system minimizes long-term storage of raw recordings.

Operational lifecycle:

1. audio temporarily stored
2. transcription generated
3. transcript retained
4. audio deleted

Persistent data consists of:

- transcripts
- structured insights
- reports
- client information

---

# 12. Collaboration Model

Multiple coaches may work within the same client context.

Shared elements include:

- sessions
- accumulated client knowledge
- reports
- notes

This allows organizations to maintain continuity in client trajectories even when several coaches are involved.

---

# 13. Future Features

Planned future features include:

- client portal
- document ingestion
- additional report templates
- sustainability metrics
- additional trajectory types

These features should be considered when designing system architecture.