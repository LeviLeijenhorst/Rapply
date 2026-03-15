import assert from "node:assert/strict"
import test from "node:test"

import { buildFallbackGeneralSnippet } from "./extractSnippets"

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
