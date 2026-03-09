import { buildClientKnowledge } from '../snippets/buildClientKnowledge'
import { extractSessionSnippets } from '../snippets/extractSessionSnippets'
import { classifySnippetType } from '../snippets/classifySnippetType'
import { generateReport } from '../reports/generateReport'
import { generateSessionSummary } from '../summaries/generateSessionSummaryFromTranscript'
import { normalizeTranscript } from '../transcription/normalizeTranscript'
import type { SessionInput } from '../transcription/types'

export async function processSessionInput(params: {
  sessionId: string
  clientId: string
  trajectoryId: string
  input: SessionInput
  reportTemplateName?: string
}) {
  const transcript = await normalizeTranscript(params.input)
  const [summary, extractedSnippets] = await Promise.all([
    generateSessionSummary({ transcript }),
    extractSessionSnippets({
      sessionId: params.sessionId,
      clientId: params.clientId,
      trajectoryId: params.trajectoryId,
      inputType: params.input.inputType,
      transcript,
      sessionDate: Date.now(),
    }),
  ])
  const approvedSnippets = extractedSnippets.filter((snippet) => snippet.status === 'approved')
  const reportRelevantSnippets = approvedSnippets.filter((snippet) => classifySnippetType(snippet.field) === 'report')
  const clientKnowledge = buildClientKnowledge(approvedSnippets)
  const reportDraft = params.reportTemplateName
    ? await generateReport({
        clientId: params.clientId,
        templateName: params.reportTemplateName,
        selectedSessionIds: [params.sessionId],
        approvedSnippets: reportRelevantSnippets,
        clientKnowledge,
      })
    : null

  return {
    transcript,
    summary,
    snippets: extractedSnippets,
    approvedSnippets,
    clientKnowledge,
    reportDraft,
  }
}
