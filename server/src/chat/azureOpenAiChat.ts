import { env } from "../env"
import { completeAzureOpenAiChat, type ChatMessage } from "../ai/azureOpenAi"
import { normalizeText } from "../ai/shared/normalize"
import { splitTextByEstimatedTokenBudget } from "../ai/shared/textChunking"
import { removeSpeakerLabelsFromOutput } from "../ai/shared/textSanitization"

const conservativeMessageChunkTokenBudget = 8_000

// Intent: safeMessages
function safeMessages(messages: any): ChatMessage[] {
  const arr = Array.isArray(messages) ? messages : []
  const out: ChatMessage[] = []
  for (const m of arr) {
    const role = m?.role
    const content = normalizeText(m?.content)
    if (role !== "system" && role !== "user" && role !== "assistant") continue
    if (!content) continue
    const chunks = splitTextByEstimatedTokenBudget({
      text: content,
      maxAllowedTokens: conservativeMessageChunkTokenBudget,
    })
    if (chunks.length === 0) continue
    for (const chunk of chunks) {
      out.push({ role, content: chunk })
    }
  }
  if (out.length === 0) {
    throw new Error("Missing messages")
  }
  return out
}

const inputScopeMarker = "[COACHSCRIBE_INPUT_SCOPE]"
const crossInputLeakageMarkers = [
  "Hier zijn transcripties van gesprekken met",
  "Transcripties van gesprekken:",
  "Hier zijn samenvattingen van eerdere gesprekken met",
  "Samenvattingen van gesprekken:",
]

function buildInputScopeLine(inputId: string) {
  return `Input-ID: ${inputId}`
}

function hasInputScopeMarker(messages: ChatMessage[], expectedScopeLine: string): boolean {
  return messages.some(
    (message) => message.role === "system" && message.content.includes(inputScopeMarker) && message.content.includes(expectedScopeLine),
  )
}

function ensureInputScopeMarker(messages: ChatMessage[], inputId: string): ChatMessage[] {
  const expectedScopeLine = buildInputScopeLine(inputId)
  if (hasInputScopeMarker(messages, expectedScopeLine)) return messages
  return [
    {
      role: "system",
      content: `${inputScopeMarker}\n${expectedScopeLine}\nGebruik uitsluitend context uit dit input-item.`,
    },
    ...messages,
  ]
}

export function buildChatPolicySystemPrompt() {
  return [
    "Je bent de chat-assistent in een softwareproduct voor re-integratiecoaches in Nederland.",
    "",
    "Doel:",
    "- Help de gebruiker informatie uit beschikbare context op te vragen en te ordenen.",
    "- Geef antwoorden die direct aansluiten op de vraag van de gebruiker.",
    "",
    "Werkwijze:",
    "- Gebruik alleen informatie uit de aangeleverde context en het huidige gebruikersbericht.",
    "- Voeg geen informatie toe die niet uit die context komt.",
    "- Als informatie ontbreekt, benoem dat kort, geef een best-effort antwoord op basis van wat er wel is, en stel zo nodig 1 gerichte verduidelijkingsvraag.",
    "",
    "Stijl:",
    "- Schrijf in formeel, zakelijk Nederlands en spreek de gebruiker aan met 'u'.",
    "- Gebruik bij voorkeur bullet points.",
    "- Houd antwoorden compact, helder en concreet.",
    "",
    "Beperkingen:",
    "- Gebruik geen sprekerlabels zoals 'speaker_1', 'speaker 1', 'spreker 1' of varianten.",
    "- Herschrijf zulke labels stilzwijgend naar natuurlijke tekst.",
    "- Blijf neutraal en feitelijk.",
  ].join("\n")
}

export function enforceInputScopedContext(messages: ChatMessage[], inputId: string) {
  const normalizedInputId = normalizeText(inputId)
  if (!normalizedInputId) {
    throw new Error("Missing inputId for input-scoped chat")
  }

  const expectedScopeLine = buildInputScopeLine(normalizedInputId)
  if (!hasInputScopeMarker(messages, expectedScopeLine)) {
    throw new Error("Input-scoped chat is missing input context marker")
  }

  for (const message of messages) {
    if (message.role !== "system") continue
    if (crossInputLeakageMarkers.some((marker) => message.content.includes(marker))) {
      throw new Error("Cross-input context is not allowed for input-scoped chat")
    }
  }
}

export type ChatCompletionDetailed = {
  text: string
  rawModelText: string
  messagesSentToModel: ChatMessage[]
}

// Intent: completeChatWithAzureOpenAi
export async function completeChatWithAzureOpenAi(params: {
  messages: any
  temperature?: unknown
  scope?: unknown
  inputId?: unknown
}): Promise<string> {
  const detailed = await completeChatWithAzureOpenAiDetailed(params)
  return detailed.text
}

export async function completeChatWithAzureOpenAiDetailed(params: {
  messages: any
  temperature?: unknown
  scope?: unknown
  inputId?: unknown
}): Promise<ChatCompletionDetailed> {
  const deployment = String(env.azureOpenAiChatDeployment || "").trim()
  if (!deployment) {
    throw new Error("Azure OpenAI chat deployment is not configured")
  }

  const scope = normalizeText(typeof params.scope === "string" ? params.scope : "")
  const inputId = normalizeText(typeof params.inputId === "string" ? params.inputId : "")
  let messages = safeMessages(params.messages)
  if (scope === "input") {
    messages = ensureInputScopeMarker(messages, inputId)
    enforceInputScopedContext(messages, inputId)
  }
  const temperatureRaw = typeof params.temperature === "number" ? params.temperature : Number(params.temperature)
  const temperature = Number.isFinite(temperatureRaw) ? Math.max(0, Math.min(1, temperatureRaw)) : 0.2
  const messagesSentToModel: ChatMessage[] = [{ role: "system", content: buildChatPolicySystemPrompt() }, ...messages]

  const rawModelText = await completeAzureOpenAiChat({
    deployment,
    messages: messagesSentToModel,
    temperature,
  })

  if (!rawModelText) {
    throw new Error("No chat response returned")
  }
  const text = removeSpeakerLabelsFromOutput(rawModelText)
  return { text, rawModelText, messagesSentToModel }
}
