import { buildClientKnowledge } from '../snippets/buildClientKnowledge'
import { extractInputSnippets } from '../snippets/extractInputSnippets'
import { classifySnippetType } from '../snippets/classifySnippetType'
import { generateReport } from '../reports/generateReport'
import { generateInputSummary } from '../summaries/generateInputSummaryFromTranscript'
import { normalizeTranscript } from '../transcription/normalizeTranscript'
import type { InputInput } from '../transcription/types'

export async function processInputInput(params: {
  sessionId: string
  clientId: string
  trajectoryId: string
  input: InputInput
  reportTemplateName?: string
}) {
  const transcript = await normalizeTranscript(params.input)
  const [summary, extractedSnippets] = await Promise.all([
    generateInputSummary({ transcript }),
    extractInputSnippets({
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
        selectedInputIds: [params.sessionId],
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

