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
  const deployment = readReasoningDeploymentOrEmpty() || readLegacyDeploymentOrEmpty()
  if (!deployment) return createFallbackReasoning(params.template, params.evidenceByFieldId)

  const fieldEvidenceLines = params.template.fields.map((field) => {
    const evidence = params.evidenceByFieldId.get(field.fieldId) ?? []
    const notes = params.evidenceByFieldId.get("general_notes") ?? []
    const merged = [...evidence, ...notes].slice(0, 8)
    return `${field.fieldId}\n${merged.length > 0 ? merged.map((line) => `- ${line}`).join("\n") : "- GEEN_DIRECT_BEWIJS"}`
  })

  const prompt = [
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

  const raw = await completeAzureOpenAiChat({
    deployment,
    messages: [
      { role: "system", content: "U geeft alleen geldige JSON terug zonder markdown." },
      { role: "user", content: prompt },
    ],
  })
  const parsed = safeJsonParse<{ fields?: Array<Record<string, unknown>> }>(raw)
  const parsedFields = Array.isArray(parsed?.fields) ? parsed.fields : []
  if (parsedFields.length === 0) return createFallbackReasoning(params.template, params.evidenceByFieldId)

  const output: ReasoningField[] = []
  for (const rawField of parsedFields) {
    const fieldId = normalizeText(rawField.fieldId)
    if (!fieldId) continue
    output.push({
      fieldId,
      factualBasis: normalizeText(rawField.factualBasis),
      reasoning: normalizeText(rawField.reasoning),
      confidence: normalizeConfidence(rawField.confidence),
    })
  }
  if (output.length === 0) return createFallbackReasoning(params.template, params.evidenceByFieldId)
  return output
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
  const deployment = readReportDeploymentOrEmpty() || readLegacyDeploymentOrEmpty()
  if (!deployment) return createFallbackAnswers(params)

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

  const prompt = [
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

  const raw = await completeAzureOpenAiChat({
    deployment,
    temperature: 0.2,
    messages: [
      { role: "system", content: "U geeft alleen geldige JSON terug zonder markdown." },
      { role: "user", content: prompt },
    ],
  })
  const parsed = safeJsonParse<{ fields?: Array<Record<string, unknown>> }>(raw)
  const parsedFields = Array.isArray(parsed?.fields) ? parsed.fields : []
  if (parsedFields.length === 0) return createFallbackAnswers(params)

  const output: AnswerField[] = []
  for (const rawField of parsedFields) {
    const fieldId = normalizeText(rawField.fieldId)
    const answer = normalizeText(rawField.answer)
    if (!fieldId) continue
    output.push({ fieldId, answer })
  }
  if (output.length === 0) return createFallbackAnswers(params)
  return output
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
