import { callSecureApi } from '../core/secureApi'
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
} from '../../storage/types'

type RemoteWorkspaceData = Partial<{
  clients: any[]
  coachees: any[]
  trajectories: any[]
  sessions: any[]
  reports: any[]
  writtenReports: any[]
  activities: any[]
  activityTemplates: any[]
  snippets: any[]
  notes: any[]
  templates: any[]
  practiceSettings: any
}>

function normalizeSessionKind(value: unknown): Session['kind'] {
  const normalized = String(value || '').trim()
  if (normalized === 'upload' || normalized === 'uploaded_audio') return 'upload'
  if (normalized === 'written' || normalized === 'written_recap' || normalized === 'notes') return 'written'
  if (normalized === 'intake') return 'intake'
  return 'recording'
}

function normalizeRemoteSessions(rawSessions: any[]): Session[] {
  return rawSessions.map((session) => ({
    id: String(session?.id || ''),
    coacheeId: session?.coacheeId ?? session?.clientId ?? null,
    trajectoryId: session?.trajectoryId ?? null,
    title: String(session?.title || ''),
    createdAtUnixMs: Number(session?.createdAtUnixMs || 0),
    updatedAtUnixMs: Number(session?.updatedAtUnixMs || 0),
    kind: normalizeSessionKind(session?.kind ?? session?.inputType),
    audioBlobId: session?.audioBlobId ?? session?.audioUploadId ?? null,
    audioDurationSeconds:
      typeof session?.audioDurationSeconds === 'number' && Number.isFinite(session.audioDurationSeconds)
        ? session.audioDurationSeconds
        : null,
    uploadFileName: session?.uploadFileName ?? null,
    transcript: session?.transcript ?? session?.transcriptText ?? null,
    summary: session?.summary ?? session?.summaryText ?? null,
    summaryStructured: session?.summaryStructured ?? null,
    reportDate: session?.reportDate ?? null,
    wvpWeekNumber: session?.wvpWeekNumber ?? null,
    reportFirstSickDay: session?.reportFirstSickDay ?? session?.firstSickDay ?? null,
    transcriptionStatus: session?.transcriptionStatus ?? 'idle',
    transcriptionError: session?.transcriptionError ?? null,
  }))
}

function normalizeRemoteSnippets(rawSnippets: any[]): Snippet[] {
  return rawSnippets.map((snippet) => ({
    id: String(snippet?.id || ''),
    trajectoryId: String(snippet?.trajectoryId || ''),
    itemId: String(snippet?.itemId ?? snippet?.sourceSessionId ?? ''),
    field: String(snippet?.field ?? snippet?.snippetType ?? ''),
    text: String(snippet?.text || ''),
    date: Number(snippet?.date ?? snippet?.snippetDate ?? 0),
    status: (snippet?.status ?? snippet?.approvalStatus ?? 'pending') as Snippet['status'],
    createdAtUnixMs: Number(snippet?.createdAtUnixMs || 0),
    updatedAtUnixMs: Number(snippet?.updatedAtUnixMs || 0),
  }))
}

function normalizeRemoteWrittenReports(rawReports: any[]): WrittenReport[] {
  return rawReports
    .map((report) => {
      const sessionId = String(report?.sessionId ?? report?.sourceSessionId ?? '').trim()
      if (!sessionId) return null
      return {
        sessionId,
        text: String(report?.text ?? report?.reportText ?? ''),
        updatedAtUnixMs: Number(report?.updatedAtUnixMs || report?.createdAtUnixMs || 0),
      } satisfies WrittenReport
    })
    .filter((item): item is WrittenReport => Boolean(item))
}

export async function readAppData(): Promise<LocalAppData> {
  const response = await callSecureApi<RemoteWorkspaceData>('/app-data', {})
  const coachees = Array.isArray(response.coachees)
    ? response.coachees
    : Array.isArray(response.clients)
      ? response.clients
      : []
  const sessions = normalizeRemoteSessions(Array.isArray(response.sessions) ? response.sessions : [])
  const snippets = normalizeRemoteSnippets(Array.isArray(response.snippets) ? response.snippets : [])
  const writtenReports = normalizeRemoteWrittenReports(
    Array.isArray(response.writtenReports) ? response.writtenReports : Array.isArray(response.reports) ? response.reports : [],
  )
  const normalized: LocalAppData = {
    coachees: coachees as Coachee[],
    trajectories: (Array.isArray(response.trajectories) ? response.trajectories : []) as Trajectory[],
    sessions,
    activities: (Array.isArray(response.activities) ? response.activities : []) as Activity[],
    activityTemplates: (Array.isArray(response.activityTemplates) ? response.activityTemplates : []) as ActivityTemplate[],
    snippets,
    notes: (Array.isArray(response.notes) ? response.notes : []) as Note[],
    writtenReports,
    templates: (Array.isArray(response.templates) ? response.templates : []) as Template[],
    practiceSettings:
      (response.practiceSettings as LocalAppData['practiceSettings']) ?? {
        practiceName: '',
        website: '',
        visitAddress: '',
        postalAddress: '',
        postalCodeCity: '',
        contactName: '',
        contactRole: '',
        contactPhone: '',
        contactEmail: '',
        tintColor: '#BE0165',
        logoDataUrl: null,
        updatedAtUnixMs: 0,
      },
  }
  console.log('[APPDATA_READ_RESPONSE]', {
    sessionsWithSummaryStructuredCount: (normalized.sessions || []).filter((session) => {
      const value = (session as any).summaryStructured
      if (!value || typeof value !== 'object') return false
      return Object.values(value as Record<string, unknown>).some((field) => String(field || '').trim().length > 0)
    }).length,
  })
  return normalized
}

export async function createCoacheeRemote(coachee: Coachee): Promise<void> {
  await callSecureApi('/clients/create', { client: coachee })
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
  await callSecureApi('/clients/update', params)
}

export async function deleteCoacheeRemote(id: string): Promise<void> {
  await callSecureApi('/clients/delete', { id })
}

export async function createSessionRemote(session: Session): Promise<void> {
  await callSecureApi('/sessions/create', {
    session: {
      ...session,
      clientId: session.coacheeId,
      inputType: session.kind,
      audioUploadId: session.audioBlobId,
      transcriptText: session.transcript,
      summaryText: session.summary,
    },
  })
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
  await callSecureApi('/sessions/update', {
    ...params,
    clientId: params.coacheeId,
    inputType: params.kind,
    audioUploadId: params.audioBlobId,
    transcriptText: params.transcript,
    summaryText: params.summary,
  })
}

export async function deleteSessionRemote(id: string): Promise<void> {
  await callSecureApi('/sessions/delete', { id })
}

export async function createTrajectoryRemote(trajectory: Trajectory): Promise<void> {
  await callSecureApi('/trajectories/create', {
    trajectory: {
      ...trajectory,
      clientId: trajectory.coacheeId,
      serviceType: trajectory.dienstType,
      planOfAction: trajectory.planVanAanpak,
    },
  })
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
  await callSecureApi('/trajectories/update', {
    ...params,
    clientId: params.coacheeId,
    serviceType: params.dienstType,
    planOfAction: params.planVanAanpak,
  })
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

