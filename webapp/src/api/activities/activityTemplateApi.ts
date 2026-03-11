import { callSecureApi } from '../secureApi'
import type { ActivityTemplate } from '../../storage/types'

export async function createActivityTemplateRemote(template: ActivityTemplate): Promise<void> {
  await callSecureApi('/activity-templates/create', { template })
}

export async function updateActivityTemplateRemote(params: {
  id: string
  name?: string
  description?: string
  category?: string
  defaultHours?: number
  isAdmin?: boolean
  organizationId?: string | null
  isActive?: boolean
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/activity-templates/update', params)
}

export async function deleteActivityTemplateRemote(id: string): Promise<void> {
  await callSecureApi('/activity-templates/delete', { id })
}
