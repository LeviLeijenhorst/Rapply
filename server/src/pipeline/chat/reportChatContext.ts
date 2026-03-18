import type { Note } from "../../types/Note"
import type { StructuredReportField } from "../../types/Report"
import type { Snippet } from "../../types/Snippet"
import type { UwvTemplate, UwvTemplateField } from "../templates/uwvTemplates"

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (value === null || typeof value === "undefined") return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value).trim()
}

function formatFieldContextLine(field: StructuredReportField, templateField: UwvTemplateField): string {
  return [
    `fieldId=${field.fieldId}`,
    `exportNumberKey=${normalizeText(templateField.exportNumberKey) || "-"}`,
    `label=${normalizeText(templateField.label) || "-"}`,
    `type=${field.fieldType}`,
    `answer=${normalizeText(field.answer) || "-"}`,
    `factualBasis=${normalizeText(field.factualBasis) || "-"}`,
  ].join("\n")
}

function readSnippetInputId(snippet: Snippet): string {
  return normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId)
}

function readSnippetLabels(snippet: Snippet): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  const candidates = [...(Array.isArray(snippet.fieldIds) ? snippet.fieldIds : []), snippet.fieldId, snippet.snippetType]
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

// Builds report-chat context from non-programmatic fields plus allowed notes/snippets only.
export function buildReportChatContext(params: {
  reportId: string
  template: UwvTemplate
  fields: Record<string, StructuredReportField>
  clientId: string | null
  sourceInputId: string | null
  snippets: Snippet[]
  notes: Note[]
}): string {
  const allowedFieldLines = params.template.fields
    .map((templateField) => ({ templateField, field: params.fields[templateField.fieldId] }))
    .filter((item): item is { templateField: UwvTemplateField; field: StructuredReportField } => Boolean(item.field))
    .filter((item) => item.field.fieldType !== "programmatic")
    .map((item) => formatFieldContextLine(item.field, item.templateField))

  const reportClientId = normalizeText(params.clientId)
  const reportSourceInputId = normalizeText(params.sourceInputId)

  const allowedSnippets = params.snippets
    .filter((snippet) => snippet.approvalStatus === "approved")
    .filter((snippet) => {
      if (reportSourceInputId) return readSnippetInputId(snippet) === reportSourceInputId
      if (!reportClientId) return false
      return normalizeText(snippet.clientId) === reportClientId
    })
    .slice(0, 24)
    .map((snippet) => `- [${readSnippetLabels(snippet).join(", ")}] ${normalizeText(snippet.text)}`)

  const allowedNotes = params.notes
    .filter((note) => {
      if (!reportClientId) return false
      if (normalizeText(note.clientId) !== reportClientId) return false
      if (!reportSourceInputId) return true
      const noteSourceInputId = normalizeText(note.sourceInputId)
      return !noteSourceInputId || noteSourceInputId === reportSourceInputId
    })
    .slice(0, 16)
    .map((note) => `- ${normalizeText(note.title) || "Notitie"}: ${normalizeText(note.text)}`)

  return [
    `Reportchat context (reportId=${params.reportId})`,
    "Gebruik alleen niet-programmatic velden, factual basis en toegestane evidence.",
    "Programmatic velden mogen niet worden aangepast.",
    "",
    "AI en manual velden:",
    allowedFieldLines.length > 0 ? allowedFieldLines.join("\n\n") : "- Geen velden beschikbaar",
    "",
    "Toegestane snippets:",
    allowedSnippets.length > 0 ? allowedSnippets.join("\n") : "- Geen snippets",
    "",
    "Toegestane notities:",
    allowedNotes.length > 0 ? allowedNotes.join("\n") : "- Geen notities",
  ].join("\n")
}
