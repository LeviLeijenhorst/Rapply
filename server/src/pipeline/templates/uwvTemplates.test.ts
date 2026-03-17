import assert from "node:assert/strict"
import test from "node:test"
import { listAiTemplateFields, listSupportedUwvTemplates, readSupportedUwvTemplate } from "./uwvTemplates"

test("all AI fields define non-empty miniPrompt", () => {
  const templates = listSupportedUwvTemplates()
  for (const template of templates) {
    const aiFields = listAiTemplateFields(template)
    assert.ok(aiFields.length > 0)
    for (const field of aiFields) {
      assert.ok(field.aiConfig?.miniPrompt)
      assert.ok(String(field.aiConfig?.miniPrompt || "").trim().length > 0)
    }
  }
})

test("eindrapportage labels 7.6/7.7/7.8 use exact wording", () => {
  const template = readSupportedUwvTemplate("eindrapportage_werkfit_maken")
  const byFieldId = new Map(template.fields.map((field) => [field.fieldId, field.label]))
  assert.equal(byFieldId.get("er_werkfit_7_6"), "Wat is uw vervolgadvies en welke bemiddeling en/of begeleiding heeft de klant nog nodig?")
  assert.equal(byFieldId.get("er_werkfit_7_7"), "Toelichting op advies")
  assert.equal(byFieldId.get("er_werkfit_7_8"), "Wat vindt de klant van dit advies?")
})

test("reintegratieplan template remains available", () => {
  const templates = listSupportedUwvTemplates()
  assert.ok(templates.some((item) => item.id === "reintegratieplan_werkfit_maken"))
})
