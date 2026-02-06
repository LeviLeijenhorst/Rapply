import { callSecureApi } from './secureApi'

type GenerateSummaryResponse = {
  summary?: string
}

export async function generateSummary(params: { transcript: string; templateKey: string }): Promise<string> {
  const response = await callSecureApi<GenerateSummaryResponse>('/summary/generate', {
    transcript: params.transcript,
    template_key: params.templateKey,
  })

  const summary = String(response.summary || '').trim()
  if (!summary) {
    throw new Error('No summary returned')
  }
  return summary
}

