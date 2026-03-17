import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { env } from "../../env"
import type { Client } from "../../types/Client"
import type { OrganizationSettings } from "../../types/OrganizationSettings"
import type { JsonValue, StructuredReport, StructuredReportField } from "../../types/Report"
import type { Trajectory } from "../../types/Trajectory"
import type { UserSettings } from "../../types/UserSettings"
import type { UwvTemplate } from "../templates/uwvTemplates"
import { listAiTemplateFields } from "../templates/uwvTemplates"
import { buildReportTextFromStructured, createStructuredField, createStructuredReport } from "./structuredReportTools"

type EvidenceByFieldId = Map<string, string[]>

export type PromptSourceType =
  | "Transcriptie van een gesprek"
  | "Transcriptie van een gespreksverslag"
  | "Geschreven gespreksverslag"
  | "Notitie"

export type PromptSource = {
  sourceId: string
  dateUnixMs: number
  sourceType: PromptSourceType
  sourceTitle: string
  text: string
  labels: string[]
}

type SingleStepField = {
  fieldId: string
  factualBasis: string
  answer: JsonValue
}

function logReportPrompt(label: string, prompt: string): void {
  try {
    console.log(`[ai:${label}:prompt]\n${prompt}`)
  } catch {
    // Ignore diagnostics failures.
  }
}

function formatDateKey(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "Onbekende datum"
  return new Date(value).toISOString().slice(0, 10)
}

function readDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiReportDeployment || env.azureOpenAiChatDeployment || env.azureOpenAiSummaryDeployment)
}

function valueToComparable(value: JsonValue): string {
  if (value === null || typeof value === "undefined") return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

function matchesExpectedSkipValue(answer: JsonValue, expected: JsonValue): boolean {
  if (typeof answer !== "object" || answer === null || Array.isArray(answer)) {
    return valueToComparable(answer) === valueToComparable(expected)
  }
  for (const value of Object.values(answer)) {
    if (valueToComparable(value as JsonValue) === valueToComparable(expected)) return true
  }
  return false
}

function buildSystemPrompt(template: UwvTemplate): string {
  return [
    'OUTPUTFORMAT (verplicht, exact): {"fields":[{"fieldId":"string","factualBasis":"string","answer":"string|object"}]}',
    "",
    "Context:",
    "Je genereert antwoorden voor UWV-rapportvelden binnen re-flow, een softwareproduct voor re-integratiecoaches.",
    "Je krijgt precies één actief template.",
    "Per vraag krijg je: fieldId, vraag, antwoordType, instructie, eventueel opties, eventueel answerFormat, voorbeeldAntwoord en skipLogica.",
    "Geselecteerde transcripties en transcripties van gespreksverslagen worden als snippets aangeleverd.",
    "Geselecteerde geschreven gespreksverslagen en notities worden als volledige tekst aangeleverd.",
    "Gebruik alleen informatie uit de aangeleverde broninformatie.",
    "factualBasis moet feitelijk en herleidbaar zijn, bedoeld voor latere hergeneratie als de gebruiker niet tevreden is met het antwoord.",
    "Volg de meegegeven skipLogica expliciet.",
    "Geef alleen velden terug waarvoor je een bruikbaar antwoord kunt opstellen.",
    "",
    "Regels:",
    "- Geen feiten verzinnen.",
    "- Als answerType 'multiple_choice' of 'structured' is, moet answer exact het opgegeven objectformat volgen.",
    "- Als informatie onvoldoende is: veld niet teruggeven.",
    "- Geef uitsluitend geldige JSON terug zonder markdown.",
    "",
    `Actief template: ${template.name} (${template.id})`,
  ].join("\n")
}

function buildFieldPromptBlock(template: UwvTemplate): string {
  return listAiTemplateFields(template)
    .map((field) => {
      const config = field.aiConfig
      if (!config) return ""
      const optionsLines = (config.opties || []).map((option) => `  - ${option.value} = ${option.label}`)
      const skipLines = (config.skipLogica || []).flatMap((rule) => {
        const matchValue = typeof rule.when.equals === "object" ? JSON.stringify(rule.when.equals) : String(rule.when.equals)
        return [`  - als ${rule.when.fieldId} gelijk is aan ${matchValue}, sla over: ${rule.skipFieldIds.join(", ")}`]
      })
      return [
        `fieldId: ${field.fieldId}`,
        `vraag: ${config.vraag}`,
        `antwoordType: ${config.antwoordType}`,
        `instructie: ${config.instructie}`,
        ...(optionsLines.length > 0 ? ["opties:", ...optionsLines] : []),
        ...(config.answerFormat ? [`answerFormat: ${config.answerFormat}`] : []),
        `voorbeeldAntwoord: ${config.voorbeeldAntwoord}`,
        ...(skipLines.length > 0 ? ["skipLogica:", ...skipLines] : []),
      ].join("\n")
    })
    .filter(Boolean)
    .join("\n\n")
}

function normalizeLabelList(labels: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []
  for (const label of labels) {
    const normalized = normalizeText(label)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    output.push(normalized)
  }
  return output
}

function buildChronologicalSources(promptSources: PromptSource[]): string {
  if (promptSources.length === 0) return "- Geen geselecteerde broninformatie."

  const grouped = new Map<string, PromptSource[]>()
  const order: string[] = []
  for (const source of [...promptSources].sort((a, b) => a.dateUnixMs - b.dateUnixMs)) {
    const key = normalizeText(source.sourceId) || `${source.sourceTitle}-${source.dateUnixMs}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
      order.push(key)
    }
    grouped.get(key)?.push(source)
  }

  return order
    .map((key) => {
      const items = grouped.get(key) || []
      const first = items[0]
      const lines: string[] = [
        formatDateKey(first.dateUnixMs),
        `Bron: ${normalizeText(first.sourceTitle) || "Onbekende bron"}`,
        `Type: ${first.sourceType}`,
      ]
      for (const item of items) {
        const labels = normalizeLabelList(item.labels)
        lines.push(`- ${normalizeText(item.text)}${labels.length > 0 ? ` [labels: ${labels.join(", ")}]` : ""}`)
      }
      return lines.join("\n")
    })
    .join("\n\n")
}

function buildUserPrompt(params: { template: UwvTemplate; promptSources: PromptSource[] }): string {
  return [
    `Template: ${params.template.name}`,
    "",
    "Vragen van het actieve template:",
    buildFieldPromptBlock(params.template),
    "",
    "Chronologische broninformatie:",
    buildChronologicalSources(params.promptSources),
    "",
    "Genereer output in het afgesproken JSON-format.",
  ].join("\n")
}

export function createTemplateFieldIdResolver(template: UwvTemplate): (rawFieldId: unknown) => string {
  const strictMap = new Map<string, string>()
  const looseMap = new Map<string, string>()

  const addKey = (key: string, fieldId: string) => {
    const normalized = normalizeText(key).toLowerCase()
    if (!normalized) return
    if (!strictMap.has(normalized)) strictMap.set(normalized, fieldId)
    const loose = normalized.replace(/[^a-z0-9]/g, "")
    if (!looseMap.has(loose)) looseMap.set(loose, fieldId)
  }

  for (const field of template.fields) {
    addKey(field.fieldId, field.fieldId)
    addKey(field.exportNumberKey, field.fieldId)
  }

  return (rawFieldId: unknown): string => {
    const raw = normalizeText(rawFieldId).toLowerCase()
    if (!raw) return ""
    const candidates = new Set<string>()
    candidates.add(raw)
    candidates.add(raw.replace(/^fieldid\s*[:=]\s*/i, ""))
    const fieldIdMatch = raw.match(/[a-z]{2}_[a-z0-9_]+/i)
    if (fieldIdMatch?.[0]) candidates.add(fieldIdMatch[0])
    const exportNumberMatch = raw.match(/\b\d{1,2}[._]\d{1,2}\b/)
    if (exportNumberMatch?.[0]) candidates.add(exportNumberMatch[0].replace("_", "."))

    for (const candidate of candidates) {
      const strict = strictMap.get(candidate)
      if (strict) return strict
      const loose = looseMap.get(candidate.replace(/[^a-z0-9]/g, ""))
      if (loose) return loose
    }
    return ""
  }
}

function safeJsonParse<T>(value: string): T | null {
  const stripped = stripJsonCodeFences(String(value || ""))
  if (!stripped) return null
  try {
    return JSON.parse(stripped) as T
  } catch {
    return null
  }
}

function parseModelFields(params: { template: UwvTemplate; raw: string }): SingleStepField[] {
  const resolveFieldId = createTemplateFieldIdResolver(params.template)
  const parsed = safeJsonParse<{ fields?: Array<Record<string, unknown>> }>(params.raw)
  const fields = Array.isArray(parsed?.fields) ? parsed.fields : []
  const output: SingleStepField[] = []
  for (const item of fields) {
    const fieldId = resolveFieldId(item.fieldId)
    if (!fieldId) continue
    const factualBasis = normalizeText(item.factualBasis)
    if (!factualBasis) continue
    if (!("answer" in item)) continue
    output.push({
      fieldId,
      factualBasis,
      answer: (item as any).answer as JsonValue,
    })
  }
  return output
}

function readProgrammaticValue(params: {
  field: { fieldId: string; label: string }
  client: Client | null
  trajectory: Trajectory | null
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
}): string {
  const label = params.field.label.toLowerCase()
  if (label.includes("naam client") || label.includes("naam cliënt")) return normalizeText(params.client?.name)
  if (label.includes("voorletters en achternaam")) return normalizeText(params.client?.name)
  if (label === "bsn" || label.includes("burgerservicenummer")) {
    const match = String(params.client?.clientDetails || "").match(/\b\d{8,9}\b/)
    return normalizeText(match?.[0] ?? "")
  }
  if (label.includes("ordernummer")) return normalizeText(params.trajectory?.orderNumber)
  if (label.includes("uwv")) return normalizeText(params.trajectory?.uwvContactName)
  if (label.includes("naam organisatie")) return normalizeText(params.organizationSettings.practiceName)
  if (label.includes("bezoekadres")) return normalizeText(params.organizationSettings.visitAddress)
  if (label.includes("postadres")) return normalizeText(params.organizationSettings.postalAddress)
  if (label.includes("postcode en plaats")) return normalizeText(params.organizationSettings.postalCodeCity)
  if (label.includes("naam contactpersoon")) return normalizeText(params.userSettings.contactName)
  if (label.includes("functie contactpersoon")) return normalizeText(params.userSettings.contactRole)
  if (label.includes("e-mail")) return normalizeText(params.userSettings.contactEmail)
  if (label.includes("telefoon")) return normalizeText(params.userSettings.contactPhone)
  return ""
}

function applySkipRules(template: UwvTemplate, aiOutputByFieldId: Map<string, SingleStepField>): Set<string> {
  const hidden = new Set<string>()
  for (const field of listAiTemplateFields(template)) {
    const rules = field.aiConfig?.skipLogica || []
    for (const rule of rules) {
      const source = aiOutputByFieldId.get(rule.when.fieldId)
      if (!source) continue
      if (!matchesExpectedSkipValue(source.answer, rule.when.equals)) continue
      for (const skipFieldId of rule.skipFieldIds) hidden.add(skipFieldId)
    }
  }
  return hidden
}

export async function generateStructuredReport(params: {
  template: UwvTemplate
  client: Client | null
  trajectory: Trajectory | null
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
  evidenceByFieldId: EvidenceByFieldId
  promptSources?: PromptSource[]
}): Promise<{ structuredReport: StructuredReport; reportText: string }> {
  const now = Date.now()
  const deployment = readDeploymentOrEmpty()
  const aiFields = listAiTemplateFields(params.template)
  void params.evidenceByFieldId
  let aiOutputByFieldId = new Map<string, SingleStepField>()

  if (deployment) {
    const systemPrompt = buildSystemPrompt(params.template)
    const userPrompt = buildUserPrompt({
      template: params.template,
      promptSources: params.promptSources ?? [],
    })
    logReportPrompt("report-generation:single-step:system", systemPrompt)
    logReportPrompt("report-generation:single-step:user", userPrompt)

    const raw = await completeAzureOpenAiChat({
      deployment,
      temperature: 0.2,
      debugLogLabel: "report-generation:single-step",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    })
    aiOutputByFieldId = new Map(parseModelFields({ template: params.template, raw }).map((field) => [field.fieldId, field]))
  }

  const hiddenFields = applySkipRules(params.template, aiOutputByFieldId)
  const structuredFields: Record<string, StructuredReportField> = {}

  for (const field of params.template.fields) {
    if (field.fieldType === "programmatic") {
      const answer = readProgrammaticValue({
        field,
        client: params.client,
        trajectory: params.trajectory,
        organizationSettings: params.organizationSettings,
        userSettings: params.userSettings,
      })
      structuredFields[field.fieldId] = createStructuredField({
        field,
        answer,
        factualBasis: "Automatisch ingevuld vanuit opgeslagen Coachscribe-gegevens.",
        reasoning: "Programmatic veld uit app-data.",
        confidence: 1,
        source: "ai_generation",
        prompt: null,
        createdAtUnixMs: now,
      })
      continue
    }

    if (field.fieldType === "manual") {
      structuredFields[field.fieldId] = createStructuredField({
        field,
        answer: "",
        factualBasis: "",
        reasoning: "Handmatig veld.",
        confidence: null,
        source: "manual_edit",
        prompt: null,
        createdAtUnixMs: now,
      })
      continue
    }

    const aiField = aiOutputByFieldId.get(field.fieldId)
    const shouldSkip = hiddenFields.has(field.fieldId)
    structuredFields[field.fieldId] = createStructuredField({
      field,
      answer: shouldSkip || !aiField ? "" : aiField.answer,
      factualBasis: shouldSkip || !aiField ? "" : aiField.factualBasis,
      reasoning: shouldSkip ? "Overgeslagen op basis van skiplogica." : aiField ? "Antwoord gebaseerd op aangeleverde broninformatie." : "",
      confidence: aiField ? 1 : 0,
      source: "ai_generation",
      prompt: null,
      createdAtUnixMs: now,
    })
  }

  for (const field of aiFields) {
    if (structuredFields[field.fieldId]) continue
    structuredFields[field.fieldId] = createStructuredField({
      field,
      answer: "",
      factualBasis: "",
      reasoning: "",
      confidence: null,
      source: "ai_generation",
      prompt: null,
      createdAtUnixMs: now,
    })
  }

  const structuredReport = createStructuredReport({
    template: params.template,
    fields: structuredFields,
    createdAtUnixMs: now,
  })
  const reportText = buildReportTextFromStructured(params.template, structuredReport.fields)
  return { structuredReport, reportText }
}
