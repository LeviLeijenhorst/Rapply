import { env } from "../env"

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function normalizeText(value: string) {
  return String(value || "").trim()
}

function normalizeEndpoint(value: string) {
  return String(value || "").trim().replace(/\/+$/, "")
}

export async function completeAzureOpenAiChat(params: {
  deployment: string
  messages: ChatMessage[]
  temperature: number
}): Promise<string> {
  const endpoint = normalizeEndpoint(env.azureOpenAiEndpoint)
  if (!endpoint) {
    throw new Error("Azure OpenAI endpoint is not configured")
  }
  const key = normalizeText(env.azureOpenAiKey)
  if (!key) {
    throw new Error("Azure OpenAI key is not configured")
  }
  const version = normalizeText(env.azureOpenAiVersion)
  if (!version) {
    throw new Error("Azure OpenAI version is not configured")
  }
  const deployment = normalizeText(params.deployment)
  if (!deployment) {
    throw new Error("Azure OpenAI deployment is not configured")
  }
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${version}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      messages: params.messages,
      temperature: params.temperature,
    }),
  })

  const textBody = await response.text().catch(() => "")
  if (!response.ok) {
    throw new Error(`Azure OpenAI chat failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  const json: any = textBody ? JSON.parse(textBody) : null
  const content = json?.choices?.[0]?.message?.content
  const text = normalizeText(typeof content === "string" ? content : "")
  if (!text) {
    throw new Error("No chat response returned")
  }
  return text
}
