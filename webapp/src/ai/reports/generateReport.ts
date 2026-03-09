import { generateSessionSummary as requestSummary } from '../../api/summaries/generateSessionSummary'
import { buildReportPrompt } from './buildReportPrompt'
import type { ReportGenerationInput } from './reportTypes'

export async function generateReport(input: ReportGenerationInput): Promise<string> {
  return requestSummary({
    prompt: buildReportPrompt(input),
  })
}
