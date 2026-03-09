import { exportUwvTemplateWord } from '../export/uwv/exportToUWVWordDocument'

export async function exportReportToWord(params: {
  templateName: string
  reportText: string
  contextValues: Record<string, string>
}): Promise<boolean> {
  return exportUwvTemplateWord(params)
}
