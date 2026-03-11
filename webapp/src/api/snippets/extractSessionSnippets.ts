import { callSecureApi } from '../secureApi'
import type { Snippet } from '../../types/snippet'

type SnippetExtractResponse = { snippets?: Snippet[] }

export async function extractSessionSnippets(params: {
  sessionId: string
  clientId: string
  trajectoryId: string
  inputType?: string
  transcript: string
  sessionDate: number
}): Promise<Snippet[]> {
  const response = await callSecureApi<SnippetExtractResponse>('/ai/snippet-extract', {
    sourceSessionId: params.sessionId,
    clientId: params.clientId,
    trajectoryId: params.trajectoryId,
    sourceInputType: params.inputType,
    transcript: params.transcript,
    itemDate: params.sessionDate,
  })
  return Array.isArray(response?.snippets) ? response.snippets : []
}
