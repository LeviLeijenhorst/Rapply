import type { PipelineChatResponse, PipelineTemplate } from '@/api/pipeline/pipelineApi'
import type { Report, StructuredReportField } from '@/storage/types'

export function formatConfidence(confidence: number | null): string {
  if (confidence === null || !Number.isFinite(confidence)) return 'Onbekend'
  return `${Math.round(Math.max(0, Math.min(1, confidence)) * 100)}%`
}

export function formatVersionSource(source: StructuredReportField['versions'][number]['source']): string {
  if (source === 'ai_generation') return 'AI generatie'
  if (source === 'ai_regeneration') return 'AI regeneratie'
  if (source === 'chat_update') return 'Chat update'
  return 'Handmatige wijziging'
}

export function readFieldOrder(report: Report, template: PipelineTemplate | null): string[] {
  const fields = report.reportStructuredJson?.fields ?? {}
  const ids = new Set<string>()
  const ordered: string[] = []
  if (template) {
    for (const field of template.fields) {
      if (!fields[field.fieldId]) continue
      ids.add(field.fieldId)
      ordered.push(field.fieldId)
    }
  }
  for (const fieldId of Object.keys(fields)) {
    if (ids.has(fieldId)) continue
    ordered.push(fieldId)
  }
  return ordered
}

export function hasChatFieldUpdates(response: Pick<PipelineChatResponse, 'fieldUpdates'>): boolean {
  if (!Array.isArray(response.fieldUpdates)) return false
  return response.fieldUpdates.some((update) => String(update.fieldId || '').trim() && String(update.answer || '').trim())
}
