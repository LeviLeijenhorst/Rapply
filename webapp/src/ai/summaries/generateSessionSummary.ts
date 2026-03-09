import { generateSessionSummary as requestSummary, type SummaryResponseMode } from '../../api/summaries/generateSessionSummary'
import { parseStructuredSummaryJson, type StructuredSessionSummary } from '../../types/structuredSummary'
import { buildSessionSummaryPrompt } from './buildSessionSummaryPrompt'
import { resolveSummaryTemplateSections } from './resolveSummaryTemplateSections'
import type { SummaryTemplate } from './summaryTemplate'

export async function generateSessionSummary(params: {
  transcript: string
  template?: SummaryTemplate | null
  signal?: AbortSignal
}): Promise<string> {
  return requestSummary({
    prompt: buildSessionSummaryPrompt({
      transcript: params.transcript,
      template: params.template ? resolveSummaryTemplateSections(params.template) : undefined,
    }),
    signal: params.signal,
  })
}

export async function generateStructuredSessionSummary(params: {
  transcript: string
  template?: SummaryTemplate | null
  signal?: AbortSignal
}): Promise<StructuredSessionSummary> {
  const raw = await requestSummary({
    prompt: buildSessionSummaryPrompt({
      transcript: params.transcript,
      template: params.template ? resolveSummaryTemplateSections(params.template) : undefined,
    }),
    signal: params.signal,
    responseMode: 'structured_item_summary' satisfies SummaryResponseMode,
  })

  const parsed = parseStructuredSummaryJson(raw)
  if (!parsed) {
    throw new Error('No structured summary returned')
  }

  return parsed
}
