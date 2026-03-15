import assert from "node:assert/strict"
import test from "node:test"
import { listSupportedUwvTemplates, readSupportedUwvTemplate } from "./uwvTemplates"

test("uwv templates expose corrected labels and UTF-8 cliënt text", () => {
  const template = readSupportedUwvTemplate("reintegratieplan_werkfit_maken")
  const byNumberKey = new Map(template.fields.map((field) => [field.exportNumberKey, field.label]))

  assert.equal(byNumberKey.get("4.1"), "Ordernummer")
  assert.equal(byNumberKey.get("5.1"), "Re-integratieactiviteiten en begeleidingsuren")
  assert.equal(byNumberKey.get("6.1"), "Doorlooptijd")
  assert.equal(byNumberKey.get("7.1"), "Visie op dienstverlening")
  assert.equal(byNumberKey.get("8.1"), "Specialistisch uurtarief")
  assert.match(byNumberKey.get("8.3") || "", /hogere uurtarief/i)
  assert.match(byNumberKey.get("7.2") || "", /cliënt/i)

  const templates = listSupportedUwvTemplates()
  assert.ok(templates.some((item) => item.id === "reintegratieplan_werkfit_maken"))
})
