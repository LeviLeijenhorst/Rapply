import { buildClientKnowledge } from '../snippets/buildClientKnowledge'
import { approveSnippet } from '../snippets/approveSnippet'
import { extractSessionSnippets } from '../snippets/extractSessionSnippets'
import { generateSessionSummary } from '../summaries/generateSessionSummary'
import { normalizeInputToTranscript } from '../transcription/normalizeInputToTranscript'
import type { SessionInput } from '../transcription/transcriptionTypes'
import { generateReportDraft } from '../reports/generateReportDraft'

export async function processSessionInput(params: {
  sessionId: string
  clientId: string
  input: SessionInput
  reportTemplateName?: string
}) {
  const transcript = await normalizeInputToTranscript(params.input)
  const extractedSnippets = await extractSessionSnippets({
    sessionId: params.sessionId,
    clientId: params.clientId,
    transcript,
    sessionDate: Date.now(),
  })
  const summary = await generateSessionSummary({ transcript })
  const approvedSnippets = extractedSnippets.map(approveSnippet)
  const clientKnowledge = buildClientKnowledge(approvedSnippets)
  const reportDraft = params.reportTemplateName
    ? await generateReportDraft({
        clientId: params.clientId,
        templateName: params.reportTemplateName,
        selectedSessionIds: [params.sessionId],
        approvedSnippets,
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
