import { generateInputSummary } from '../summaries/generateInputSummary'
import { generateInputSummary as generateInputSummaryFromTranscript } from '../summaries/generateInputSummaryFromTranscript'
import { buildReportPrompt } from './buildReportPrompt'
import type { ReportGenerationInput } from './reportTypes'
import type { SummaryTemplate } from '../summaries/summaryTemplate'

export async function generateReport(input: ReportGenerationInput): Promise<string> {
  return generateInputSummary({
    prompt: buildReportPrompt(input),
  })
}

export async function generateReportFromSource(params: {
  sourceText: string
  template?: SummaryTemplate | null
}): Promise<string> {
  return generateInputSummaryFromTranscript({
    transcript: params.sourceText,
    template: params.template,
  })
}

