import { callSecureApi } from '../secureApi'
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
  clientId?: string
  sourceInputType?: string
  transcript: string
  itemDate: number
}): Promise<Snippet[]> {
  const response = await callSecureApi<SnippetExtractResponse>('/ai/snippet-extract', {
    sourceSessionId: params.itemId,
    trajectoryId: params.trajectoryId,
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.sourceInputType ? { sourceInputType: params.sourceInputType } : {}),
    transcript: params.transcript,
    itemDate: params.itemDate,
  })
  return Array.isArray(response?.snippets) ? response.snippets : []
}

export async function extractSnippets(params: {
  inputId: string
  trajectoryId: string
  clientId?: string
  sourceInputType?: string
  transcript: string
  itemDate: number
}): Promise<Snippet[]> {
  return extractSnippetsForItem({
    itemId: params.inputId,
    trajectoryId: params.trajectoryId,
    clientId: params.clientId,
    sourceInputType: params.sourceInputType,
    transcript: params.transcript,
    itemDate: params.itemDate,
  })
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

