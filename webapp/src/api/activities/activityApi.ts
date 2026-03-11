import { callSecureApi } from '../secureApi'
import type { Activity } from '../../storage/types'

export async function createActivityRemote(activity: Activity): Promise<void> {
  await callSecureApi('/activities/create', { activity })
}

export async function updateActivityRemote(params: {
  id: string
  trajectoryId?: string
  sessionId?: string | null
  templateId?: string | null
  name?: string
  category?: string
  status?: Activity['status']
  plannedHours?: number | null
  actualHours?: number | null
  source?: Activity['source']
  isAdmin?: boolean
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/activities/update', params)
}

export async function deleteActivityRemote(id: string): Promise<void> {
  await callSecureApi('/activities/delete', { id })
}
