import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { env } from "../../env"
import type { JsonValue, StructuredReportField } from "../../types/Report"
import { appendFieldVersion } from "./structuredReportTools"

function readDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiReportDeployment || env.azureOpenAiChatDeployment || env.azureOpenAiSummaryDeployment)
}

function safeJsonAnswer(value: string): JsonValue {
  const stripped = stripJsonCodeFences(String(value || ""))
  if (!stripped) return ""
  try {
    const parsed = JSON.parse(stripped) as { answer?: unknown }
    return (parsed.answer ?? "") as JsonValue
  } catch {
    return ""
  }
}

export async function regenerateReportField(params: {
  field: StructuredReportField
  userPrompt?: string | null
}): Promise<StructuredReportField> {
  const deployment = readDeploymentOrEmpty()
  const factualBasis = normalizeText(params.field.factualBasis)
  const userPrompt = normalizeText(params.userPrompt)

  if (!factualBasis) {
    return appendFieldVersion({
      field: params.field,
      source: "ai_regeneration",
      answer: "",
      factualBasis: "",
      reasoning: "Geen direct bewijs beschikbaar; antwoord blijft leeg.",
      confidence: 0,
      prompt: userPrompt || null,
    })
  }

  if (!deployment) {
    return appendFieldVersion({
      field: params.field,
      source: "ai_regeneration",
      answer: factualBasis.replace(/^- /g, ""),
      factualBasis,
      reasoning: "Fallback zonder modeldeployment.",
      confidence: params.field.confidence ?? 0.5,
      prompt: userPrompt || null,
    })
  }

  const prompt = [
    "Herschrijf precies een UWV-rapportantwoord op basis van factualBasis.",
    "Gebruik alleen factualBasis, voeg niets nieuws toe.",
    userPrompt ? `Herschrijfrichting: ${userPrompt}` : "",
    "",
    `fieldId: ${params.field.fieldId}`,
    `label: ${params.field.label}`,
    `factualBasis: ${factualBasis}`,
    "",
    'Antwoord alleen als JSON: {"answer":"string"}',
  ]
    .filter(Boolean)
    .join("\n")

  const raw = await completeAzureOpenAiChat({
    deployment,
    temperature: 0.2,
    messages: [
      { role: "system", content: "Geef alleen geldige JSON terug." },
      { role: "user", content: prompt },
    ],
  })
  const answer = safeJsonAnswer(raw) || factualBasis.replace(/^- /g, "")

  return appendFieldVersion({
    field: params.field,
    source: "ai_regeneration",
    answer,
    factualBasis,
    reasoning: "Regeneratie met bestaande factual basis.",
    confidence: params.field.confidence ?? 0.55,
    prompt: userPrompt || null,
  })
}
