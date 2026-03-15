import { callSecureApi } from '../secureApi'
import type { Report, Snippet, StructuredReport, StructuredReportField } from '../../storage/types'

export type PipelineTemplateField = {
  fieldId: string
  label: string
  fieldType: 'programmatic' | 'ai' | 'manual'
  exportNumberKey: string
}

export type PipelineTemplate = {
  id: string
  name: string
  description: string
  fields: PipelineTemplateField[]
}

export type PipelineChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

export type PipelineChatResponse = {
  answer: string
  waitingMessage: string
  tool: string
  memoryUpdate: null | { summary: string }
  toneUpdate: null | { tone: string }
  fieldUpdates?: Array<{ fieldId: string; answer: string }>
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeTemplateField(value: unknown): PipelineTemplateField | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const fieldId = normalizeText(source.fieldId)
  const label = normalizeText(source.label)
  const exportNumberKey = normalizeText(source.exportNumberKey)
  const fieldTypeRaw = normalizeText(source.fieldType)
  if (!fieldId || !label || !exportNumberKey) return null
  const fieldType: PipelineTemplateField['fieldType'] =
    fieldTypeRaw === 'programmatic' || fieldTypeRaw === 'manual' ? fieldTypeRaw : 'ai'
  return {
    fieldId,
    label,
    fieldType,
    exportNumberKey,
  }
}

function normalizeTemplate(value: unknown): PipelineTemplate | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const id = normalizeText(source.id)
  const name = normalizeText(source.name)
  if (!id || !name) return null
  const fields = Array.isArray(source.fields) ? source.fields.map(normalizeTemplateField).filter(Boolean) : []
  return {
    id,
    name,
    description: normalizeText(source.description),
    fields: fields as PipelineTemplateField[],
  }
}

function normalizeSnippetStatus(value: unknown): Snippet['status'] {
  const normalized = normalizeText(value)
  if (normalized === 'approved' || normalized === 'rejected') return normalized
  return 'pending'
}

function normalizeSnippet(value: unknown): Snippet | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const id = normalizeText(source.id)
  const inputId = normalizeText(source.sourceInputId ?? source.sourceSessionId ?? source.inputId ?? source.itemId)
  const fieldId = normalizeText(source.fieldId ?? source.snippetType ?? source.field)
  if (!id || !inputId || !fieldId) return null
  const now = Date.now()
  const trajectoryId = normalizeText(source.trajectoryId) || null
  const clientId = normalizeText(source.clientId) || null
  return {
    id,
    clientId,
    trajectoryId,
    inputId,
    sourceInputId: inputId,
    sourceSessionId: inputId,
    itemId: inputId,
    field: fieldId,
    fieldId,
    text: normalizeText(source.text),
    date: Number.isFinite(Number(source.snippetDate)) ? Number(source.snippetDate) : now,
    status: normalizeSnippetStatus(source.approvalStatus ?? source.status),
    createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
  }
}

function normalizeReportFieldVersion(value: unknown): StructuredReportField['versions'][number] | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const id = normalizeText(source.id)
  const sourceKindRaw = normalizeText(source.source)
  if (!id) return null
  const sourceKind: StructuredReportField['versions'][number]['source'] =
    sourceKindRaw === 'ai_regeneration' ||
    sourceKindRaw === 'manual_edit' ||
    sourceKindRaw === 'chat_update'
      ? sourceKindRaw
      : 'ai_generation'
  return {
    id,
    source: sourceKind,
    answer: normalizeText(source.answer),
    factualBasis: normalizeText(source.factualBasis),
    reasoning: normalizeText(source.reasoning),
    confidence: Number.isFinite(Number(source.confidence)) ? Number(source.confidence) : null,
    prompt: normalizeText(source.prompt) || null,
    createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : Date.now(),
  }
}

function normalizeStructuredReportField(value: unknown): StructuredReportField | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const fieldId = normalizeText(source.fieldId)
  const label = normalizeText(source.label)
  if (!fieldId || !label) return null
  const fieldTypeRaw = normalizeText(source.fieldType)
  const fieldType: StructuredReportField['fieldType'] =
    fieldTypeRaw === 'programmatic' || fieldTypeRaw === 'manual' ? fieldTypeRaw : 'ai'
  const versions = Array.isArray(source.versions) ? source.versions.map(normalizeReportFieldVersion).filter(Boolean) : []
  const normalizedConfidence = Number.isFinite(Number(source.confidence)) ? Number(source.confidence) : null
  return {
    fieldId,
    label,
    fieldType,
    answer: normalizeText(source.answer),
    factualBasis: normalizeText(source.factualBasis),
    reasoning: normalizeText(source.reasoning),
    confidence: fieldType === 'programmatic' ? null : normalizedConfidence,
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : Date.now(),
    versions: versions as StructuredReportField['versions'],
  }
}

function normalizeStructuredReport(value: unknown): StructuredReport | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const templateId = normalizeText(source.templateId)
  const templateName = normalizeText(source.templateName)
  if (!templateId || !templateName) return null
  const rawFields = source.fields && typeof source.fields === 'object' ? (source.fields as Record<string, unknown>) : {}
  const fields: Record<string, StructuredReportField> = {}
  for (const [key, rawField] of Object.entries(rawFields)) {
    const normalizedField = normalizeStructuredReportField(rawField)
    if (!normalizedField) continue
    fields[normalizeText(key) || normalizedField.fieldId] = normalizedField
  }
  return {
    templateId,
    templateName,
    createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : Date.now(),
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : Date.now(),
    fields,
  }
}

function normalizeReport(value: unknown): Report | null {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const id = normalizeText(source.id)
  if (!id) return null
  const stateRaw = normalizeText(source.state)
  const state: Report['state'] = stateRaw === 'incomplete' || stateRaw === 'complete' ? stateRaw : 'needs_review'
  const sourceInputId = normalizeText(source.sourceInputId ?? source.sourceSessionId) || null
  return {
    id,
    clientId: normalizeText(source.clientId) || null,
    trajectoryId: normalizeText(source.trajectoryId) || null,
    sourceInputId,
    title: normalizeText(source.title) || 'Rapportage',
    reportType: normalizeText(source.reportType) || 'uwv',
    state,
    reportText: String(source.reportText ?? source.text ?? ''),
    reportStructuredJson: normalizeStructuredReport(source.reportStructuredJson),
    reportDate: normalizeText(source.reportDate) || null,
    createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : Date.now(),
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : Date.now(),
  }
}

function normalizeChatResponse(value: unknown): PipelineChatResponse {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const fieldUpdates = Array.isArray(source.fieldUpdates)
    ? source.fieldUpdates
        .map((update) => {
          const updateSource = (update && typeof update === 'object' ? update : {}) as Record<string, unknown>
          const fieldId = normalizeText(updateSource.fieldId)
          const answer = normalizeText(updateSource.answer)
          if (!fieldId || !answer) return null
          return { fieldId, answer }
        })
        .filter(Boolean)
    : []
  return {
    answer: normalizeText(source.answer),
    waitingMessage: normalizeText(source.waitingMessage) || 'Even nadenken...',
    tool: normalizeText(source.tool),
    memoryUpdate:
      source.memoryUpdate && typeof source.memoryUpdate === 'object'
        ? { summary: normalizeText((source.memoryUpdate as Record<string, unknown>).summary) }
        : null,
    toneUpdate:
      source.toneUpdate && typeof source.toneUpdate === 'object'
        ? { tone: normalizeText((source.toneUpdate as Record<string, unknown>).tone) }
        : null,
    fieldUpdates: fieldUpdates as Array<{ fieldId: string; answer: string }>,
  }
}

export async function listPipelineTemplates(): Promise<PipelineTemplate[]> {
  const response = await callSecureApi<{ templates?: unknown[] }>('/pipeline/templates', {})
  if (!Array.isArray(response.templates)) return []
  return response.templates.map(normalizeTemplate).filter(Boolean) as PipelineTemplate[]
}

export async function createPipelineInput(params: {
  inputId?: string
  clientId: string
  trajectoryId?: string | null
  title?: string
  inputType?: 'spoken_recap' | 'written_recap' | 'recording' | 'uploaded_document'
  sourceText?: string | null
  sourceMimeType?: string | null
  uploadFileName?: string | null
  documentBase64?: string | null
  createdAtUnixMs?: number
  updatedAtUnixMs?: number
}): Promise<{ inputId: string; trajectoryId: string; snippets: Snippet[] }> {
  const response = await callSecureApi<{ inputId?: unknown; trajectoryId?: unknown; snippets?: unknown[] }>(
    '/pipeline/create-input',
    params,
  )
  const inputId = normalizeText(response.inputId)
  const trajectoryId = normalizeText(response.trajectoryId)
  if (!inputId || !trajectoryId) {
    throw new Error('Input is aangemaakt maar serverresponse was ongeldig.')
  }
  const snippets = Array.isArray(response.snippets) ? response.snippets.map(normalizeSnippet).filter(Boolean) : []
  return { inputId, trajectoryId, snippets: snippets as Snippet[] }
}

export async function extractDocumentText(params: {
  fileName: string
  mimeType: string
  base64Content: string
}): Promise<{ extractedText: string; detectedType: 'pdf' | 'docx' }> {
  const response = await callSecureApi<{ extractedText?: unknown; detectedType?: unknown }>(
    '/pipeline/extract-document-text',
    params,
  )
  const detectedType = normalizeText(response.detectedType) === 'docx' ? 'docx' : 'pdf'
  return {
    extractedText: normalizeText(response.extractedText),
    detectedType,
  }
}

export async function generateSnippets(inputId: string): Promise<Snippet[]> {
  const response = await callSecureApi<{ snippets?: unknown[] }>('/pipeline/generate-snippets', { inputId })
  if (!Array.isArray(response.snippets)) return []
  return response.snippets.map(normalizeSnippet).filter(Boolean) as Snippet[]
}

export async function approveSnippet(snippetId: string): Promise<void> {
  await callSecureApi('/pipeline/approve-snippet', { snippetId })
}

export async function rejectSnippet(snippetId: string): Promise<void> {
  await callSecureApi('/pipeline/reject-snippet', { snippetId })
}

export async function generateReport(params: {
  reportId?: string
  templateId: string
  clientId: string
  selectedInputIds: string[]
  selectedNoteIds: string[]
  title?: string
}): Promise<Report> {
  const response = await callSecureApi<{ report?: unknown }>('/pipeline/generate-report', params)
  const report = normalizeReport(response.report)
  if (!report) throw new Error('Rapportgeneratie heeft geen geldig rapport opgeleverd.')
  return report
}

export async function regenerateReportField(params: {
  reportId: string
  fieldId: string
  userPrompt?: string | null
}): Promise<{ report: Report; field: StructuredReportField }> {
  const response = await callSecureApi<{ report?: unknown; field?: unknown }>(
    '/pipeline/regenerate-report-field',
    params,
  )
  const report = normalizeReport(response.report)
  const field = normalizeStructuredReportField(response.field)
  if (!report || !field) throw new Error('Regeneratie-response is ongeldig.')
  return { report, field }
}

export async function saveReportFieldEdit(params: {
  reportId: string
  fieldId: string
  answer: string
}): Promise<{ report: Report; field: StructuredReportField }> {
  const response = await callSecureApi<{ report?: unknown; field?: unknown }>(
    '/pipeline/save-report-field-edit',
    params,
  )
  const report = normalizeReport(response.report)
  const field = normalizeStructuredReportField(response.field)
  if (!report || !field) throw new Error('Opslaan van veldbewerking gaf een ongeldige response.')
  return { report, field }
}

export async function sendClientPipelineChatMessage(params: {
  clientId: string
  messages: PipelineChatMessage[]
}): Promise<PipelineChatResponse> {
  const response = await callSecureApi('/pipeline/chat/client', params)
  return normalizeChatResponse(response)
}

export async function sendInputPipelineChatMessage(params: {
  inputId: string
  messages: PipelineChatMessage[]
}): Promise<PipelineChatResponse> {
  const response = await callSecureApi('/pipeline/chat/input', params)
  return normalizeChatResponse(response)
}

export async function sendReportPipelineChatMessage(params: {
  reportId: string
  messages: PipelineChatMessage[]
}): Promise<PipelineChatResponse> {
  const response = await callSecureApi('/pipeline/chat/report', params)
  return normalizeChatResponse(response)
}

export async function readPipelineReport(reportId: string): Promise<Report | null> {
  const response = await callSecureApi<{ report?: unknown }>('/pipeline/report', { reportId })
  return normalizeReport(response.report)
}

export async function readPipelineReportByInput(inputId: string): Promise<Report | null> {
  const response = await callSecureApi<{ report?: unknown }>('/pipeline/report-by-input', { inputId })
  return normalizeReport(response.report)
}
