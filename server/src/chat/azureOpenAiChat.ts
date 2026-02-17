import { env } from "../env"
import { completeAzureOpenAiChat, type ChatMessage } from "../ai/azureOpenAi"

// Intent: normalizeText
function normalizeText(value: string) {
  return String(value || "").trim()
}

// Intent: safeMessages
function safeMessages(messages: any): ChatMessage[] {
  const arr = Array.isArray(messages) ? messages : []
  const out: ChatMessage[] = []
  for (const m of arr) {
    const role = m?.role
    const content = normalizeText(m?.content)
    if (role !== "system" && role !== "user" && role !== "assistant") continue
    if (!content) continue
    out.push({ role, content })
  }
  if (out.length === 0) {
    throw new Error("Missing messages")
  }
  const totalChars = out.reduce((sum, m) => sum + m.content.length, 0)
  if (totalChars > 80_000) {
    throw new Error("Messages are too long")
  }
  return out
}

const sessionScopeMarker = "[COACHSCRIBE_SESSION_SCOPE]"
const crossSessionLeakageMarkers = [
  "Hier zijn transcripties van gesprekken met",
  "Transcripties van gesprekken:",
  "Hier zijn samenvattingen van eerdere gesprekken met",
  "Samenvattingen van gesprekken:",
]

function buildSessionScopeLine(sessionId: string) {
  return `Session-ID: ${sessionId}`
}

export function buildChatPolicySystemPrompt() {
  return [
    "Je bent een Nederlandstalige coach-assistent.",
    "Gebruik alleen informatie uit de aangeleverde context en de gebruikerstekst.",
    "Verzin nooit feiten, citaten, gebeurtenissen of actiepunten.",
    "Als een vraag om actiepunten vraagt, noem alleen actiepunten die expliciet in de context of gebruikerstekst staan.",
    "Als er geen expliciete actiepunten zijn, zeg dat duidelijk en voeg geen nieuwe actiepunten toe.",
  ].join(" ")
}

export function enforceSessionScopedContext(messages: ChatMessage[], sessionId: string) {
  const normalizedSessionId = normalizeText(sessionId)
  if (!normalizedSessionId) {
    throw new Error("Missing sessionId for session-scoped chat")
  }

  const expectedScopeLine = buildSessionScopeLine(normalizedSessionId)
  const hasSessionScopeMarker = messages.some(
    (message) => message.role === "system" && message.content.includes(sessionScopeMarker) && message.content.includes(expectedScopeLine),
  )
  if (!hasSessionScopeMarker) {
    throw new Error("Session-scoped chat is missing session context marker")
  }

  for (const message of messages) {
    if (message.role !== "system") continue
    if (crossSessionLeakageMarkers.some((marker) => message.content.includes(marker))) {
      throw new Error("Cross-session context is not allowed for session-scoped chat")
    }
  }
}

// Intent: completeChatWithAzureOpenAi
export async function completeChatWithAzureOpenAi(params: {
  messages: any
  temperature?: unknown
  scope?: unknown
  sessionId?: unknown
}): Promise<string> {
  const deployment = String(env.azureOpenAiChatDeployment || "").trim()
  if (!deployment) {
    throw new Error("Azure OpenAI chat deployment is not configured")
  }

  const scope = normalizeText(typeof params.scope === "string" ? params.scope : "")
  const sessionId = normalizeText(typeof params.sessionId === "string" ? params.sessionId : "")
  const messages = safeMessages(params.messages)
  if (scope === "session") {
    enforceSessionScopedContext(messages, sessionId)
  }
  const temperatureRaw = typeof params.temperature === "number" ? params.temperature : Number(params.temperature)
  const temperature = Number.isFinite(temperatureRaw) ? Math.max(0, Math.min(1, temperatureRaw)) : 0.2

  const text = await completeAzureOpenAiChat({
    deployment,
    messages: [{ role: "system", content: buildChatPolicySystemPrompt() }, ...messages],
    temperature,
  })

  if (!text) {
    throw new Error("No chat response returned")
  }
  return text
}
