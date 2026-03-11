import { callSecureApi } from '../secureApi'
import type { WrittenReport } from '../../storage/types'

export async function setWrittenReportRemote(report: WrittenReport): Promise<void> {
  await callSecureApi('/written-reports/set', { report })
}

export const reportApi = {
  save: setWrittenReportRemote,
}
