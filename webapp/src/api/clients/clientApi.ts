import { callSecureApi } from '../secureApi'
import type { Coachee } from '../../storage/types'

export async function createClientRemote(client: Coachee): Promise<void> {
  await callSecureApi('/clients/create', { client })
}

export async function updateClientRemote(params: {
  id: string
  name?: string
  clientDetails?: string
  employerDetails?: string
  firstSickDay?: string
  isArchived?: boolean
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/clients/update', params)
}

export async function deleteClientRemote(id: string): Promise<void> {
  await callSecureApi('/clients/delete', { id })
}

export const createCoacheeRemote = createClientRemote
export const updateCoacheeRemote = updateClientRemote
export const deleteCoacheeRemote = deleteClientRemote

export const clientApi = {
  create: createClientRemote,
  update: updateClientRemote,
  delete: deleteClientRemote,
}
