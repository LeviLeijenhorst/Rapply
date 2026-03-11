import { generateSessionSummary } from '../summaries/generateSessionSummary'
import { generateSessionSummary as generateSessionSummaryFromTranscript } from '../summaries/generateSessionSummaryFromTranscript'
import { buildReportPrompt } from './buildReportPrompt'
import type { ReportGenerationInput } from './reportTypes'
import type { SummaryTemplate } from '../summaries/summaryTemplate'

export async function generateReport(input: ReportGenerationInput): Promise<string> {
  return generateSessionSummary({
    prompt: buildReportPrompt(input),
  })
}

export async function generateReportFromSource(params: {
  sourceText: string
  template?: SummaryTemplate | null
}): Promise<string> {
  return generateSessionSummaryFromTranscript({
    transcript: params.sourceText,
    template: params.template,
  })
}
