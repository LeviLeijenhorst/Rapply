import { callSecureApi } from '../secureApi'

export type ReportSavePayload = {
  id?: string
  clientId?: string | null
  trajectoryId?: string | null
  sourceSessionId?: string | null
  title?: string
  reportType?: string
  state?: 'incomplete' | 'needs_review' | 'complete'
  reportText?: string
  reportDate?: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export async function saveReportRemote(report: ReportSavePayload): Promise<void> {
  await callSecureApi('/reports/save', { report })
}

export const reportApi = {
  save: saveReportRemote,
}
