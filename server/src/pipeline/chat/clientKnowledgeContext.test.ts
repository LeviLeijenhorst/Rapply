import assert from "node:assert/strict"
import test from "node:test"
import { buildGroupedClientKnowledgeContext } from "./clientKnowledgeContext"
import type { Note } from "../../types/Note"
import type { Session } from "../../types/Session"
import type { Snippet } from "../../types/Snippet"

function createInput(params: {
  id: string
  clientId: string
  inputType: Session["inputType"]
  createdAtUnixMs: number
}): Session {
  return {
    id: params.id,
    clientId: params.clientId,
    trajectoryId: "trajectory-1",
    title: "Input",
    inputType: params.inputType,
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
    createdAtUnixMs: params.createdAtUnixMs,
    updatedAtUnixMs: params.createdAtUnixMs,
  }
}

function createSnippet(params: {
  id: string
  clientId: string
  sourceInputId: string
  approvalStatus: Snippet["approvalStatus"]
  text: string
}): Snippet {
  return {
    id: params.id,
    clientId: params.clientId,
    trajectoryId: "trajectory-1",
    sourceSessionId: params.sourceInputId,
    sourceInputId: params.sourceInputId,
    snippetType: "general",
    fieldId: "general",
    text: params.text,
    snippetDate: 1,
    approvalStatus: params.approvalStatus,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createNote(params: { id: string; clientId: string; sourceInputId: string | null; text: string; updatedAtUnixMs: number }): Note {
  return {
    id: params.id,
    clientId: params.clientId,
    sourceInputId: params.sourceInputId,
    sessionId: params.sourceInputId ?? "",
    title: "Notitie",
    text: params.text,
    createdAtUnixMs: params.updatedAtUnixMs,
    updatedAtUnixMs: params.updatedAtUnixMs,
  }
}

test("buildGroupedClientKnowledgeContext groups approved snippets by input type/date and includes notes", () => {
  const context = buildGroupedClientKnowledgeContext({
    clientId: "client-1",
    inputs: [
      createInput({ id: "input-1", clientId: "client-1", inputType: "recording", createdAtUnixMs: Date.parse("2026-03-03T09:00:00Z") }),
      createInput({ id: "input-2", clientId: "client-1", inputType: "written_recap", createdAtUnixMs: Date.parse("2026-03-06T09:00:00Z") }),
    ],
    snippets: [
      createSnippet({ id: "snippet-1", clientId: "client-1", sourceInputId: "input-1", approvalStatus: "approved", text: "Client bouwt ritme op." }),
      createSnippet({ id: "snippet-2", clientId: "client-1", sourceInputId: "input-2", approvalStatus: "approved", text: "Coach noteert voortgang." }),
      createSnippet({ id: "snippet-3", clientId: "client-1", sourceInputId: "input-2", approvalStatus: "pending", text: "Niet tonen." }),
    ],
    notes: [createNote({ id: "note-1", clientId: "client-1", sourceInputId: "input-2", text: "Extra context", updatedAtUnixMs: Date.parse("2026-03-12T09:00:00Z") })],
  })

  assert.match(context, /Opgenomen gesprek op/)
  assert.match(context, /Geschreven recap op/)
  assert.match(context, /Notitie bij Geschreven recap op/)
  assert.match(context, /Client bouwt ritme op\./)
  assert.match(context, /Coach noteert voortgang\./)
  assert.match(context, /Extra context/)
  assert.doesNotMatch(context, /Niet tonen\./)
})
