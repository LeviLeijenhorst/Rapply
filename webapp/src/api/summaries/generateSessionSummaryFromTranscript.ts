import { generateInputSummary as requestSummary, type SummaryResponseMode } from './generateInputSummary'
import { parseStructuredSummaryJson, type StructuredInputSummary } from '../../types/structuredSummary'
import type { SummaryTemplate } from './summaryTemplate'

export async function generateInputSummary(params: {
  transcript: string
  template?: SummaryTemplate | null
  signal?: AbortSignal
  sourceInputType?: string
  sourceSessionId?: string
}): Promise<string> {
  return requestSummary({
    transcript: params.transcript,
    template: params.template ?? undefined,
    signal: params.signal,
    sourceInputType: params.sourceInputType,
    sourceSessionId: params.sourceSessionId,
  })
}

export async function generateStructuredInputSummary(params: {
  transcript: string
  template?: SummaryTemplate | null
  signal?: AbortSignal
  sourceInputType?: string
  sourceSessionId?: string
}): Promise<StructuredInputSummary> {
  const raw = await requestSummary({
    transcript: params.transcript,
    template: params.template ?? undefined,
    signal: params.signal,
    responseMode: 'structured_item_summary' satisfies SummaryResponseMode,
    sourceInputType: params.sourceInputType,
    sourceSessionId: params.sourceSessionId,
  })

  const parsed = parseStructuredSummaryJson(raw)
  if (!parsed) {
    throw new Error('No structured summary returned')
  }

  return parsed
}

