import assert from "node:assert/strict"
import test from "node:test"

import { parseSnippetExtraction } from "./extractSnippets"

test("parseSnippetExtraction keeps one snippet with multiple labels", () => {
  const parsed = parseSnippetExtraction(
    JSON.stringify({
      snippets: [
        {
          fields: ["rp_werkfit_5_1", "er_werkfit_7_1"],
          text: "Client bouwt sollicitatieritme op met wekelijkse begeleiding.",
        },
      ],
    }),
  )
  assert.equal(parsed.length, 1)
  assert.deepEqual(parsed[0]?.fields, ["er_werkfit_7_1", "rp_werkfit_5_1"])
})

test("parseSnippetExtraction deduplicates overlapping field + fields outputs into one snippet", () => {
  const parsed = parseSnippetExtraction(
    JSON.stringify({
      snippets: [
        {
          field: "rp_werkfit_5_1",
          fields: ["rp_werkfit_5_1", "er_werkfit_7_1"],
          text: "Client start met arbeidsmarktoriëntatie.",
        },
      ],
    }),
  )
  assert.equal(parsed.length, 1)
  assert.deepEqual(parsed[0]?.fields, ["er_werkfit_7_1", "rp_werkfit_5_1"])
})

test("parseSnippetExtraction strips speaker labels from snippet text", () => {
  const parsed = parseSnippetExtraction(
    JSON.stringify({
      snippets: [
        {
          field: "general",
          text: "speaker_2: Ja, Het gaat best wel goed met de client.",
        },
      ],
    }),
  )
  assert.equal(parsed.length, 1)
  assert.doesNotMatch(String(parsed[0]?.text || "").toLowerCase(), /speaker_2/)
  assert.match(String(parsed[0]?.text || "").toLowerCase(), /het gaat best wel goed met de client/)
})
