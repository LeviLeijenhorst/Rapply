import assert from "node:assert/strict"
import test from "node:test"

import { resolveAnswerText } from "./completePipelineChat"

test("resolveAnswerText ignores placeholder parsed values", () => {
  const answer = resolveAnswerText({
    raw: '{"answer":"string"}',
    parsedAnswer: "string",
  })
  assert.equal(answer, "")
})

test("resolveAnswerText falls back to raw text when parsed answer is placeholder", () => {
  const answer = resolveAnswerText({
    raw: "Natuurlijk, waarmee kan ik u helpen?",
    parsedAnswer: "string",
  })
  assert.equal(answer, "Natuurlijk, waarmee kan ik u helpen?")
})

