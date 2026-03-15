import { callSecureApi } from '../secureApi'
import type { Snippet } from '../../storage/types'

type SnippetExtractResponse = {
  snippets?: unknown[]
}

type SnippetTextResponse = {
  text?: string
}

type RemoteSnippet = {
  id?: unknown
  clientId?: unknown
  trajectoryId?: unknown
  sourceSessionId?: unknown
  sourceInputId?: unknown
  itemId?: unknown
  snippetType?: unknown
  field?: unknown
  text?: unknown
  snippetDate?: unknown
  date?: unknown
  approvalStatus?: unknown
  status?: unknown
  createdAtUnixMs?: unknown
  updatedAtUnixMs?: unknown
}

function normalizeExtractedSnippet(value: unknown): Snippet | null {
  const source = (value && typeof value === 'object' ? value : {}) as RemoteSnippet
  const id = String(source.id ?? '').trim()
  const trajectoryId = String(source.trajectoryId ?? '').trim()
  const inputId = String(source.sourceSessionId ?? source.sourceInputId ?? source.itemId ?? '').trim()
  const field = String(source.snippetType ?? source.field ?? '').trim()
  if (!id || !inputId || !field) return null

  const now = Date.now()
  const statusRaw = String(source.approvalStatus ?? source.status ?? '').trim()
  const status: Snippet['status'] = statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : 'pending'

  return {
    id,
    trajectoryId: trajectoryId || null,
    inputId,
    itemId: inputId,
    field,
    text: String(source.text ?? ''),
    date: Number.isFinite(Number(source.snippetDate)) ? Number(source.snippetDate) : Number.isFinite(Number(source.date)) ? Number(source.date) : now,
    status,
    createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
  }
}

export async function extractSnippetsForItem(params: {
  itemId: string
  trajectoryId?: string | null
  clientId?: string
  sourceInputType?: string
  transcript: string
  itemDate: number
}): Promise<Snippet[]> {
  const trajectoryId = String(params.trajectoryId ?? '').trim()
  const response = await callSecureApi<SnippetExtractResponse>('/ai/snippet-extract', {
    sourceSessionId: params.itemId,
    ...(trajectoryId ? { trajectoryId } : {}),
    ...(params.clientId ? { clientId: params.clientId } : {}),
    ...(params.sourceInputType ? { sourceInputType: params.sourceInputType } : {}),
    transcript: params.transcript,
    itemDate: params.itemDate,
  })
  if (!Array.isArray(response?.snippets)) return []
  return response.snippets
    .map(normalizeExtractedSnippet)
    .filter((snippet): snippet is Snippet => Boolean(snippet))
}

export async function extractSnippets(params: {
  inputId: string
  trajectoryId?: string | null
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


