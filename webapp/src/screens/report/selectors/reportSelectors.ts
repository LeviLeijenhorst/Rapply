import type { WrittenReport } from '../../../storage/types'

export function selectReportBySessionId(reports: WrittenReport[], sessionId: string) {
  return reports.find((report) => report.sessionId === sessionId) ?? null
}
