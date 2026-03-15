import { callSecureApi } from '../secureApi'
import type { Client } from '../../storage/types'

export async function createClientRemote(client: Client): Promise<void> {
  await callSecureApi('/clients/create', { client })
}

export async function updateClientRemote(params: {
  id: string
  name?: string
  clientDetails?: string
  employerDetails?: string
  isArchived?: boolean
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/clients/update', params)
}

export async function deleteClientRemote(id: string): Promise<void> {
  await callSecureApi('/clients/delete', { id })
}

export type OrganizationCoach = {
  userId: string
  displayName: string | null
  email: string | null
  role: 'admin' | 'regular'
}

export type AssignedCoach = {
  userId: string
  displayName: string | null
  email: string | null
  role: string
}

export async function listAssignedCoachesRemote(clientId: string): Promise<AssignedCoach[]> {
  const response = await callSecureApi<{ coaches?: AssignedCoach[] }>('/clients/assigned-coaches', { clientId })
  return Array.isArray(response.coaches) ? response.coaches : []
}

export async function listOrganizationCoachesRemote(clientId: string): Promise<OrganizationCoach[]> {
  const response = await callSecureApi<{ coaches?: OrganizationCoach[] }>('/clients/organization-coaches', { clientId })
  return Array.isArray(response.coaches) ? response.coaches : []
}

export async function assignCoachToClientRemote(clientId: string, coachUserId: string): Promise<void> {
  await callSecureApi('/clients/assign-coach', { clientId, coachUserId, createdAtUnixMs: Date.now() })
}

export async function unassignCoachFromClientRemote(clientId: string, coachUserId: string): Promise<void> {
  await callSecureApi('/clients/unassign-coach', { clientId, coachUserId })
}

export async function updateClientPrimaryCoachRemote(clientId: string, coachUserId: string): Promise<void> {
  await callSecureApi('/clients/update-primary-coach', { clientId, coachUserId })
}

export const clientApi = {
  create: createClientRemote,
  update: updateClientRemote,
  delete: deleteClientRemote,
  listAssignedCoaches: listAssignedCoachesRemote,
  listOrganizationCoaches: listOrganizationCoachesRemote,
  assignCoach: assignCoachToClientRemote,
  unassignCoach: unassignCoachFromClientRemote,
  updatePrimaryCoach: updateClientPrimaryCoachRemote,
}
