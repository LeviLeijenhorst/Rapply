# Manual Demo Smoke Checklist (Next-Week Flow)

## 1) Open client page and create input
- Open a client in the webapp.
- Verify active trajectory is selected implicitly (no mandatory trajectory picker for normal flow).
- Create a new **spoken recap** input.
- Confirm input appears on the client page with `inputType=spoken_recap`.

## 2) Upload PDF/DOCX input
- Create a new input via file upload and select a **PDF or DOCX**.
- Verify extraction succeeds and input is created with `inputType=uploaded_document`.
- Confirm rejected file types are blocked with a clear message.

## 3) Snippet pipeline and approval
- Confirm snippets are generated automatically after input save.
- Verify snippets are linked to the input and are question-specific by `fieldId`.
- Approve at least one snippet and reject at least one snippet.
- Confirm only approved snippets are counted for report generation eligibility.

## 4) Generate UWV report
- Go to new report flow and choose one of the two supported UWV templates:
  - `reintegratieplan_werkfit_maken`
  - `eindrapportage_werkfit_maken`
- Select explicit inputs and notes.
- Confirm generation is blocked when selection has zero approved snippets.
- Generate report and verify structured field map exists (`report_structured_json`).

## 5) Review and edit report
- On report screen, verify each field shows:
  - `fieldType` badge (`programmatic`, `ai`, `manual`)
  - confidence value (informational only)
- Manually edit an editable field and save.
- Regenerate an AI field with optional rewrite direction.
- Restore a previous version and verify answer updates.

## 6) Report chat sync
- Send a report chat message that requests rewriting of an AI field.
- Confirm chat response returns field updates and editor refreshes immediately.
- Verify updated field answer is persisted with a new `chat_update` version.

## 7) Export
- Export to UWV Word.
- Verify export uses structured field map deterministically (not markdown reparsing).
- Confirm key placeholders (including activity hour distribution and specialist tariff fields) are populated.

## 8) Safety/contract checks
- Confirm chat responses on client/input/report all include:
  - `answer`
  - `waitingMessage`
  - `tool`
  - `memoryUpdate`
  - `toneUpdate`
- Confirm report chat context excludes programmatic fields from AI edits.
