import assert from "node:assert/strict"
import test from "node:test"
import { sanitizeMedicalContent } from "./sanitizeMedicalContent"

test("sanitizeMedicalContent rewrites medically sensitive language", () => {
  const input = "Client heeft depressie en gebruikt medicatie na diagnose."
  const output = sanitizeMedicalContent(input)
  assert.equal(
    output,
    "Client heeft mentale belastingsklachten en gebruikt ondersteuning na situatie.",
  )
})

test("sanitizeMedicalContent preserves non-medical text", () => {
  const input = "Client wil 2 dagen per week vrijwilligerswerk doen."
  const output = sanitizeMedicalContent(input)
  assert.equal(output, input)
})
