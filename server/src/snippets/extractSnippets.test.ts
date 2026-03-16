import assert from "node:assert/strict"
import test from "node:test"

import { buildFallbackGeneralSnippet, parseSnippetExtraction } from "./extractSnippets"

test("buildFallbackGeneralSnippet returns a general snippet for non-empty transcript", () => {
  const snippet = buildFallbackGeneralSnippet("Het ging redelijk goed met de client vandaag")
  assert.ok(snippet)
  assert.equal(snippet?.field, "general")
  assert.match(String(snippet?.text || ""), /^Coach geeft aan dat /)
  assert.match(String(snippet?.text || "").toLowerCase(), /het ging redelijk goed/)
})

test("buildFallbackGeneralSnippet sanitizes medical wording", () => {
  const snippet = buildFallbackGeneralSnippet("Client heeft nog veel last van depressie")
  assert.ok(snippet)
  assert.doesNotMatch(String(snippet?.text || "").toLowerCase(), /depressie/)
})

test("buildFallbackGeneralSnippet strips speaker labels and timestamps", () => {
  const snippet = buildFallbackGeneralSnippet("[00:00.0] speaker_1: speaker_1: Het gaat wel goed met de client")
  assert.ok(snippet)
  assert.doesNotMatch(String(snippet?.text || ""), /\[00:00\.0\]/)
  assert.doesNotMatch(String(snippet?.text || "").toLowerCase(), /speaker_1/)
  assert.match(String(snippet?.text || "").toLowerCase(), /het gaat wel goed met de client/)
})

test("parseSnippetExtraction expands multi-field snippets into separate label entries", () => {
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
  assert.equal(parsed.length, 2)
  assert.deepEqual(
    parsed.map((item) => item.field).sort(),
    ["er_werkfit_7_1", "rp_werkfit_5_1"],
  )
})

test("parseSnippetExtraction deduplicates overlapping field + fields outputs", () => {
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
  assert.equal(parsed.length, 2)
  assert.equal(parsed.filter((item) => item.field === "rp_werkfit_5_1").length, 1)
  assert.equal(parsed.filter((item) => item.field === "er_werkfit_7_1").length, 1)
})
