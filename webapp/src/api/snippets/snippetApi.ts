import { callSecureApi } from '../secureApi'
import type { Snippet } from '../../storage/types'

export async function createSnippetRemote(snippet: Snippet): Promise<void> {
  await callSecureApi('/snippets/create', { snippet })
}

export async function updateSnippetRemote(params: {
  id: string
  field?: string
  text?: string
  status?: Snippet['status']
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/snippets/update', params)
}

export async function deleteSnippetRemote(id: string): Promise<void> {
  await callSecureApi('/snippets/delete', { id })
}

export const snippetApi = {
  create: createSnippetRemote,
  update: updateSnippetRemote,
  delete: deleteSnippetRemote,
}
