import { env } from "../env"
import { completeMistralChat, type ChatMessage } from "../ai/mistralChat"

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

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
  const totalCharacters = out.reduce((sum, m) => sum + m.content.length, 0)
  if (totalCharacters > 80_000) {
    throw new Error("Messages are too long")
  }
  return out
}

export async function completeChatWithMistral(params: { messages: any; temperature?: unknown }): Promise<string> {
  const messages = safeMessages(params.messages)
  const temperatureRaw = typeof params.temperature === "number" ? params.temperature : Number(params.temperature)
  const temperature = Number.isFinite(temperatureRaw) ? Math.max(0, Math.min(1, temperatureRaw)) : 0.2

  return await completeMistralChat({
    apiKey: env.mistralApiKey,
    model: env.mistralChatModel,
    messages,
    temperature,
  })
}

