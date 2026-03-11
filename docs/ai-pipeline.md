# AI Pipeline

This document defines the AI architecture for Coachscribe and notes known gaps in the current implementation.

## Scope

The AI architecture consists of connected pipelines that start from user input and produce reusable outputs.

This document covers:

- session input processing
- summary generation
- snippet generation and labeling
- report generation
- chatbot context
- future training pipeline
- future preference-learning pipeline

## Input Types

The system should support these input types:

- spoken recap
- recorded conversation (session)
- uploaded conversation audio (session)
- written recap
- uploaded document (future)

Recorded conversations can be captured in real time or uploaded afterward.

Documents follow a separate flow and are treated separately in this document.

## Target Architecture

### 1. Input Intake

Every AI flow starts with an input. Audio-based inputs are converted to text. Written recap inputs already provide text.

### 2. Input Preparation

Before downstream AI tasks run, the input is prepared into a consistent format. In this document, "input normalization" means converting different input types into a uniform text structure for downstream processing.

That preparation can include:

- turning audio into transcript text
- cleaning obvious formatting differences between input types
- attaching metadata such as session or client context
- producing a consistent text representation for later prompting

Normalization does not change meaning. It ensures that summaries, snippets, reports, and chat flows operate on a predictable representation.

### 3. Parallel Outputs from the Input

For spoken recap, recorded conversation, uploaded audio, and written recap, two outputs are created in parallel:

- a summary
- a set of snippets

These outputs serve different purposes and are treated separately.

### 4. Summary Generation

A summary is generated for the session input and stored.

The summary is distinct from the snippet set. The summary provides a high-level overview. Snippets preserve smaller units of information for reuse in chat and reporting.

### 5. Snippet Generation

Snippets are generated from the same session input.

Snippet generation takes the reports linked to the current trajectory into account so the system can identify information likely to matter for reporting.

The system also preserves information that is not directly relevant for a report but is still useful as client or session knowledge.

### 6. Snippet Wording Rules

Snippet wording depends on input type:

- for written recap, snippet text should stay very close to the user's original wording
- for spoken recap and recorded conversations, snippet text does not need to stay as close to the original wording, as long as the meaning is preserved

This distinction must be explicit in prompting and evaluation.

### 7. Snippet Classes

There are two snippet classes, distinguished by label:

- report-relevant snippets
- general knowledge snippets

Report-relevant snippets are used in prompts for report generation.

General knowledge snippets are also stored, even when they are not needed for reporting, because they remain useful for AI chat about a client or a specific session.

### 8. Knowledge Storage

All snippets contribute to client knowledge.

Client knowledge is structured so that snippet groups remain traceable to the session they came from. Client-level knowledge is session-stamped or date-stamped so the system can distinguish which knowledge belongs to which session.

When the user opens AI chat at the client level, the prompt contains the client's snippets across sessions, organized by session.

When the user opens AI chat in a session context, the prompt contains only the knowledge associated with that session.

### 9. Report Generation Pipeline

When generating a report, the system uses the snippets labeled as relevant for that report.

The report pipeline:

- select the relevant snippet subset
- place that information into a structured prompt
- generate structured output that can be mapped into a document template

The generated response is structured enough to support population of a Word document or similar formal output format.

### 10. Chatbot Pipeline

The chatbot does not rely only on the latest input. It uses the stored snippet knowledge base.

The expected behavior is:

- session chat uses the snippet knowledge for that session
- client chat uses the snippet knowledge across the client, grouped by session

This allows the chatbot to answer questions about the current session and the broader client history.

### 11. Future Training Pipeline

A future training pipeline improves the system based on its own outputs and corrections over time.

This pipeline supports continuous quality improvement.

### 12. Future Preference-Learning Pipeline

A future preference-learning pipeline allows the AI system to learn how a specific user prefers outputs to be written, structured, and selected.

This is separate from client knowledge. It adapts the system to the working style and preferences of the professional using Coachscribe.

## Current State

The current codebase is broadly aligned with parts of this architecture, but not all of it is complete or fully verified.

Known gaps or uncertainties:

- uploaded document handling is a future feature
- snippet rejection exists and should be treated as part of the snippet review flow, not only approval
- the exact implementation details of input preparation and ordering still need to be verified against the code
- code-level module references are intentionally omitted here because this document is meant to stay high level
- the future training pipeline does not appear to be implemented yet
- the future preference-learning pipeline does not appear to be implemented yet

## Notes

This document is the architectural reference. If implementation differs, the code should be aligned to this model or the document should be updated after an explicit architecture decision.
