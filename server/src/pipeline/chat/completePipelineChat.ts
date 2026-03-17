import { completeAzureOpenAiChat, streamAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { env } from "../../env"
import { createPipelineChatResponse, type PipelineChatFieldUpdate, type PipelineChatResponse } from "./chatContract"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

function readDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiReportDeployment || env.azureOpenAiChatDeployment || env.azureOpenAiSummaryDeployment)
}

function safeJsonParse(value: string): { answer?: unknown; updates?: unknown[] } | null {
  const stripped = stripJsonCodeFences(String(value || ""))
  if (!stripped) return null
  try {
    return JSON.parse(stripped) as { answer?: unknown; updates?: unknown[] }
  } catch {
    return null
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

function readFieldUpdates(value: unknown[]): PipelineChatFieldUpdate[] {
  const updates: PipelineChatFieldUpdate[] = []
  for (const raw of value) {
    const fieldId = normalizeText((raw as { fieldId?: unknown })?.fieldId)
    const answer = normalizeText((raw as { answer?: unknown })?.answer)
    if (!fieldId || !answer) continue
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
    params.allowFieldUpdates
      ? 'Als de gebruiker vraagt om een rapportveld te herschrijven, geef updates terug. Output JSON: {"answer":"string","updates":[{"fieldId":"string","answer":"string"}]}.'
      : "Geef alleen platte tekst als antwoord. Geef geen JSON, labels of metadata.",
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

  return createPipelineChatResponse({
    tool: params.tool,
    answer: answer || "Waarmee kan ik u helpen?",
    fieldUpdates: updates,
  })
}
