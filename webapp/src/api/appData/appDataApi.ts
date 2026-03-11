import { callSecureApi } from '../secureApi'
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
  return normalized
}

