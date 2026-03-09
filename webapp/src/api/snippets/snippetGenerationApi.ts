import { callSecureApi } from '../core/secureApi'
import type { Snippet } from '../../storage/types'

type SnippetExtractResponse = {
  snippets?: Snippet[]
}

type SnippetTextResponse = {
  text?: string
}

export async function extractSnippetsForItem(params: {
  itemId: string
  trajectoryId: string
  transcript: string
  itemDate: number
}): Promise<Snippet[]> {
  const response = await callSecureApi<SnippetExtractResponse>('/snippet-extract', {
    itemId: params.itemId,
    trajectoryId: params.trajectoryId,
    transcript: params.transcript,
    itemDate: params.itemDate,
  })
  return Array.isArray(response?.snippets) ? response.snippets : []
}

export async function aiEditSnippetText(params: {
  field: string
  snippetText: string
  transcript: string
}): Promise<string> {
  const response = await callSecureApi<SnippetTextResponse>('/snippet-edit', {
    field: params.field,
    snippetText: params.snippetText,
    transcript: params.transcript,
  })
  return String(response?.text || '').trim()
}

export async function aiOverwriteSnippetText(params: {
  field: string
  transcript: string
}): Promise<string> {
  const response = await callSecureApi<SnippetTextResponse>('/snippet-overwrite', {
    field: params.field,
    transcript: params.transcript,
  })
  return String(response?.text || '').trim()
}

