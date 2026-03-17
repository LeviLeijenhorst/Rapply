import type { JsonValue, StructuredReport, StructuredReportField, ReportFieldVersion } from "../../types/Report"
import type { UwvTemplate, UwvTemplateField } from "../templates/uwvTemplates"

function nowUnixMs(): number {
  return Date.now()
}

function createVersionId(): string {
  return `report-field-version-${crypto.randomUUID()}`
}

export function normalizeConfidence(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.max(0, Math.min(1, numeric))
}

export function createFieldVersion(params: {
  source: ReportFieldVersion["source"]
  answer: JsonValue
  factualBasis: string
  reasoning: string
  confidence: number | null
  prompt: string | null
  createdAtUnixMs?: number
}): ReportFieldVersion {
  return {
    id: createVersionId(),
    source: params.source,
    answer: params.answer,
    factualBasis: String(params.factualBasis || "").trim(),
    reasoning: String(params.reasoning || "").trim(),
    confidence: params.confidence,
    prompt: params.prompt ? String(params.prompt).trim() : null,
    createdAtUnixMs: params.createdAtUnixMs ?? nowUnixMs(),
  }
}

export function createStructuredField(params: {
  field: UwvTemplateField
  answer: JsonValue
  factualBasis: string
  reasoning: string
  confidence: number | null
  source: ReportFieldVersion["source"]
  prompt: string | null
  createdAtUnixMs?: number
}): StructuredReportField {
  const updatedAtUnixMs = params.createdAtUnixMs ?? nowUnixMs()
  const version = createFieldVersion({
    source: params.source,
    answer: params.answer,
    factualBasis: params.factualBasis,
    reasoning: params.reasoning,
    confidence: params.confidence,
    prompt: params.prompt,
    createdAtUnixMs: updatedAtUnixMs,
  })
  return {
    fieldId: params.field.fieldId,
    label: params.field.label,
    fieldType: params.field.fieldType,
    answer: version.answer,
    factualBasis: version.factualBasis,
    reasoning: version.reasoning,
    confidence: version.confidence,
    updatedAtUnixMs,
    versions: [version],
  }
}

export function appendFieldVersion(params: {
  field: StructuredReportField
  source: ReportFieldVersion["source"]
  answer: JsonValue
  factualBasis?: string
  reasoning?: string
  confidence?: number | null
  prompt?: string | null
  createdAtUnixMs?: number
}): StructuredReportField {
  const updatedAtUnixMs = params.createdAtUnixMs ?? nowUnixMs()
  const version = createFieldVersion({
    source: params.source,
    answer: params.answer,
    factualBasis: params.factualBasis ?? params.field.factualBasis,
    reasoning: params.reasoning ?? params.field.reasoning,
    confidence: params.confidence ?? params.field.confidence,
    prompt: params.prompt ?? null,
    createdAtUnixMs: updatedAtUnixMs,
  })
  return {
    ...params.field,
    answer: version.answer,
    factualBasis: version.factualBasis,
    reasoning: version.reasoning,
    confidence: version.confidence,
    updatedAtUnixMs,
    versions: [...params.field.versions, version],
  }
}

export function createStructuredReport(params: {
  template: UwvTemplate
  fields: Record<string, StructuredReportField>
  createdAtUnixMs?: number
}): StructuredReport {
  const timestamp = params.createdAtUnixMs ?? nowUnixMs()
  return {
    templateId: params.template.id,
    templateName: params.template.name,
    createdAtUnixMs: timestamp,
    updatedAtUnixMs: timestamp,
    fields: params.fields,
  }
}

export function updateStructuredReport(params: {
  report: StructuredReport
  fields: Record<string, StructuredReportField>
  updatedAtUnixMs?: number
}): StructuredReport {
  return {
    ...params.report,
    fields: params.fields,
    updatedAtUnixMs: params.updatedAtUnixMs ?? nowUnixMs(),
  }
}

export function buildReportTextFromStructured(template: UwvTemplate, fields: Record<string, StructuredReportField>): string {
  const asDisplayText = (value: JsonValue): string => {
    if (typeof value === "string") return value.trim()
    if (value === null || typeof value === "undefined") return ""
    return JSON.stringify(value)
  }
  return template.fields
    .map((templateField) => {
      const answer = asDisplayText(fields[templateField.fieldId]?.answer)
      if (!answer) return ""
      return `### ${templateField.exportNumberKey} ${templateField.label}\n${answer}`
    })
    .filter(Boolean)
    .join("\n\n")
    .trim()
}
