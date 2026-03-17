import { env } from "../env"

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

// Intent: normalizeText
function normalizeText(value: string) {
  return String(value || "").trim()
}

// Intent: normalizeEndpoint
function normalizeEndpoint(value: string) {
  return String(value || "").trim().replace(/\/+$/, "")
}

function logAzureOpenAiDebug(label: string, payload: unknown): void {
  try {
    const serialized = JSON.stringify(payload)
    console.log(`[ai:${label}] ${serialized}`)
  } catch {
    // Never let diagnostics break production flow.
  }
}

// Intent: completeAzureOpenAiChat
export async function completeAzureOpenAiChat(params: {
  deployment: string
  messages: ChatMessage[]
  temperature?: number
  debugLogLabel?: string
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
  const requestBody = {
    messages: params.messages,
    ...(typeof params.temperature === "number" ? { temperature: params.temperature } : {}),
  }

  if (params.debugLogLabel) {
    logAzureOpenAiDebug(`${params.debugLogLabel}:request`, {
      url,
      deployment,
      body: requestBody,
    })
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify(requestBody),
  })

  const textBody = await response.text().catch(() => "")
  if (params.debugLogLabel) {
    logAzureOpenAiDebug(`${params.debugLogLabel}:response`, {
      status: response.status,
      ok: response.ok,
      body: textBody,
    })
  }
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

// Intent: streamAzureOpenAiChat
export async function streamAzureOpenAiChat(params: {
  deployment: string
  messages: ChatMessage[]
  temperature?: number
  debugLogLabel?: string
  onDelta?: (delta: string) => void
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
  const requestBody = {
    messages: params.messages,
    stream: true,
    ...(typeof params.temperature === "number" ? { temperature: params.temperature } : {}),
  }

  if (params.debugLogLabel) {
    logAzureOpenAiDebug(`${params.debugLogLabel}:stream:request`, {
      url,
      deployment,
      body: requestBody,
    })
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const textBody = await response.text().catch(() => "")
    if (params.debugLogLabel) {
      logAzureOpenAiDebug(`${params.debugLogLabel}:stream:error`, {
        status: response.status,
        body: textBody,
      })
    }
    throw new Error(`Azure OpenAI chat stream failed: ${textBody || response.statusText || "Unknown error"}`)
  }

  if (!response.body) {
    throw new Error("No chat stream returned")
  }

  const decoder = new TextDecoder()
  const reader = response.body.getReader()
  let pending = ""
  let fullText = ""

  const processLine = (rawLine: string) => {
    const line = String(rawLine || "").trim()
    if (!line || !line.startsWith("data:")) return
    const payload = line.slice(5).trim()
    if (!payload || payload === "[DONE]") return
    let parsed: any = null
    try {
      parsed = JSON.parse(payload)
    } catch {
      return
    }
    const delta = typeof parsed?.choices?.[0]?.delta?.content === "string" ? parsed.choices[0].delta.content : ""
    if (!delta) return
    fullText += delta
    params.onDelta?.(delta)
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    let newlineIndex = pending.indexOf("\n")
    while (newlineIndex !== -1) {
      const line = pending.slice(0, newlineIndex)
      pending = pending.slice(newlineIndex + 1)
      processLine(line)
      newlineIndex = pending.indexOf("\n")
    }
  }

  pending += decoder.decode()
  if (pending.length > 0) {
    for (const line of pending.split(/\r?\n/)) {
      processLine(line)
    }
  }

  const text = normalizeText(fullText)
  if (!text) {
    throw new Error("No chat response returned")
  }
  return text
}
