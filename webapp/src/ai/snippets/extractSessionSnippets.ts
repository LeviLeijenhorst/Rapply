import { callSecureApi } from '../../api/core/secureApi'
import type { Snippet } from '../../types/snippet'

type SnippetExtractResponse = { snippets?: Snippet[] }

export async function extractSessionSnippets(params: {
  sessionId: string
  clientId: string
  transcript: string
  sessionDate: number
}): Promise<Snippet[]> {
  const response = await callSecureApi<SnippetExtractResponse>('/snippet-extract', {
    itemId: params.sessionId,
    trajectoryId: params.clientId,
    transcript: params.transcript,
    itemDate: params.sessionDate,
  })
  return Array.isArray(response?.snippets) ? response.snippets : []
}
