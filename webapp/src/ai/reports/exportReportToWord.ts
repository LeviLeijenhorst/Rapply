import { exportReportToWord as exportReportToWordTransport } from '../../api/reports/exportReportToWord'

export async function exportReportToWord(params: {
  templateName: string
  reportText: string
  contextValues: Record<string, string>
}): Promise<boolean> {
  return exportReportToWordTransport(params)
}
