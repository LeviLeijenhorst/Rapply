import { callSecureApi } from './secureApi'
import type {
  Activity,
  ActivityTemplate,
  Coachee,
  LocalAppData,
  Note,
  Session,
  Snippet,
  Template,
  Trajectory,
  WrittenReport,
} from '../storage/types'

export async function readAppData(): Promise<LocalAppData> {
  const response = await callSecureApi<LocalAppData>('/app-data', {})
  console.log('[APPDATA_READ_RESPONSE]', {
    sessionsWithSummaryStructuredCount: (response.sessions || []).filter((session) => {
      const value = (session as any).summaryStructured
      if (!value || typeof value !== 'object') return false
      return Object.values(value as Record<string, unknown>).some((field) => String(field || '').trim().length > 0)
    }).length,
  })
  return response
}

export async function createCoacheeRemote(coachee: Coachee): Promise<void> {
  await callSecureApi('/coachees/create', { coachee })
}

export async function updateCoacheeRemote(params: {
  id: string
  name?: string
  clientDetails?: string
  employerDetails?: string
  firstSickDay?: string
  isArchived?: boolean
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/coachees/update', params)
}

export async function deleteCoacheeRemote(id: string): Promise<void> {
  await callSecureApi('/coachees/delete', { id })
}

export async function createSessionRemote(session: Session): Promise<void> {
  await callSecureApi('/sessions/create', { session })
}

export async function updateSessionRemote(params: {
  id: string
  updatedAtUnixMs: number
  coacheeId?: string | null
  trajectoryId?: string | null
  kind?: Session['kind']
  title?: string
  createdAtUnixMs?: number
  audioBlobId?: string | null
  audioDurationSeconds?: number | null
  uploadFileName?: string | null
  transcript?: string | null
  summary?: string | null
  summaryStructured?: Session['summaryStructured']
  reportDate?: string | null
  wvpWeekNumber?: string | null
  reportFirstSickDay?: string | null
  transcriptionStatus?: Session['transcriptionStatus']
  transcriptionError?: string | null
}): Promise<void> {
  await callSecureApi('/sessions/update', params)
}

export async function deleteSessionRemote(id: string): Promise<void> {
  await callSecureApi('/sessions/delete', { id })
}

export async function createTrajectoryRemote(trajectory: Trajectory): Promise<void> {
  await callSecureApi('/trajectories/create', { trajectory })
}

export async function updateTrajectoryRemote(params: {
  id: string
  coacheeId?: string
  name?: string
  dienstType?: string
  uwvContactName?: string | null
  uwvContactPhone?: string | null
  uwvContactEmail?: string | null
  orderNumber?: string | null
  startDate?: string | null
  planVanAanpak?: Trajectory['planVanAanpak']
  maxHours?: number
  maxAdminHours?: number
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/trajectories/update', params)
}

export async function deleteTrajectoryRemote(id: string): Promise<void> {
  await callSecureApi('/trajectories/delete', { id })
}

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

export async function setWrittenReportRemote(report: WrittenReport): Promise<void> {
  await callSecureApi('/written-reports/set', { report })
}

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

export async function updatePracticeSettingsRemote(params: {
  practiceName?: string
  website?: string
  visitAddress?: string
  postalAddress?: string
  postalCodeCity?: string
  contactName?: string
  contactRole?: string
  contactPhone?: string
  contactEmail?: string
  tintColor?: string
  logoDataUrl?: string | null
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/practice-settings/update', params)
}
