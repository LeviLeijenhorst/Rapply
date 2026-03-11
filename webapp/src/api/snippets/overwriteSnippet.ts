import { callSecureApi } from '../secureApi'

type SnippetTextResponse = { text?: string }

export async function overwriteSnippet(params: { field: string; transcript: string }): Promise<string> {
  const response = await callSecureApi<SnippetTextResponse>('/snippet-overwrite', params)
  return String(response?.text || '').trim()
}
