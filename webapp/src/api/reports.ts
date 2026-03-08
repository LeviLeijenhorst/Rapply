import { exportUwvTemplateWord } from '../api/uwvWordExport'
import { generateStructuredSummary, generateSummary } from '../api/summary'

type SummaryTemplateInput = {
  name: string
  sections: { title: string; description: string }[]
}

export async function generateReportSummary(transcript: string, template?: SummaryTemplateInput) {
  return generateSummary({ transcript, template })
}

export { generateStructuredSummary }

export async function exportReportWord(params: { templateName: string; reportText: string; contextValues: Record<string, string> }) {
  return exportUwvTemplateWord(params)
}
