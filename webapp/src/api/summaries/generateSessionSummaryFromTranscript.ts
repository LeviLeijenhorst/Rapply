import { generateInputSummary as requestSummary, type SummaryResponseMode } from './generateInputSummary'
import { parseStructuredSummaryJson, type StructuredInputSummary } from '../../types/structuredSummary'
import { buildInputSummaryPrompt } from './buildInputSummaryPrompt'
import { resolveSummaryTemplateSections } from './resolveSummaryTemplateSections'
import type { SummaryTemplate } from './summaryTemplate'

export async function generateInputSummary(params: {
  transcript: string
  template?: SummaryTemplate | null
  signal?: AbortSignal
}): Promise<string> {
  return requestSummary({
    prompt: buildInputSummaryPrompt({
      transcript: params.transcript,
      template: params.template ? resolveSummaryTemplateSections(params.template) : undefined,
    }),
    signal: params.signal,
  })
}

export async function generateStructuredInputSummary(params: {
  transcript: string
  template?: SummaryTemplate | null
  signal?: AbortSignal
}): Promise<StructuredInputSummary> {
  const raw = await requestSummary({
    prompt: buildInputSummaryPrompt({
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

