import assert from "node:assert/strict"
import test from "node:test"
import type { Note } from "../../types/Note"
import type { Session } from "../../types/Session"
import type { Snippet } from "../../types/Snippet"
import { selectEvidenceForReport } from "./evidenceSelection"

function createInput(id: string): Session {
  return {
    id,
    clientId: "client-1",
    trajectoryId: "trajectory-1",
    title: "Input",
    inputType: "spoken_recap",
    sourceText: null,
    sourceMimeType: null,
    audioUploadId: null,
    audioDurationSeconds: null,
    uploadFileName: null,
    transcriptText: null,
    summaryText: null,
    summaryStructured: null,
    transcriptionStatus: "done",
    transcriptionError: null,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createNote(id: string): Note {
  return {
    id,
    clientId: "client-1",
    sourceInputId: null,
    sessionId: "",
    title: `Note ${id}`,
    text: `Text ${id}`,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createSnippet(params: {
  id: string
  sourceInputId: string
  fieldId: string
  text: string
  approvalStatus: "pending" | "approved" | "rejected"
}): Snippet {
  return {
    id: params.id,
    clientId: "client-1",
    trajectoryId: "trajectory-1",
    sourceSessionId: params.sourceInputId,
    sourceInputId: params.sourceInputId,
    snippetType: params.fieldId,
    fieldId: params.fieldId,
    text: params.text,
    snippetDate: 1,
    approvalStatus: params.approvalStatus,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

test("selectEvidenceForReport selects only approved snippets for selected inputs", () => {
  const selected = selectEvidenceForReport({
    inputs: [createInput("input-1"), createInput("input-2")],
    notes: [createNote("note-1"), createNote("note-2")],
    snippets: [
      createSnippet({
        id: "snippet-1",
        sourceInputId: "input-1",
        fieldId: "rp_werkfit_5_1",
        text: "Approved evidence",
        approvalStatus: "approved",
      }),
      createSnippet({
        id: "snippet-2",
        sourceInputId: "input-1",
        fieldId: "rp_werkfit_5_1",
        text: "Pending evidence",
        approvalStatus: "pending",
      }),
      createSnippet({
        id: "snippet-3",
        sourceInputId: "input-2",
        fieldId: "rp_werkfit_5_2",
        text: "Approved evidence 2",
        approvalStatus: "approved",
      }),
    ],
    selectedInputIds: ["input-1"],
    selectedNoteIds: ["note-2"],
  })

  assert.equal(selected.selectedInputs.length, 1)
  assert.equal(selected.selectedNotes.length, 1)
  assert.equal(selected.approvedSnippets.length, 1)
  assert.equal(selected.approvedSnippets[0].id, "snippet-1")
  assert.deepEqual(selected.evidenceByFieldId.get("rp_werkfit_5_1"), ["Approved evidence"])
  assert.deepEqual(selected.evidenceByFieldId.get("general_notes"), ["Note note-2\nText note-2"])
})

test("selectEvidenceForReport throws when selected evidence exceeds token limit", () => {
  const hugeText = "bewijs ".repeat(20_000)

  assert.throws(
    () =>
      selectEvidenceForReport({
        inputs: [createInput("input-1")],
        notes: [],
        snippets: [
          createSnippet({
            id: "snippet-1",
            sourceInputId: "input-1",
            fieldId: "rp_werkfit_5_1",
            text: hugeText,
            approvalStatus: "approved",
          }),
        ],
        selectedInputIds: ["input-1"],
        selectedNoteIds: [],
      }),
    /te groot/i,
  )
})
