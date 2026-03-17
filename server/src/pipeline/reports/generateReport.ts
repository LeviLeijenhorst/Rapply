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

export function buildSystemPrompt(template: UwvTemplate): string {
  return [
    'OUTPUTFORMAT (verplicht, exact): {"fields":[{"fieldId":"string","factualBasis":"string","answer":"string|object"}]}',
    "",
    "Context:",
    "Je genereert antwoorden voor UWV-rapportvelden binnen re-flow, een softwareproduct voor re-integratiecoaches.",
    "De output wordt gebruikt als concepttekst voor professionele rapportages richting UWV.",
    "",
    "Je krijgt precies \u00e9\u00e9n actief template.",
    "Per vraag krijg je:",
    "- fieldId",
    "- vraag",
    "- antwoordType",
    "- instructie",
    "- miniPrompt",
    "- eventueel opties",
    "- eventueel answerFormat",
    "- voorbeeldAntwoord",
    "- eventueel skipLogica",
    "",
    "Je ontvangt informatie uit transcripties, gespreksverslagen en notities.",
    "Alleen de informatie die voor deze rapportage is geselecteerd, is beschikbaar in de prompt.",
    "",
    "Doel:",
    "Schrijf per veld een professionele, concrete en goed onderbouwde conceptinvulling in nette UWV-stijl.",
    "De antwoorden moeten direct bruikbaar zijn in een echte rapportage.",
    "Schrijf natuurlijk en professioneel, zonder te verwijzen naar interne of technische termen zoals \u201cbroninformatie\u201d, \u201cinput\u201d, \u201csnippet\u201d, \u201cveld\u201d, \u201cprompt\u201d of \u201cAI\u201d.",
    "",
    "Gebruik van informatie:",
    "- Gebruik uitsluitend informatie die aanwezig is of logisch en voorzichtig daaruit afleidbaar is.",
    "- Combineer meerdere signalen als die samen een duidelijke en verantwoorde conclusie ondersteunen.",
    "- Gebruik impliciete informatie alleen als die echt voor de hand ligt en professioneel verantwoord is.",
    "- Noem nooit diagnoses.",
    "- Noem geen zaken die niet uit de beschikbare informatie volgen.",
    "",
    "factualBasis:",
    "factualBasis is een korte, zakelijke samenvatting van de feiten en observaties waarop het antwoord is gebaseerd.",
    "Deze feitelijke basis moet bruikbaar zijn om later een nieuw antwoord op hetzelfde veld te kunnen hergenereren, zonder nieuwe feiten toe te voegen.",
    "Formuleer dit in natuurlijk Nederlands, zonder verwijzingen naar technische of interne termen.",
    "Voorbeelden van goede factualBasis:",
    "- \u201cCli\u00ebnt wordt omschreven als werkfit en geeft aan dat het goed gaat.\u201d",
    "- \u201cEr is sprake van positieve voortgang en voldoende functioneren richting werk.\u201d",
    "Niet gebruiken:",
    "- \u201cIn de broninformatie staat\u2026\u201d",
    "- \u201cDe input vermeldt\u2026\u201d",
    "",
    "Schrijfstijl voor answers:",
    "- professioneel en zakelijk",
    "- formeel maar menselijk en cliëntgericht; vermijd afstandelijke standaardzinnen als directere formulering mogelijk is",
    "- concreet en duidelijk",
    "- iets uitgebreider dan het minimum",
    "- volledig waar de informatie dat toelaat",
    "- passend bij UWV-rapportages",
    "- geen verwijzingen naar systemen of data-invoer",
    "- geen opsommingen tenzij het antwoordType daarom vraagt",
    "- geen holle algemeenheden als de informatie beperkt is; schrijf dan liever kort, feitelijk en terughoudend",
    "",
    "Lengte:",
    "- Bij tekstvelden: formuleer het antwoord in 2 tot 5 volledige zinnen wanneer de informatie dat toelaat",
    "- Geef bij voldoende informatie een inhoudelijk uitgewerkt antwoord, niet alleen een kale conclusie",
    "- Blijf compact als de beschikbare informatie beperkt is",
    "",
    "Gebruik van voorbeeldAntwoord:",
    "- De voorbeeldAntwoorden zijn richtinggevend en vaak beknopt geformuleerd.",
    "- Gebruik ze om type antwoord, toon en structuur te begrijpen, niet om de gewenste lengte te bepalen.",
    "- Het werkelijke antwoord mag en moet, waar de beschikbare informatie dat toelaat, inhoudelijk uitgebreider zijn dan het voorbeeldAntwoord.",
    "",
    "Werkwijze per veld:",
    "- Lees vraag, instructie en miniPrompt samen.",
    "- Gebruik de miniPrompt als sturing voor inhoud, toon en detailniveau van precies dat veld.",
    "- Respecteer verschillen tussen velden: bijvoorbeeld activiteiten, voortgang, resultaat, onderbouwing, klantbeleving, afspraken, verwachtingen, advies en klantreactie vragen elk om een ander soort antwoord.",
    "",
    "Regels:",
    "- Verzin geen feiten",
    "- Gebruik alleen informatie die aanwezig is of logisch en voorzichtig afleidbaar is",
    "- Trek geen conclusies die niet ondersteund worden",
    "- Vul velden bij voorkeur w\u00e9l in als er voldoende aanknopingspunten zijn voor een verantwoord professioneel antwoord",
    "- Als answerType 'multiple_choice' of 'structured' is, moet answer exact het opgegeven objectformat volgen",
    "- Als er echt onvoldoende informatie is om verantwoord te antwoorden: geef het veld niet terug",
    "- Volg skipLogica expliciet",
    "- Geef uitsluitend geldige JSON terug zonder markdown",
    "",
    `Actief template: ${template.name} (${template.id})`,
  ].join("\n")
}

export function buildFieldPromptBlock(template: UwvTemplate): string {
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
        `miniPrompt: ${config.miniPrompt}`,
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
