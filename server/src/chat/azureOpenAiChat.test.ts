import assert from "node:assert/strict"
import test from "node:test"
import type { ChatMessage } from "../ai/azureOpenAi"
import { buildChatPolicySystemPrompt, enforceSessionScopedContext } from "./azureOpenAiChat"

function makeSessionScopedMessages(sessionId: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `[COACHSCRIBE_SESSION_SCOPE]\nSession-ID: ${sessionId}\nGebruik uitsluitend context uit deze sessie.`,
    },
    { role: "system", content: "Hier is het transcript van het gesprek:\n\n..." },
    { role: "user", content: "Welke actiepunten zijn afgesproken?" },
  ]
}

test("enforceSessionScopedContext allows valid single-session context", () => {
  assert.doesNotThrow(() => enforceSessionScopedContext(makeSessionScopedMessages("session-1"), "session-1"))
})

test("enforceSessionScopedContext rejects missing session scope marker", () => {
  const messages: ChatMessage[] = [{ role: "system", content: "Hier is het transcript van het gesprek." }]
  assert.throws(() => enforceSessionScopedContext(messages, "session-1"), /missing session context marker/i)
})

test("enforceSessionScopedContext rejects known cross-session context markers", () => {
  const messages: ChatMessage[] = [
    ...makeSessionScopedMessages("session-1"),
    { role: "system", content: "Transcripties van gesprekken:\n\n1. sessie A\n..." },
  ]
  assert.throws(() => enforceSessionScopedContext(messages, "session-1"), /cross-session context/i)
})

test("buildChatPolicySystemPrompt includes grounded-action-points rule", () => {
  const prompt = buildChatPolicySystemPrompt()
  assert.match(prompt, /Noem alleen actiepunten die expliciet/i)
  assert.match(prompt, /voeg geen nieuwe actiepunten toe/i)
  assert.match(prompt, /Noem of gebruik nooit sprekerlabels/i)
  assert.match(prompt, /weiger niet onnodig/i)
})
