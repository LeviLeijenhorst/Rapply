import type { ReportGenerationInput } from './reportTypes'
import { buildReportContext } from './buildReportContext'

// Keep this in sync with prompts/reportPrompt.md until the app loads prompt files directly.
const reportInstructions = [
  'Generate a formal report draft for Coachscribe.',
  'Use only the provided report context.',
  'Keep the report specific, professional, and suitable for review.',
  'Do not add placeholders for missing facts unless the context explicitly says information is missing.',
].join('\n')

export function buildReportPrompt(input: ReportGenerationInput): string {
  const transcriptLikeContext = buildReportContext({
    templateName: input.templateName,
    approvedSnippets: input.approvedSnippets,
    clientKnowledge: input.clientKnowledge,
  })

  return [
    '[GENERATE_REPORT_PROMPT]',
    reportInstructions,
    `Template name: ${input.templateName}`,
    '',
    'Report context:',
    transcriptLikeContext,
    '[/GENERATE_REPORT_PROMPT]',
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}
