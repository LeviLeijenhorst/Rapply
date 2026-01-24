import { env } from "../env"

type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function normalizeText(value: string) {
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
  const totalChars = out.reduce((sum, m) => sum + m.content.length, 0)
  if (totalChars > 80_000) {
    throw new Error("Messages are too long")
  }
  return out
}

export async function completeChatWithMistral(params: { messages: any; temperature?: unknown }): Promise<string> {
  const apiKey = String(env.mistralApiKey || "").trim()
  if (!apiKey) {
    throw new Error("Mistral API key is not configured")
  }
  const model = String(env.mistralChatModel || "").trim()
  if (!model) {
    throw new Error("Mistral chat model is not configured")
  }

  const messages = safeMessages(params.messages)
  const temperatureRaw = typeof params.temperature === "number" ? params.temperature : Number(params.temperature)
  const temperature = Number.isFinite(temperatureRaw) ? Math.max(0, Math.min(1, temperatureRaw)) : 0.2

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
    }),
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Mistral chat failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const content = json?.choices?.[0]?.message?.content
  const text = normalizeText(typeof content === "string" ? content : "")
  if (!text) {
    throw new Error("No chat response returned")
  }
  return text
}

