import { callSecureApi } from '../secureApi'
import type { Note } from '../../storage/types'

export async function createNoteRemote(note: Note): Promise<void> {
  await callSecureApi('/notes/create', { note })
}

export async function updateNoteRemote(params: {
  id: string
  title?: string
  text: string
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/notes/update', params)
}

export async function deleteNoteRemote(id: string): Promise<void> {
  await callSecureApi('/notes/delete', { id })
}
