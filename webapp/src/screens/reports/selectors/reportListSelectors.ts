import { getClientDisplayName } from '../../../types/client'
import { isInputReportArtifact } from '../../../types/sessionArtifacts'
import type { LocalAppData } from '../../../storage/types'

export type ReportListStatus = 'done' | 'review'

export type ReportListItem = {
  sessionId: string
  title: string
  clientName: string
  createdAtLabel: string
  updatedRelativeLabel: string
  status: ReportListStatus
  statusLabel: 'Afgerond' | 'Controleren'
}

function toRelativeDateLabel(valueUnixMs: number): string {
  const now = Date.now()
  const diffMs = Math.max(0, now - valueUnixMs)
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.floor(diffMs / dayMs)
  if (diffDays <= 0) return 'Vandaag'
  if (diffDays === 1) return '1 dag geleden'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  if (diffDays < 14) return '1 week geleden'
  if (diffDays < 31) return `${Math.floor(diffDays / 7)} weken geleden`
  if (diffDays < 61) return '1 maand geleden'
  return `${Math.floor(diffDays / 30)} maanden geleden`
}

export function selectReportListItems(data: LocalAppData): ReportListItem[] {
  return data.inputs
    .filter((session) => isInputReportArtifact(session))
    .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
    .map((session) => {
      const reportText = data.inputSummaries.find((item) => item.sessionId === session.id)?.text ?? ''
      const hasContent = reportText.trim().length > 0
      const status: ReportListStatus = hasContent ? 'done' : 'review'
      return {
        sessionId: session.id,
        title: String(session.title || '').trim() || 'Rapport',
        clientName: getClientDisplayName(data.clients, session.clientId),
        createdAtLabel: new Date(session.createdAtUnixMs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }),
        updatedRelativeLabel: toRelativeDateLabel(session.updatedAtUnixMs),
        status,
        statusLabel: status === 'done' ? 'Afgerond' : 'Controleren',
      }
    })
}

