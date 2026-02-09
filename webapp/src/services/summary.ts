import { callSecureApi } from './secureApi'

type GenerateSummaryResponse = {
  summary?: string
}

type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

export async function generateSummary(params: { transcript: string; template?: SummaryTemplate }): Promise<string> {
  const response = await callSecureApi<GenerateSummaryResponse>('/summary/generate', {
    transcript: params.transcript,
    template: params.template,
  })

  const summary = String(response.summary || '').trim()
  if (!summary) {
    throw new Error('No summary returned')
  }
  return summary
}

