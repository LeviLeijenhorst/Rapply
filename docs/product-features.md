This document describes the functionality of the Coachscribe web application.

It defines the core domain concepts and system behavior.

---

# 1. Product Overview

Coachscribe helps reintegration and coaching professionals manage clients, record sessions, extract structured knowledge from conversations, and generate formal reports.

The system focuses on:

- reducing administrative work  
- generating reports faster  
- extracting insights from coaching sessions  
- supporting collaboration between coaches  

All data processing and storage must occur inside the European Union.

---

# 2. Clients

A **client** represents a person receiving coaching.

Currently, a client is directly associated with a trajectory.

Each client contains:

- personal information  
- sessions  
- notes  
- snippets  
- reports  
- documents (future)  

Multiple coaches can access and work with the same client.

---

# 3. Sessions

A **session** represents a conversation or recap about a client.

Sessions can originate from multiple input types.

Supported input types:

- recorded audio  
- uploaded audio file  
- uploaded document  
- written recap  

Sessions produce several outputs:

- transcription  
- summary  
- snippets  
- notes  

---

# 4. Transcription

Audio inputs are transcribed automatically.

Processing flow:

audio → transcription  

Audio should only be stored until transcription is complete, then removed.

---

# 5. Summaries

Each session generates a **structured summary**.

Purpose:

- quick recap for the coach  
- shareable recap for the client  

Summaries are generated from the transcript.

---

# 6. Snippets

Snippets are relevant pieces of information extracted from sessions.

They are used for knowledge extraction and report generation.

Snippet fields:

- text  
- snippet type  
- source session  
- approval status  

Snippet states:

- pending  
- approved  
- rejected  

Approved snippets become part of the client knowledge base.

---

# 7. Client Knowledge

Approved snippets collectively form the **client knowledge base**.

This knowledge base is used by:

- report generation  
- AI chat  
- insights across sessions  

---

# 8. Reports

Reports are formal documents generated from client knowledge.

Report inputs include:

- approved snippets  
- client data  
- report template structure  

Currently supported templates:

- UWV re-integratieplan  
- UWV eindrapportage  

Report states:

- incomplete  
- needs review  
- complete  

---

# 9. AI Chat

Two AI chat systems exist.

## Client Chat

Context includes:

- approved snippets  
- session summaries  
- client notes  

Purpose:

Allow coaches to ask questions about the entire trajectory.

Example:

What did the client discuss with another coach last week?

---

## Session Chat

Context includes:

- transcript  
- snippets  
- summary  
- notes  

Purpose:

Allow questions about a specific session.

---

# 10. Input Types

Sessions can be created from:

### Audio Recording

The coach records the conversation.

### Audio Upload

The coach uploads an existing recording.

### Document Upload

Documents related to the trajectory can be processed.

### Written Recap

The coach writes a recap after the session.

For written recaps, snippets should preserve wording as closely as possible.

---

# 11. Future Features

Planned future features include:

- client portal  
- document ingestion  
- additional report templates  
- sustainability metrics  
- additional trajectories  

These features should be considered when designing system architecture.