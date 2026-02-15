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

// Intent: completeChatWithAzureOpenAi
export async function completeChatWithAzureOpenAi(params: { messages: any; temperature?: unknown }): Promise<string> {
  const deployment = String(env.azureOpenAiChatDeployment || "").trim()
  if (!deployment) {
    throw new Error("Azure OpenAI chat deployment is not configured")
  }

  const messages = safeMessages(params.messages)
  const temperatureRaw = typeof params.temperature === "number" ? params.temperature : Number(params.temperature)
  const temperature = Number.isFinite(temperatureRaw) ? Math.max(0, Math.min(1, temperatureRaw)) : 0.2

  const text = await completeAzureOpenAiChat({
    deployment,
    messages,
    temperature,
  })

  if (!text) {
    throw new Error("No chat response returned")
  }
  return text
}
