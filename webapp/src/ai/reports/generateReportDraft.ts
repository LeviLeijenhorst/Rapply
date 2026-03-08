import { generateSummary } from '../summaries/generateSessionSummary'
import { buildReportContext } from './buildReportContext'
import type { ReportGenerationInput } from './reportTypes'

export async function generateReportDraft(input: ReportGenerationInput): Promise<string> {
  const transcriptLikeContext = buildReportContext({
    templateName: input.templateName,
    approvedSnippets: input.approvedSnippets,
    clientKnowledge: input.clientKnowledge,
  })
  return generateSummary({
    transcript: transcriptLikeContext,
    template: { name: input.templateName, sections: [] },
  })
}
