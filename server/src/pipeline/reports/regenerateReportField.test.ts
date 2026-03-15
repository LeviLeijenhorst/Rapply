import assert from "node:assert/strict"
import test from "node:test"
import type { StructuredReportField } from "../../types/Report"
import { regenerateReportField } from "./regenerateReportField"

function createField(overrides?: Partial<StructuredReportField>): StructuredReportField {
  return {
    fieldId: "rp_werkfit_5_1",
    label: "Re-integratieactiviteiten en begeleidingsuren",
    fieldType: "ai",
    answer: "Bestaand antwoord",
    factualBasis: "",
    reasoning: "",
    confidence: null,
    updatedAtUnixMs: 1,
    versions: [],
    ...overrides,
  }
}

test("regenerateReportField returns empty answer when factualBasis is empty and keeps userPrompt", async () => {
  const updated = await regenerateReportField({
    field: createField(),
    userPrompt: "Maak het korter",
  })
  assert.equal(updated.answer, "")
  assert.equal(updated.versions.length, 1)
  assert.equal(updated.versions[0].source, "ai_regeneration")
  assert.equal(updated.versions[0].prompt, "Maak het korter")
})
