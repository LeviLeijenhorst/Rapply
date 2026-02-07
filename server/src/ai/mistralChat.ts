export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function pickContent(json: any): string {
  const content = json?.choices?.[0]?.message?.content
  if (typeof content === "string") {
    return normalizeText(content)
  }
  if (Array.isArray(content)) {
    const combined = content
      .map((part) => normalizeText(part?.text))
      .filter(Boolean)
      .join("\n")
    return normalizeText(combined)
  }
  return ""
}

export async function completeMistralChat(params: {
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature: number
}): Promise<string> {
  const apiKey = normalizeText(params.apiKey)
  if (!apiKey) {
    throw new Error("Mistral API key is not configured")
  }

  const model = normalizeText(params.model)
  if (!model) {
    throw new Error("Mistral chat model is not configured")
  }

  const temperature = Number.isFinite(params.temperature) ? Math.max(0, Math.min(1, params.temperature)) : 0.2

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature,
    }),
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Mistral chat failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const text = pickContent(json)
  if (!text) {
    throw new Error("No chat response returned")
  }
  return text
}

