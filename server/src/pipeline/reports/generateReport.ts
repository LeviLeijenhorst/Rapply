import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { env } from "../../env"
import type { Client } from "../../types/Client"
import type { OrganizationSettings } from "../../types/OrganizationSettings"
import type { StructuredReport, StructuredReportField } from "../../types/Report"
import type { Trajectory } from "../../types/Trajectory"
import type { UserSettings } from "../../types/UserSettings"
import type { UwvTemplate } from "../templates/uwvTemplates"
import { buildReportTextFromStructured, createStructuredField, createStructuredReport, normalizeConfidence } from "./structuredReportTools"

type EvidenceByFieldId = Map<string, string[]>

type ReasoningField = {
  fieldId: string
  factualBasis: string
  reasoning: string
  confidence: number | null
}

type AnswerField = {
  fieldId: string
  answer: string
}

function logReportPrompt(label: string, prompt: string): void {
  try {
    console.log(`[ai:${label}:prompt]\n${prompt}`)
  } catch {
    // Never let diagnostics break report generation.
  }
}

export function buildReasoningPrompt(params: {
  template: UwvTemplate
  evidenceByFieldId: Map<string, string[]>
}): string {
  const fieldEvidenceLines = params.template.fields.map((field) => {
    const evidence = params.evidenceByFieldId.get(field.fieldId) ?? []
    const notes = params.evidenceByFieldId.get("general_notes") ?? []
    const merged = [...evidence, ...notes].slice(0, 8)
    return `${field.fieldId}\n${merged.length > 0 ? merged.map((line) => `- ${line}`).join("\n") : "- GEEN_DIRECT_BEWIJS"}`
  })

  return [
    "U bent een redeneringsstap voor UWV-rapportvelden.",
    "Gebruik alleen de aangeleverde evidence. Geen externe kennis.",
    "Voor elk fieldId: bepaal factualBasis, korte reasoning, confidence (0-1).",
    "Als er geen direct bewijs is: factualBasis leeg laten en expliciet benoemen dat het antwoord leeg moet blijven.",
    'Antwoord uitsluitend als JSON: {"fields":[{"fieldId":"string","factualBasis":"string","reasoning":"string","confidence":0.0}]}',
    "",
    `Template: ${params.template.name}`,
    "",
    ...fieldEvidenceLines,
  ].join("\n")
}

export function buildAnswerPrompt(params: {
  template: UwvTemplate
  reasoningByFieldId: Map<string, ReasoningField>
}): string {
  const reasoningLines = params.template.fields
    .filter((field) => field.fieldType === "ai")
    .map((field) => {
      const reasoning = params.reasoningByFieldId.get(field.fieldId)
      return [
        `fieldId=${field.fieldId}`,
        `label=${field.label}`,
        `factualBasis=${reasoning?.factualBasis || "GEEN_DIRECT_BEWIJS"}`,
      ].join("\n")
    })

  return [
    "U schrijft antwoorden voor UWV-rapportvelden.",
    "Gebruik alleen factualBasis per fieldId; geen extra aannames.",
    "Schrijf kort, zakelijk Nederlands, 1-4 zinnen per veld.",
    "Als factualBasis ontbreekt of GEEN_DIRECT_BEWIJS bevat: geef exact een lege string als answer.",
    'Antwoord uitsluitend als JSON: {"fields":[{"fieldId":"string","answer":"string"}]}',
    "",
    `Template: ${params.template.name}`,
    "",
    ...reasoningLines,
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

function hasDirectEvidence(factualBasis: string): boolean {
  const normalized = normalizeText(factualBasis).toUpperCase()
  if (!normalized) return false
  if (normalized === "GEEN_DIRECT_BEWIJS") return false
  if (normalized === "- GEEN_DIRECT_BEWIJS") return false
  return !normalized
    .split(/\s+/)
    .every((part) => part === "-" || part === "GEEN_DIRECT_BEWIJS")
}

function readReasoningDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiReasoningDeployment || env.azureOpenAiReportDeployment || env.azureOpenAiChatDeployment || env.azureOpenAiSummaryDeployment)
}

function readReportDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiReportDeployment || env.azureOpenAiChatDeployment || env.azureOpenAiSummaryDeployment)
}

function readLegacyDeploymentOrEmpty(): string {
  return normalizeText(env.azureOpenAiSummaryDeployment || env.azureOpenAiChatDeployment)
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
  if (label === "bsn") {
    const match = String(params.client?.clientDetails || "").match(/\b\d{8,9}\b/)
    return normalizeText(match?.[0] ?? "")
  }
  if (label.includes("burgerservicenummer")) {
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

function createFallbackReasoning(template: UwvTemplate, evidenceByFieldId: EvidenceByFieldId): ReasoningField[] {
  return template.fields.map((field) => {
    const evidence = evidenceByFieldId.get(field.fieldId) ?? []
    const notes = evidenceByFieldId.get("general_notes") ?? []
    const factualBasis = [...evidence, ...notes].slice(0, 6).join("\n- ").trim()
    return {
      fieldId: field.fieldId,
      factualBasis: factualBasis ? `- ${factualBasis}` : "",
      reasoning: factualBasis
        ? "Feiten zijn direct afgeleid uit geselecteerde snippets en notities."
        : "Geen direct bewijs beschikbaar; laat antwoord leeg.",
      confidence: factualBasis ? 0.68 : 0.28,
    }
  })
}

async function runReasoningCall(params: {
  template: UwvTemplate
  evidenceByFieldId: EvidenceByFieldId
}): Promise<ReasoningField[]> {
  const resolveFieldId = createTemplateFieldIdResolver(params.template)
  const fallbackByFieldId = new Map(
    createFallbackReasoning(params.template, params.evidenceByFieldId).map((field) => [field.fieldId, field]),
  )
  const deployment = readReasoningDeploymentOrEmpty() || readLegacyDeploymentOrEmpty()
  if (!deployment) return Array.from(fallbackByFieldId.values())

  const prompt = buildReasoningPrompt({
    template: params.template,
    evidenceByFieldId: params.evidenceByFieldId,
  })
  logReportPrompt("report-generation:reasoning", prompt)

  const raw = await completeAzureOpenAiChat({
    deployment,
    debugLogLabel: "report-generation:reasoning",
    messages: [
      { role: "system", content: "U geeft alleen geldige JSON terug zonder markdown." },
      { role: "user", content: prompt },
    ],
  })
  const parsed = safeJsonParse<{ fields?: Array<Record<string, unknown>> }>(raw)
  const parsedFields = Array.isArray(parsed?.fields) ? parsed.fields : []
  if (parsedFields.length === 0) return Array.from(fallbackByFieldId.values())

  const output: ReasoningField[] = []
  for (const rawField of parsedFields) {
    const fieldId = resolveFieldId(rawField.fieldId)
    if (!fieldId) continue
    output.push({
      fieldId,
      factualBasis: normalizeText(rawField.factualBasis),
      reasoning: normalizeText(rawField.reasoning),
      confidence: normalizeConfidence(rawField.confidence),
    })
  }
  for (const field of output) {
    fallbackByFieldId.set(field.fieldId, field)
  }
  return params.template.fields.map((field) => fallbackByFieldId.get(field.fieldId)!)
}

function createFallbackAnswers(params: { template: UwvTemplate; reasoningByFieldId: Map<string, ReasoningField> }): AnswerField[] {
  return params.template.fields
    .filter((field) => field.fieldType === "ai")
    .map((field) => {
      const reasoning = params.reasoningByFieldId.get(field.fieldId)
      if (!hasDirectEvidence(reasoning?.factualBasis || "")) {
        return {
          fieldId: field.fieldId,
          answer: "",
        }
      }
      return {
        fieldId: field.fieldId,
        answer: (reasoning?.factualBasis || "").replace(/^- /g, "").slice(0, 1200),
      }
    })
}

async function runAnswerCall(params: {
  template: UwvTemplate
  reasoningByFieldId: Map<string, ReasoningField>
}): Promise<AnswerField[]> {
  const resolveFieldId = createTemplateFieldIdResolver(params.template)
  const fallbackByFieldId = new Map(
    createFallbackAnswers(params).map((field) => [field.fieldId, field.answer]),
  )
  const deployment = readReportDeploymentOrEmpty() || readLegacyDeploymentOrEmpty()
  if (!deployment) {
    return params.template.fields
      .filter((field) => field.fieldType === "ai")
      .map((field) => ({ fieldId: field.fieldId, answer: fallbackByFieldId.get(field.fieldId) ?? "" }))
  }

  const prompt = buildAnswerPrompt({
    template: params.template,
    reasoningByFieldId: params.reasoningByFieldId,
  })
  logReportPrompt("report-generation:answer", prompt)

  const raw = await completeAzureOpenAiChat({
    deployment,
    temperature: 0.2,
    debugLogLabel: "report-generation:answer",
    messages: [
      { role: "system", content: "U geeft alleen geldige JSON terug zonder markdown." },
      { role: "user", content: prompt },
    ],
  })
  const parsed = safeJsonParse<{ fields?: Array<Record<string, unknown>> }>(raw)
  const parsedFields = Array.isArray(parsed?.fields) ? parsed.fields : []
  if (parsedFields.length === 0) {
    return params.template.fields
      .filter((field) => field.fieldType === "ai")
      .map((field) => ({ fieldId: field.fieldId, answer: fallbackByFieldId.get(field.fieldId) ?? "" }))
  }

  const output: AnswerField[] = []
  for (const rawField of parsedFields) {
    const fieldId = resolveFieldId(rawField.fieldId)
    const answer = normalizeText(rawField.answer)
    if (!fieldId) continue
    output.push({ fieldId, answer })
  }
  for (const field of output) {
    fallbackByFieldId.set(field.fieldId, field.answer)
  }
  return params.template.fields
    .filter((field) => field.fieldType === "ai")
    .map((field) => ({ fieldId: field.fieldId, answer: fallbackByFieldId.get(field.fieldId) ?? "" }))
}

export async function generateStructuredReport(params: {
  template: UwvTemplate
  client: Client | null
  trajectory: Trajectory | null
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
  evidenceByFieldId: EvidenceByFieldId
}): Promise<{ structuredReport: StructuredReport; reportText: string }> {
  const now = Date.now()
  const reasoningFields = await runReasoningCall({
    template: params.template,
    evidenceByFieldId: params.evidenceByFieldId,
  })
  const reasoningByFieldId = new Map(reasoningFields.map((field) => [field.fieldId, field]))

  const answerFields = await runAnswerCall({
    template: params.template,
    reasoningByFieldId,
  })
  const answerByFieldId = new Map(answerFields.map((field) => [field.fieldId, field.answer]))

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

    const reasoning = reasoningByFieldId.get(field.fieldId)
    const hasEvidence = hasDirectEvidence(reasoning?.factualBasis || "")
    const answer = hasEvidence ? answerByFieldId.get(field.fieldId) ?? "" : ""
    structuredFields[field.fieldId] = createStructuredField({
      field,
      answer,
      factualBasis: reasoning?.factualBasis || "",
      reasoning: reasoning?.reasoning || "",
      confidence: reasoning?.confidence ?? null,
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

  return {
    structuredReport,
    reportText,
  }
}
