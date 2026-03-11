import { callSecureApi } from '../secureApi'
import type { Template } from '../../storage/types'

export async function createTemplateRemote(template: Template): Promise<void> {
  await callSecureApi('/templates/create', { template })
}

export async function updateTemplateRemote(template: Template): Promise<void> {
  await callSecureApi('/templates/update', { template })
}

export async function deleteTemplateRemote(id: string): Promise<void> {
  await callSecureApi('/templates/delete', { id })
}

export async function readDefaultTemplates(): Promise<{ templates: Template[] }> {
  return callSecureApi('/templates/defaults', {})
}
