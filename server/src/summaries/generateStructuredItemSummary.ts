import { completeAzureOpenAiChat } from "../ai/azureOpenAi"
import { normalizeText } from "../ai/shared/normalize"
import { stripJsonCodeFences } from "../ai/shared/textSanitization"
import { env } from "../env"
import { generateSummary } from "./generateSummary"

function extractFirstJsonObject(value: string): string | null {
  const text = String(value || "")
  const startIndex = text.indexOf("{")
  if (startIndex < 0) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === "\\") {
      escaped = true
      continue
    }
    if (char === "\"") {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === "{") depth += 1
    if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return text.slice(startIndex, index + 1).trim()
      }
    }
  }
  return null
}

function normalizeStructuredSummaryFromResponse(value: unknown, keys: string[]): Record<string, string> {
  const payload = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  return Object.fromEntries(keys.map((key) => [key, normalizeText(payload[key]) || ""]))
}

function readStructuredSummaryFromRaw(raw: string, keys: string[]): Record<string, string> | null {
  const stripped = stripJsonCodeFences(String(raw || ""))
  const jsonCandidate = extractFirstJsonObject(stripped) ?? extractFirstJsonObject(raw)
  if (!jsonCandidate) return null
  try {
    const parsed = JSON.parse(jsonCandidate)
    return normalizeStructuredSummaryFromResponse(parsed, keys)
  } catch {
    return null
  }
}

function buildEmptyStructuredSummary(keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, ""]))
}

export async function generateStructuredItemSummary(params: {
  transcript: string
  keys: string[]
  includeDebug?: boolean
  debugContext?: {
    sourceSessionId?: string
    sourceInputType?: string
  }
}): Promise<Record<string, string>> {
  const { keys } = params
  if (keys.length === 0) return {}

  const deployment = normalizeText(env.azureOpenAiSummaryDeployment || env.azureOpenAiChatDeployment)
  const summary = await generateSummary({
    transcript: params.transcript,
    includeDebug: params.includeDebug,
    debugContext: params.debugContext,
  })

  if (!deployment) {
    const result = buildEmptyStructuredSummary(keys)
    if (keys[0]) result[keys[0]] = summary
    return result
  }

  const keyList = keys.map((key) => `- ${key}`).join("\n")
  const exampleJson = JSON.stringify(Object.fromEntries(keys.map((key) => [key, ""])))
  const prompt = [
    "Zet onderstaande Nederlandse sessiesamenvatting om naar een JSON-object met exact deze keys:",
    keyList,
    "",
    "Regels:",
    "- Gebruik alleen feiten uit de aangeleverde samenvatting.",
    "- Schrijf per veld 1 volledige, natuurlijke zin wanneer er informatie beschikbaar is.",
    "- Formuleer concreet en professioneel met duidelijke werkwoorden.",
    "- Bundel overlappende informatie tot 1 kernzin per veld.",
    "- Houd de stijl neutraal, compact en natuurlijk.",
    "- Als informatie ontbreekt: gebruik een lege string.",
    `- Antwoord alleen met geldige JSON, bijvoorbeeld ${exampleJson}.`,
    "",
    "Samenvatting:",
    summary,
  ].join("\n")

  const raw = await completeAzureOpenAiChat({
    deployment,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "Geef alleen geldige JSON terug zonder markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  return readStructuredSummaryFromRaw(raw, keys) ?? buildEmptyStructuredSummary(keys)
}
