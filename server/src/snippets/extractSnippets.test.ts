import assert from "node:assert/strict"
import test from "node:test"

import { buildFallbackGeneralSnippet, parseSnippetExtraction } from "./extractSnippets"

test("buildFallbackGeneralSnippet returns a general snippet for non-empty transcript", () => {
  const snippet = buildFallbackGeneralSnippet("Het ging redelijk goed met de client vandaag")
  assert.ok(snippet)
  assert.deepEqual(snippet?.fields, ["general"])
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
