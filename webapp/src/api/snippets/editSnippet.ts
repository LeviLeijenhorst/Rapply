import { callSecureApi } from '../secureApi'

type SnippetTextResponse = { text?: string }

export async function editSnippet(params: { field: string; snippetText: string; transcript: string }): Promise<string> {
  const response = await callSecureApi<SnippetTextResponse>('/snippet-edit', params)
  return String(response?.text || '').trim()
}
