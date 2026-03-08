import { generateSummary } from '../../api/summary'

export async function generateSessionSummary(params: {
  transcript: string
  template?: { name: string; sections: { title: string; description: string }[] } | null
  signal?: AbortSignal
}): Promise<string> {
  return generateSummary({
    transcript: params.transcript,
    template: params.template ?? undefined,
    signal: params.signal,
  })
}

export { generateSessionSummary as generateStructuredSummary }
export { generateSummary }
