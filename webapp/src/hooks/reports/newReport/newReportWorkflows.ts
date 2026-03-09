import { sendClientChatMessage } from '../../../ai/chat/sendClientChatMessage'
import type { LocalChatMessage } from '../../../api/chat/types'
import type { LocalAppData, Template } from '../../../storage/types'
import { exportReportToWord } from '../../../ai/reports/exportReportToWord'
import { generateSessionSummary } from '../../../ai/summaries/generateSessionSummary'
import { resolveSummaryTemplateSections } from '../../../ai/summaries/resolveSummaryTemplateSections'

export type ReportInputField = {
  key: string
  label: string
  rawLabel: string
}

export type ReportFieldGroup = {
  title: string
  fields: ReportInputField[]
}

function detectWerkfitReportTypeContext(templateName: string): { reportType: string; perspective: 'forward-looking plan' | 'retrospective evaluation' | 'generic report' } {
  const normalized = String(templateName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')

  if (normalized === 'reintegratieplanwerkfitmaken') {
    return { reportType: 'Re-integratieplan Werkfit maken', perspective: 'forward-looking plan' }
  }
  if (normalized === 'eindrapportagewerkfitmaken') {
    return { reportType: 'Eindrapportage Werkfit maken', perspective: 'retrospective evaluation' }
  }
  return { reportType: String(templateName || '').trim() || 'Onbekend rapporttype', perspective: 'generic report' }
}

export function buildReportGenerationSourceText(params: {
  data: LocalAppData
  selectedTemplate: Template
  selectedCoacheeName: string
  selectedTrajectory: { id: string | null; name: string; dienstType: string; startDate: string; orderNumber: string; planVanAanpakDocumentId: string | null }
  selectedSessionIds: string[]
  selectedRapportageIds: string[]
  selectedNoteIds: string[]
}): string {
  const { data, selectedTemplate, selectedCoacheeName, selectedTrajectory, selectedSessionIds, selectedRapportageIds, selectedNoteIds } = params
  const selectedSessionAndReportIds = new Set<string>([...selectedSessionIds, ...selectedRapportageIds])
  const reportTypeContext = detectWerkfitReportTypeContext(selectedTemplate.name)
  const writtenBySessionId = new Map(data.writtenReports.map((item) => [item.sessionId, item.text]))

  const sessionBlocks = data.sessions
    .filter((session) => selectedSessionAndReportIds.has(session.id))
    .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
    .map((session) => {
      const parts: string[] = []
      parts.push(`Titel: ${String(session.title || '').trim() || 'Item'}`)
      if (session.transcript) parts.push(`Transcript:\n${session.transcript}`)
      if (session.summary) parts.push(`Samenvatting:\n${session.summary}`)
      const written = writtenBySessionId.get(session.id)
      if (written) parts.push(`Geschreven rapport:\n${written}`)
      return parts.join('\n\n').trim()
    })

  const selectedNotes = new Set(selectedNoteIds)
  const noteBlocks = data.notes
    .filter((note) => selectedNotes.has(note.id))
    .sort((a, b) => a.updatedAtUnixMs - b.updatedAtUnixMs)
    .map((note) => {
      const linkedSession = data.sessions.find((session) => session.id === note.sessionId) ?? null
      const title = String(note.title || '').trim() || 'Notitie'
      const body = String(note.text || '').trim()
      const sessionTitle = String(linkedSession?.title || '').trim()
      return [`Titel: ${title}`, sessionTitle ? `Notitie-sessie: ${sessionTitle}` : '', body ? `Notitie:\n${body}` : '']
        .filter(Boolean)
        .join('\n\n')
    })

  const relevantSnippets = data.snippets
    .filter((snippet) => {
      if (selectedTrajectory.id && snippet.trajectoryId !== selectedTrajectory.id) return false
      if (snippet.status === 'rejected') return false
      return selectedSessionAndReportIds.has(snippet.itemId)
    })
    .sort((a, b) => a.date - b.date)

  const snippetLines = relevantSnippets
    .map((snippet) => {
      const field = String(snippet.field || '').trim()
      const text = String(snippet.text || '').trim()
      const status = String(snippet.status || '').trim()
      return field && text ? `SNIPPET_FIELD=${field} | STATUS=${status} | TEKST=${text}` : ''
    })
    .filter(Boolean)

  const relevantActivities = data.activities
    .filter((activity) => {
      if (selectedTrajectory.id && activity.trajectoryId !== selectedTrajectory.id) return false
      if (activity.sessionId && selectedSessionAndReportIds.size > 0 && !selectedSessionAndReportIds.has(activity.sessionId)) return false
      return true
    })
    .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)

  const activityLines = relevantActivities
    .map((activity) => {
      const name = String(activity.name || '').trim()
      if (!name) return ''
      const status = activity.status === 'executed' ? 'uitgevoerd' : 'gepland'
      const plannedHours = Number.isFinite(activity.plannedHours as number) ? `${activity.plannedHours} gepland` : ''
      const actualHours = Number.isFinite(activity.actualHours as number) ? `${activity.actualHours} besteed` : ''
      const hoursLabel = [plannedHours, actualHours].filter(Boolean).join(', ')
      return `ACTIVITEIT=${name} | STATUS=${status}${hoursLabel ? ` | UREN=${hoursLabel}` : ''}`
    })
    .filter(Boolean)

  const contextLines = [
    '[COACHSCRIBE_REPORT_CONTEXT]',
    `REPORT_TYPE=${reportTypeContext.reportType}`,
    `REPORT_PERSPECTIVE=${reportTypeContext.perspective}`,
    `TEMPLATE_NAME=${String(selectedTemplate.name || '').trim()}`,
    `COACHEE_NAME=${String(selectedCoacheeName || '').trim()}`,
    `TRAJECTORY_NAME=${String(selectedTrajectory.name || '').trim()}`,
    `TRAJECTORY_SERVICE=${String(selectedTrajectory.dienstType || '').trim()}`,
    `TRAJECTORY_START_DATE=${String(selectedTrajectory.startDate || '').trim()}`,
    `TRAJECTORY_ORDER_NUMBER=${String(selectedTrajectory.orderNumber || '').trim()}`,
    `PLAN_VAN_AANPAK_AVAILABLE=${selectedTrajectory.planVanAanpakDocumentId ? 'ja' : 'nee'}`,
    ...snippetLines,
    ...activityLines,
    '[/COACHSCRIBE_REPORT_CONTEXT]',
  ].filter((line) => String(line || '').trim().length > 0)

  return [contextLines.join('\n'), ...sessionBlocks, ...noteBlocks]
    .filter(Boolean)
    .join('\n\n---\n\n')
    .trim()
}

export async function generateReportText(params: {
  selectedTemplate: Template
  sourceText: string
  fallbackReportText: string
}): Promise<string> {
  const { selectedTemplate, sourceText, fallbackReportText } = params
  let generatedReport = ''
  if (sourceText) {
    generatedReport = await generateSessionSummary({ transcript: sourceText, template: resolveSummaryTemplateSections(selectedTemplate) })
  }
  return generatedReport || fallbackReportText
}

export async function exportReportWord(params: {
  templateName: string
  reportText: string
  contextValues: Record<string, string>
}): Promise<boolean> {
  return exportReportToWord({
    templateName: params.templateName,
    reportText: params.reportText,
    contextValues: params.contextValues,
  })
}

export function buildAssistantReportContext(params: {
  groupedFields: ReportFieldGroup[]
  fieldValues: Record<string, string>
  normalizeFieldValueForStorage: (field: any, value: string) => string
}): string {
  const { groupedFields, fieldValues, normalizeFieldValueForStorage } = params
  return groupedFields
    .map((group) => {
      const lines = group.fields
        .map((field) => {
          const value = normalizeFieldValueForStorage(field, String(fieldValues[field.key] || '').trim())
          if (!value) return ''
          return `${field.label}: ${value}`
        })
        .filter(Boolean)
      if (lines.length === 0) return ''
      return `${group.title}\n${lines.join('\n')}`
    })
    .filter(Boolean)
    .join('\n\n')
}

export async function sendReportAssistantMessage(params: {
  chatMessages: Array<{ role: 'user' | 'assistant'; text: string }>
  reportContext: string
}): Promise<string> {
  const modelMessages: LocalChatMessage[] = [
    {
      role: 'system',
      text:
        'U bent een AI-assistent voor loopbaan- en re-integratiecoaches. Gebruik alleen de meegeleverde rapportcontext en de vraag van de gebruiker. Schrijf formeel en zakelijk Nederlands, spreek de gebruiker aan met "u", en geef korte concrete antwoorden.',
    },
    {
      role: 'system',
      text: `Rapportcontext:\n${params.reportContext || 'Geen context beschikbaar.'}`,
    },
    ...params.chatMessages.map<LocalChatMessage>((message) => ({ role: message.role, text: message.text })),
  ]

  return sendClientChatMessage(modelMessages)
}

