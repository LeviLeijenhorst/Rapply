import { completeAzureOpenAiChat, streamAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { env } from "../../env"
import type { JsonValue } from "../../types/Report"
import { createPipelineChatResponse, type PipelineChatFieldUpdate, type PipelineChatResponse } from "./chatContract"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

function readDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiReportDeployment || env.azureOpenAiChatDeployment || env.azureOpenAiSummaryDeployment)
}

function extractFirstJsonObjectOrArray(value: string): string | null {
  const text = String(value || "")
  let startIndex = -1
  let opening = ""
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === "{" || char === "[") {
      startIndex = index
      opening = char
      break
    }
  }
  if (startIndex < 0) return null

  const closing = opening === "{" ? "}" : "]"
  let depth = 0
  let inString = false
  let isEscaped = false
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]
    if (isEscaped) {
      isEscaped = false
      continue
    }
    if (char === "\\") {
      isEscaped = true
      continue
    }
    if (char === "\"") {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === opening) depth += 1
    if (char === closing) depth -= 1
    if (depth === 0) return text.slice(startIndex, index + 1).trim()
  }
  return null
}

function safeJsonParse(value: string): { answer?: unknown; updates?: unknown[] } | null {
  const stripped = stripJsonCodeFences(String(value || ""))
  if (!stripped) return null
  try {
    return JSON.parse(stripped) as { answer?: unknown; updates?: unknown[] }
  } catch {
    const embedded = extractFirstJsonObjectOrArray(stripped)
    if (!embedded) return null
    try {
      return JSON.parse(embedded) as { answer?: unknown; updates?: unknown[] }
    } catch {
      return null
    }
  }
}

function isPlaceholderAnswer(value: string): boolean {
  const normalized = normalizeText(value).toLowerCase()
  return normalized === "string" || normalized === "antwoord" || normalized === "nvt"
}

export function resolveAnswerText(params: { raw: string; parsedAnswer: unknown }): string {
  const parsedAnswer = normalizeText(params.parsedAnswer)
  if (parsedAnswer && !isPlaceholderAnswer(parsedAnswer)) return parsedAnswer

  const raw = normalizeText(params.raw)
  if (!raw) return ""
  const parsedRaw = safeJsonParse(raw)
  if (parsedRaw) return ""
  if (isPlaceholderAnswer(raw)) return ""
  return raw
}

function toJsonValueOrNull(value: unknown): JsonValue | null {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    if (typeof value === "string") {
      const normalized = normalizeText(value)
      if (!normalized) return null
      if ((normalized.startsWith("{") && normalized.endsWith("}")) || (normalized.startsWith("[") && normalized.endsWith("]"))) {
        try {
          return JSON.parse(normalized) as JsonValue
        } catch {
          // Keep original string when it is not valid JSON.
        }
      }
    }
    return value as JsonValue
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalized = toJsonValueOrNull(item)
      return normalized === null ? "" : normalized
    }) as JsonValue
  }
  if (value && typeof value === "object") {
    const output: Record<string, JsonValue> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const normalizedChild = toJsonValueOrNull(child)
      if (normalizedChild === null) continue
      output[key] = normalizedChild
    }
    return output as JsonValue
  }
  return null
}

function readFieldUpdates(value: unknown[]): PipelineChatFieldUpdate[] {
  const updates: PipelineChatFieldUpdate[] = []
  for (const raw of value) {
    const fieldId = normalizeText((raw as { fieldId?: unknown })?.fieldId)
    const answer = toJsonValueOrNull((raw as { answer?: unknown })?.answer)
    if (!fieldId || answer === null) continue
    updates.push({ fieldId, answer })
  }
  return updates
}

export async function completePipelineChat(params: {
  tool: string
  context: string
  messages: ChatMessage[]
  allowFieldUpdates?: boolean
  onDelta?: (delta: string) => void
}): Promise<PipelineChatResponse> {
  const deployment = readDeploymentOrEmpty()
  const normalizedMessages = params.messages
    .map((message) => ({
      role: message.role,
      content: normalizeText(message.text),
    }))
    .filter((message) => Boolean(message.content))

  if (!deployment) {
    return createPipelineChatResponse({
      tool: params.tool,
      answer: "Chatmodel is niet geconfigureerd. Probeer het later opnieuw.",
      fieldUpdates: [],
    })
  }

  const prompt = [
    "U bent de Coachscribe assistent voor re-integratiecoaches.",
    "Gebruik alleen de context hieronder.",
    "Schrijf in natuurlijk, professioneel Nederlands in volledige zinnen.",
    "Houd de toon formeel maar menselijk en cliëntgericht; vermijd afstandelijke standaardzinnen als directere formulering mogelijk is.",
    params.allowFieldUpdates
      ? 'Als de gebruiker vraagt om een rapportveld te herschrijven, geef updates terug. Output JSON: {"answer":"string","updates":[{"fieldId":"string","answer":"string|object"}]}. Geef alleen updates als ze geldig en toepasbaar zijn. Als je niets valide kunt aanpassen, geef updates: [] en zeg expliciet dat er niets is gewijzigd.'
      : "Geef alleen platte tekst als antwoord. Geef geen JSON, labels of metadata.",
    "Bij tekstvelden: geef direct de uiteindelijke veldinhoud, zonder de vraagtitel te herhalen en zonder inleidingen zoals '... is als volgt:'.",
    "Zeg alleen dat iets is gewijzigd als er daadwerkelijk updates worden teruggegeven.",
    "Gebruik nooit letterlijke placeholderwaarden zoals 'string' of 'antwoord' als inhoud.",
    "",
    "Context:",
    params.context,
  ].join("\n")

  const raw = params.onDelta
    ? await streamAzureOpenAiChat({
        deployment,
        temperature: 0.2,
        messages: [
          { role: "system", content: prompt },
          ...normalizedMessages,
        ],
        onDelta: params.onDelta,
      })
    : await completeAzureOpenAiChat({
        deployment,
        temperature: 0.2,
        messages: [
          { role: "system", content: prompt },
          ...normalizedMessages,
        ],
      })

  const parsed = safeJsonParse(raw)
  const answer = resolveAnswerText({ raw, parsedAnswer: parsed?.answer })
  const updates = params.allowFieldUpdates && Array.isArray(parsed?.updates) ? readFieldUpdates(parsed.updates) : []
  const fallbackAnswer = params.allowFieldUpdates
    ? updates.length > 0
      ? "De gevraagde veldwijzigingen zijn doorgevoerd."
      : "Er zijn geen geldige veldwijzigingen doorgevoerd."
    : "Waarmee kan ik u helpen?"

  return createPipelineChatResponse({
    tool: params.tool,
    answer: answer || fallbackAnswer,
    fieldUpdates: updates,
  })
}
