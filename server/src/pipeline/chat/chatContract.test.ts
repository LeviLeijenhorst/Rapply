import assert from "node:assert/strict"
import test from "node:test"
import { createPipelineChatResponse } from "./chatContract"

test("createPipelineChatResponse always returns the universal chat contract shape", () => {
  const response = createPipelineChatResponse({
    tool: "sendClientChatMessage",
    answer: "Antwoord",
  })

  assert.equal(response.answer, "Antwoord")
  assert.equal(response.waitingMessage, "Even nadenken...")
  assert.equal(response.tool, "sendClientChatMessage")
  assert.equal(response.memoryUpdate, null)
  assert.equal(response.toneUpdate, null)
  assert.ok(Array.isArray(response.fieldUpdates))
})

test("createPipelineChatResponse preserves provided updates", () => {
  const response = createPipelineChatResponse({
    tool: "sendReportChatMessage",
    answer: "Gereed",
    memoryUpdate: { summary: "Nieuwe context" },
    toneUpdate: { tone: "zakelijk" },
    fieldUpdates: [{ fieldId: "rp_werkfit_5_1", answer: "Aangepast antwoord" }],
  })

  assert.deepEqual(response.memoryUpdate, { summary: "Nieuwe context" })
  assert.deepEqual(response.toneUpdate, { tone: "zakelijk" })
  assert.deepEqual(response.fieldUpdates, [{ fieldId: "rp_werkfit_5_1", answer: "Aangepast antwoord" }])
})
