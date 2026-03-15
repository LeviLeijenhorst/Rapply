import assert from "node:assert/strict"
import test from "node:test"
import type { Note } from "../../types/Note"
import type { StructuredReportField } from "../../types/Report"
import type { Snippet } from "../../types/Snippet"
import type { UwvTemplate } from "../templates/uwvTemplates"
import { buildReportChatContext } from "./reportChatContext"

const template: UwvTemplate = {
  id: "template-1",
  name: "Template",
  description: "desc",
  fields: [
    { fieldId: "p1", label: "Programmatic", fieldType: "programmatic", exportNumberKey: "1.1" },
    { fieldId: "a1", label: "AI", fieldType: "ai", exportNumberKey: "5.1" },
    { fieldId: "m1", label: "Manual", fieldType: "manual", exportNumberKey: "9.1" },
  ],
}

function createField(params: {
  fieldId: string
  fieldType: "programmatic" | "ai" | "manual"
  answer: string
  factualBasis: string
}): StructuredReportField {
  return {
    fieldId: params.fieldId,
    label: params.fieldId,
    fieldType: params.fieldType,
    answer: params.answer,
    factualBasis: params.factualBasis,
    reasoning: "",
    confidence: 0.5,
    updatedAtUnixMs: 1,
    versions: [],
  }
}

function createSnippet(params: {
  id: string
  clientId: string
  sourceInputId: string
  approvalStatus: "pending" | "approved" | "rejected"
  fieldId: string
  text: string
}): Snippet {
  return {
    id: params.id,
    clientId: params.clientId,
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

function createNote(params: { id: string; clientId: string; sourceInputId: string | null; text: string }): Note {
  return {
    id: params.id,
    clientId: params.clientId,
    sourceInputId: params.sourceInputId,
    sessionId: params.sourceInputId ?? "",
    title: "Notitie",
    text: params.text,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

test("buildReportChatContext excludes programmatic fields and keeps allowed evidence only", () => {
  const context = buildReportChatContext({
    reportId: "report-1",
    template,
    fields: {
      p1: createField({ fieldId: "p1", fieldType: "programmatic", answer: "Auto", factualBasis: "App data" }),
      a1: createField({ fieldId: "a1", fieldType: "ai", answer: "AI answer", factualBasis: "AI basis" }),
      m1: createField({ fieldId: "m1", fieldType: "manual", answer: "Manual answer", factualBasis: "Manual basis" }),
    },
    clientId: "client-1",
    sourceInputId: "input-1",
    snippets: [
      createSnippet({
        id: "snippet-1",
        clientId: "client-1",
        sourceInputId: "input-1",
        approvalStatus: "approved",
        fieldId: "a1",
        text: "Toegestane snippet",
      }),
      createSnippet({
        id: "snippet-2",
        clientId: "client-1",
        sourceInputId: "input-1",
        approvalStatus: "pending",
        fieldId: "a1",
        text: "Niet toegestaan",
      }),
      createSnippet({
        id: "snippet-3",
        clientId: "client-1",
        sourceInputId: "input-2",
        approvalStatus: "approved",
        fieldId: "a1",
        text: "Ander input-id",
      }),
    ],
    notes: [
      createNote({ id: "note-1", clientId: "client-1", sourceInputId: "input-1", text: "Toegestane notitie" }),
      createNote({ id: "note-2", clientId: "client-1", sourceInputId: "input-2", text: "Andere input" }),
      createNote({ id: "note-3", clientId: "client-2", sourceInputId: "input-1", text: "Andere client" }),
    ],
  })

  assert.match(context, /fieldId=a1/)
  assert.match(context, /fieldId=m1/)
  assert.doesNotMatch(context, /fieldId=p1/)

  assert.match(context, /Toegestane snippet/)
  assert.doesNotMatch(context, /Niet toegestaan/)
  assert.doesNotMatch(context, /Ander input-id/)

  assert.match(context, /Toegestane notitie/)
  assert.doesNotMatch(context, /Andere input/)
  assert.doesNotMatch(context, /Andere client/)
})
