import { callSecureApi } from '../secureApi'

export type ReportSavePayload = {
  id?: string
  clientId?: string | null
  trajectoryId?: string | null
  sourceSessionId?: string | null
  reportCoachUserIds?: string[]
  title?: string
  reportType?: string
  state?: 'incomplete' | 'needs_review' | 'complete'
  reportText?: string
  reportStructuredJson?: unknown | null
  reportDate?: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export async function saveReportRemote(report: ReportSavePayload): Promise<void> {
  await callSecureApi('/reports/save', { report })
}

export async function updateReportCoachesRemote(params: { reportId: string; coachUserIds: string[]; updatedAtUnixMs: number }): Promise<void> {
  await callSecureApi('/reports/update-coaches', params)
}

export async function deleteReportRemote(reportId: string): Promise<void> {
  await callSecureApi('/reports/delete', { reportId })
}

export const reportApi = {
  save: saveReportRemote,
  updateCoaches: updateReportCoachesRemote,
  delete: deleteReportRemote,
}
