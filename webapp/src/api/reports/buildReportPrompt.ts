import type { ReportGenerationInput } from './reportTypes'
import { buildReportContext } from './buildReportContext'
import { reportPrompt } from './prompts/reportPrompt'

export function buildReportPrompt(input: ReportGenerationInput): string {
  const reportContext = buildReportContext({
    templateName: input.templateName,
    approvedSnippets: input.approvedSnippets,
    clientKnowledge: input.clientKnowledge,
  })

  return [
    '[GENERATE_REPORT_PROMPT]',
    reportPrompt,
    `Template name: ${input.templateName}`,
    '',
    'Report context:',
    reportContext,
    '[/GENERATE_REPORT_PROMPT]',
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}
