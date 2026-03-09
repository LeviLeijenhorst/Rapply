import { generateSessionSummary } from '../summaries/generateSessionSummary'
import { buildReportPrompt } from './buildReportPrompt'
import type { ReportGenerationInput } from './reportTypes'

export async function generateReport(input: ReportGenerationInput): Promise<string> {
  return generateSessionSummary({
    prompt: buildReportPrompt(input),
  })
}
