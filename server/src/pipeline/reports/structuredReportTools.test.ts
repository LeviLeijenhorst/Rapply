import assert from "node:assert/strict"
import test from "node:test"
import type { UwvTemplate } from "../templates/uwvTemplates"
import {
  appendFieldVersion,
  buildReportTextFromStructured,
  createStructuredField,
  createStructuredReport,
  updateStructuredReport,
} from "./structuredReportTools"

const template: UwvTemplate = {
  id: "template-test",
  name: "Template Test",
  description: "test",
  fields: [
    {
      fieldId: "field-programmatic",
      label: "Naam client",
      fieldType: "programmatic",
      exportNumberKey: "1.1",
    },
    {
      fieldId: "field-ai",
      label: "Activiteiten",
      fieldType: "ai",
      exportNumberKey: "5.1",
    },
  ],
}

test("structured report helpers preserve fieldId mapping and version history", () => {
  const createdAtUnixMs = 1000
  const programmaticField = createStructuredField({
    field: template.fields[0],
    answer: "Jan Jansen",
    factualBasis: "App data",
    reasoning: "Programmatic",
    confidence: 1,
    source: "ai_generation",
    prompt: null,
    createdAtUnixMs,
  })
  const aiField = createStructuredField({
    field: template.fields[1],
    answer: "Client start met sollicitatieactiviteiten.",
    factualBasis: "- Uit intake",
    reasoning: "Evidence",
    confidence: 0.72,
    source: "ai_generation",
    prompt: null,
    createdAtUnixMs,
  })

  const report = createStructuredReport({
    template,
    fields: {
      [programmaticField.fieldId]: programmaticField,
      [aiField.fieldId]: aiField,
    },
    createdAtUnixMs,
  })

  const updatedAiField = appendFieldVersion({
    field: report.fields["field-ai"],
    source: "manual_edit",
    answer: "Client start met sollicitatieactiviteiten en netwerkacties.",
    prompt: null,
    createdAtUnixMs: createdAtUnixMs + 1,
  })

  const updatedReport = updateStructuredReport({
    report,
    fields: {
      ...report.fields,
      [updatedAiField.fieldId]: updatedAiField,
    },
    updatedAtUnixMs: createdAtUnixMs + 1,
  })

  assert.equal(updatedReport.fields["field-ai"].fieldId, "field-ai")
  assert.equal(updatedReport.fields["field-ai"].versions.length, 2)
  assert.equal(
    updatedReport.fields["field-ai"].versions[1].answer,
    "Client start met sollicitatieactiviteiten en netwerkacties.",
  )

  const reportText = buildReportTextFromStructured(template, updatedReport.fields)
  assert.match(reportText, /### 1\.1 Naam client/)
  assert.match(reportText, /### 5\.1 Activiteiten/)
})
