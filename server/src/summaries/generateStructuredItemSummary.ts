import { completeAzureOpenAiChat } from "../ai/azureOpenAi"
import { normalizeText } from "../ai/shared/normalize"
import { stripJsonCodeFences } from "../ai/shared/textSanitization"
import { env } from "../env"
import type { Session } from "../types/Session"
import { generateSummary } from "./generateSummary"

type StructuredItemSummary = Session["summaryStructured"]

function normalizeStructuredSummaryCandidate(value: unknown): StructuredItemSummary {
  const payload = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const read = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = normalizeText(payload[key])
      if (candidate) return candidate
    }
    return ""
  }
  return {
    doelstelling: read("doelstelling", "kernpunten"),
    belastbaarheid: read("belastbaarheid", "situatie"),
    belemmeringen: read("belemmeringen", "aandachtspunten"),
    voortgang: read("voortgang", "afspraken"),
    arbeidsmarktorientatie: read("arbeidsmarktorientatie", "arbeidsorientatie", "vervolg"),
  }
}

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

function readStructuredSummaryFromRaw(raw: string): StructuredItemSummary | null {
  const stripped = stripJsonCodeFences(String(raw || ""))
  const jsonCandidate = extractFirstJsonObject(stripped) ?? extractFirstJsonObject(raw)
  if (!jsonCandidate) return null
  try {
    const parsed = JSON.parse(jsonCandidate)
    return normalizeStructuredSummaryCandidate(parsed)
  } catch {
    return null
  }
}

function normalizeHeading(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function buildFallbackSummaryFromMarkdown(markdown: string): StructuredItemSummary {
  const summary = {
    doelstelling: "",
    belastbaarheid: "",
    belemmeringen: "",
    voortgang: "",
    arbeidsmarktorientatie: "",
  }
  const sections = String(markdown || "")
    .split(/^###\s+/m)
    .map((part) => part.trim())
    .filter(Boolean)
  for (const section of sections) {
    const firstLineBreakIndex = section.indexOf("\n")
    const title = firstLineBreakIndex >= 0 ? section.slice(0, firstLineBreakIndex).trim() : section.trim()
    const content = firstLineBreakIndex >= 0 ? section.slice(firstLineBreakIndex + 1).trim() : ""
    if (!content) continue
    const normalizedTitle = normalizeHeading(title)
    if (normalizedTitle === "doelstelling" || normalizedTitle === "kernpunten" || normalizedTitle === "samenvatting") {
      summary.doelstelling = content
      continue
    }
    if (normalizedTitle === "belastbaarheid" || normalizedTitle === "situatie") {
      summary.belastbaarheid = content
      continue
    }
    if (normalizedTitle === "belemmeringen" || normalizedTitle === "aandachtspunten") {
      summary.belemmeringen = content
      continue
    }
    if (normalizedTitle === "voortgang" || normalizedTitle === "afspraken") {
      summary.voortgang = content
      continue
    }
    if (normalizedTitle === "arbeidsmarktorientatie" || normalizedTitle === "arbeidsorientatie" || normalizedTitle === "vervolg") {
      summary.arbeidsmarktorientatie = content
    }
  }
  if (!summary.doelstelling) {
    summary.doelstelling = normalizeText(markdown)
  }
  return summary
}

export async function generateStructuredItemSummary(params: {
  transcript: string
  includeDebug?: boolean
  debugContext?: {
    sourceSessionId?: string
    sourceInputType?: string
  }
}): Promise<StructuredItemSummary> {
  const deployment = normalizeText(env.azureOpenAiSummaryDeployment || env.azureOpenAiChatDeployment)
  const markdownSummary = await generateSummary({
    transcript: params.transcript,
    includeDebug: params.includeDebug,
    debugContext: params.debugContext,
  })

  if (!deployment) {
    return buildFallbackSummaryFromMarkdown(markdownSummary)
  }

  const prompt = [
    "Zet onderstaande Nederlandse sessiesamenvatting om naar een JSON-object met exact deze keys:",
    "- doelstelling",
    "- belastbaarheid",
    "- belemmeringen",
    "- voortgang",
    "- arbeidsmarktorientatie",
    "",
    "Regels:",
    "- Gebruik alleen feiten uit de aangeleverde samenvatting.",
    "- Schrijf per veld 1 volledige, natuurlijke zin wanneer er informatie beschikbaar is.",
    "- Formuleer concreet en professioneel met duidelijke werkwoorden.",
    "- Bundel overlappende informatie tot 1 kernzin per veld.",
    "- Houd de stijl neutraal, compact en natuurlijk.",
    "- Als informatie ontbreekt: gebruik een lege string.",
    '- Antwoord alleen met geldige JSON, bijvoorbeeld {"doelstelling":"","belastbaarheid":"","belemmeringen":"","voortgang":"","arbeidsmarktorientatie":""}.',
    "",
    "Samenvatting:",
    markdownSummary,
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

  return readStructuredSummaryFromRaw(raw) ?? buildFallbackSummaryFromMarkdown(markdownSummary)
}
