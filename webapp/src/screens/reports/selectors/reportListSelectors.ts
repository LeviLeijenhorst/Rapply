import { getClientDisplayName } from '../../../types/client'
import type { LocalAppData } from '../../../storage/types'

export type ReportListStatus = 'done' | 'review'

export type ReportListItem = {
  reportId: string
  sourceInputId: string | null
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
  return data.reports
    .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
    .map((report) => {
      const status: ReportListStatus = report.state === 'complete' ? 'done' : 'review'
      return {
        reportId: report.id,
        sourceInputId: report.sourceInputId ?? null,
        title: String(report.title || '').trim() || 'Rapport',
        clientName: getClientDisplayName(data.clients, report.clientId),
        createdAtLabel: new Date(report.createdAtUnixMs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }),
        updatedRelativeLabel: toRelativeDateLabel(report.updatedAtUnixMs),
        status,
        statusLabel: status === 'done' ? 'Afgerond' : 'Controleren',
      }
    })
}

