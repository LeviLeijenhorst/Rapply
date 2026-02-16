import { callSecureApi } from './secureApi'

type GenerateSummaryResponse = {
  summary?: string
}

type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

const SUMMARY_TIMEOUT_MS = 5 * 60_000
const SUMMARY_MAX_RETRIES = 1

function isRetryableSummaryError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || '').toLowerCase()
  if (!message) return false
  return (
    message.includes('de server reageert niet op tijd') ||
    message.includes('kon geen verbinding maken met de server') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('api error: 5') ||
    message.includes('api error: 429') ||
    message.includes('timeout')
  )
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function generateSummary(params: { transcript: string; template?: SummaryTemplate; signal?: AbortSignal }): Promise<string> {
  let response: GenerateSummaryResponse | null = null
  for (let attempt = 0; attempt <= SUMMARY_MAX_RETRIES; attempt += 1) {
    try {
      response = await callSecureApi<GenerateSummaryResponse>(
        '/summary/generate',
        {
          transcript: params.transcript,
          template: params.template,
        },
        { signal: params.signal, timeoutMs: SUMMARY_TIMEOUT_MS },
      )
      break
    } catch (error) {
      if (params.signal?.aborted) throw error
      if (attempt >= SUMMARY_MAX_RETRIES || !isRetryableSummaryError(error)) throw error
      await wait(300 * (attempt + 1))
    }
  }
  if (!response) {
    throw new Error('No summary returned')
  }

  const summary = String(response.summary || '').trim()
  if (!summary) {
    throw new Error('No summary returned')
  }
  return summary
}
