import { createDefaultLocalAppData } from './defaultData'
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import { Activity, ActivityTemplate, Coachee, LocalAppData, Note, Session, Snippet, SnippetStatus, Template, Trajectory, WrittenReport } from './types'
import { inferTemplateCategoryFromName } from '../content/templateCategories'

const storageKey = 'coachscribe.localAppData.v3'
const previousStorageKey = 'coachscribe.localAppData.v2'

const mockCoacheeNames = new Set(['Sanne Jansen', 'Mark de Vries', 'Fatima El Amrani', 'Tom van Dijk', 'Jonas Kroon', 'Levi Leijenhorst', 'Gary Kasparov'])
const mockSessionTitles = new Set([
  'Sessie #3 (naamloos)',
  'Sessie #2 (naamloos)',
  'Sessie #1 (naamloos)',
  'Verslag #1 (naamloos)',
  'Intakegesprek',
  'Test',
])

function isMockLocalData(data: LocalAppData) {
  if (data.coachees.some((coachee) => mockCoacheeNames.has(coachee.name))) return true
  if (data.sessions.some((session) => mockSessionTitles.has(session.title))) return true
  return false
}

export function loadLocalAppData(): LocalAppData {
  const stored = readJsonFromLocalStorage<LocalAppData>(storageKey)
  if (stored.ok) {
    if (!isMockLocalData(stored.value)) return normalizeLocalAppData(stored.value)
  }
  const previous = readJsonFromLocalStorage<LocalAppData>(previousStorageKey)
  if (previous.ok && !isMockLocalData(previous.value)) {
    const migrated = normalizeLocalAppData(previous.value)
    writeJsonToLocalStorage(storageKey, migrated)
    return migrated
  }
  const initial = createDefaultLocalAppData()
  writeJsonToLocalStorage(storageKey, initial)
  return initial
}

export function saveLocalAppData(data: LocalAppData) {
  writeJsonToLocalStorage(storageKey, data)
}

function normalizeLocalAppData(data: LocalAppData): LocalAppData {
  const fallback = createDefaultLocalAppData()
  const coachees = Array.isArray(data.coachees)
    ? data.coachees.map((coachee) => ({
        ...coachee,
        clientDetails: typeof (coachee as any).clientDetails === 'string' ? (coachee as any).clientDetails : '',
        employerDetails: typeof (coachee as any).employerDetails === 'string' ? (coachee as any).employerDetails : '',
        firstSickDay: typeof (coachee as any).firstSickDay === 'string' ? (coachee as any).firstSickDay : '',
      }))
    : fallback.coachees
  const normalizedTrajectoriesFromInput = Array.isArray((data as any).trajectories) ? ((data as any).trajectories as any[]) : []
  const trajectories: Trajectory[] = normalizedTrajectoriesFromInput
    .map((trajectory) => {
      const coacheeId = typeof trajectory?.coacheeId === 'string' ? trajectory.coacheeId.trim() : ''
      if (!coacheeId) return null
      const now = Date.now()
      return {
        id: typeof trajectory?.id === 'string' && trajectory.id.trim() ? trajectory.id : defaultTrajectoryIdForCoachee(coacheeId),
        coacheeId,
        name: typeof trajectory?.name === 'string' && trajectory.name.trim() ? trajectory.name.trim() : 'Default',
        dienstType: typeof trajectory?.dienstType === 'string' && trajectory.dienstType.trim() ? trajectory.dienstType.trim() : 'Werkfit maken',
        uwvContactName: typeof trajectory?.uwvContactName === 'string' ? trajectory.uwvContactName : null,
        uwvContactPhone: typeof trajectory?.uwvContactPhone === 'string' ? trajectory.uwvContactPhone : null,
        uwvContactEmail: typeof trajectory?.uwvContactEmail === 'string' ? trajectory.uwvContactEmail : null,
        orderNumber: typeof trajectory?.orderNumber === 'string' ? trajectory.orderNumber : null,
        startDate: typeof trajectory?.startDate === 'string' ? trajectory.startDate : null,
        planVanAanpak:
          trajectory?.planVanAanpak && typeof trajectory.planVanAanpak === 'object' && typeof trajectory.planVanAanpak.documentId === 'string'
            ? { documentId: trajectory.planVanAanpak.documentId }
            : null,
        maxHours: Number.isFinite(trajectory?.maxHours) ? Number(trajectory.maxHours) : 41,
        maxAdminHours: Number.isFinite(trajectory?.maxAdminHours) ? Number(trajectory.maxAdminHours) : 3,
        createdAtUnixMs: Number.isFinite(trajectory?.createdAtUnixMs) ? Number(trajectory.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(trajectory?.updatedAtUnixMs) ? Number(trajectory.updatedAtUnixMs) : now,
      } satisfies Trajectory
    })
    .filter((trajectory): trajectory is Trajectory => Boolean(trajectory))

  const trajectoryByCoacheeId = new Map<string, Trajectory>()
  for (const trajectory of trajectories) {
    if (!trajectoryByCoacheeId.has(trajectory.coacheeId)) {
      trajectoryByCoacheeId.set(trajectory.coacheeId, trajectory)
    }
  }
  for (const coachee of coachees) {
    if (trajectoryByCoacheeId.has(coachee.id)) continue
    const id = defaultTrajectoryIdForCoachee(coachee.id)
    const defaultTrajectory: Trajectory = {
      id,
      coacheeId: coachee.id,
      name: 'Default',
      dienstType: 'Werkfit maken',
      uwvContactName: null,
      uwvContactPhone: null,
      uwvContactEmail: null,
      orderNumber: null,
      startDate: null,
      planVanAanpak: null,
      maxHours: 41,
      maxAdminHours: 3,
      createdAtUnixMs: coachee.createdAtUnixMs,
      updatedAtUnixMs: coachee.updatedAtUnixMs,
    }
    trajectories.unshift(defaultTrajectory)
    trajectoryByCoacheeId.set(coachee.id, defaultTrajectory)
  }

  const sessions = Array.isArray(data.sessions)
    ? data.sessions.map((session) => ({
        ...session,
        trajectoryId:
          typeof (session as any).trajectoryId === 'string'
            ? (session as any).trajectoryId
            : typeof (session as any).coacheeId === 'string' && trajectoryByCoacheeId.get((session as any).coacheeId)
              ? trajectoryByCoacheeId.get((session as any).coacheeId)?.id ?? null
              : null,
        kind:
          (session as any).kind === 'recording' ||
          (session as any).kind === 'upload' ||
          (session as any).kind === 'written' ||
          (session as any).kind === 'notes' ||
          (session as any).kind === 'intake'
            ? (session as any).kind
            : 'written',
        reportDate: typeof (session as any).reportDate === 'string' ? (session as any).reportDate : null,
        wvpWeekNumber: typeof (session as any).wvpWeekNumber === 'string' ? (session as any).wvpWeekNumber : null,
        reportFirstSickDay: typeof (session as any).reportFirstSickDay === 'string' ? (session as any).reportFirstSickDay : null,
        summaryStructured:
          (session as any).summaryStructured && typeof (session as any).summaryStructured === 'object'
            ? {
                doelstelling: String((session as any).summaryStructured.doelstelling || ''),
                belastbaarheid: String((session as any).summaryStructured.belastbaarheid || ''),
                belemmeringen: String((session as any).summaryStructured.belemmeringen || ''),
                voortgang: String((session as any).summaryStructured.voortgang || ''),
                arbeidsmarktorientatie: String((session as any).summaryStructured.arbeidsmarktorientatie || ''),
              }
            : null,
      }))
    : fallback.sessions
  const notes = Array.isArray(data.notes)
    ? data.notes.map((n) => ({
        ...n,
        title: typeof (n as any).title === "string" ? (n as any).title : "",
      }))
    : fallback.notes
  const activities: Activity[] = Array.isArray((data as any).activities)
    ? ((data as any).activities as any[]).map((activity) => ({
        id: String(activity?.id || ''),
        trajectoryId: String(activity?.trajectoryId || ''),
        sessionId: typeof activity?.sessionId === 'string' ? activity.sessionId : null,
        templateId: typeof activity?.templateId === 'string' ? activity.templateId : null,
        name: String(activity?.name || ''),
        category: String(activity?.category || ''),
        status: (activity?.status === 'executed' ? 'executed' : 'planned') as Activity['status'],
        plannedHours: Number.isFinite(activity?.plannedHours) ? Number(activity.plannedHours) : null,
        actualHours: Number.isFinite(activity?.actualHours) ? Number(activity.actualHours) : null,
        source: (activity?.source === 'ai_detected' ? 'ai_detected' : 'manual') as Activity['source'],
        isAdmin: typeof activity?.isAdmin === 'boolean' ? activity.isAdmin : false,
        createdAtUnixMs: Number.isFinite(activity?.createdAtUnixMs) ? Number(activity.createdAtUnixMs) : 0,
        updatedAtUnixMs: Number.isFinite(activity?.updatedAtUnixMs) ? Number(activity.updatedAtUnixMs) : 0,
      }))
      .filter((activity) => activity.id && activity.trajectoryId && activity.name)
    : fallback.activities

  const activityTemplates: ActivityTemplate[] = Array.isArray((data as any).activityTemplates)
      ? ((data as any).activityTemplates as any[]).map((template) => ({
        id: String(template?.id || ''),
        name: String(template?.name || ''),
        description: typeof template?.description === 'string' ? template.description : '',
        category: String(template?.category || ''),
        defaultHours: Number.isFinite(template?.defaultHours) ? Number(template.defaultHours) : 0,
        isAdmin: typeof template?.isAdmin === 'boolean' ? template.isAdmin : false,
        organizationId: typeof template?.organizationId === 'string' ? template.organizationId : null,
        isActive: typeof template?.isActive === 'boolean' ? template.isActive : true,
        createdAtUnixMs: Number.isFinite(template?.createdAtUnixMs) ? Number(template.createdAtUnixMs) : 0,
        updatedAtUnixMs: Number.isFinite(template?.updatedAtUnixMs) ? Number(template.updatedAtUnixMs) : 0,
      }))
      .filter((template) => template.id && template.name && template.category)
    : fallback.activityTemplates

  const snippets: Snippet[] = Array.isArray((data as any).snippets)
    ? ((data as any).snippets as any[])
      .map((snippet) => {
        const status = snippet?.status === 'approved' || snippet?.status === 'rejected' ? snippet.status : 'pending'
        return {
          id: String(snippet?.id || ''),
          trajectoryId: String(snippet?.trajectoryId || ''),
          itemId: String(snippet?.itemId || ''),
          field: String(snippet?.field || ''),
          text: String(snippet?.text || ''),
          date: Number.isFinite(snippet?.date) ? Number(snippet.date) : 0,
          status: status as SnippetStatus,
          createdAtUnixMs: Number.isFinite(snippet?.createdAtUnixMs) ? Number(snippet.createdAtUnixMs) : 0,
          updatedAtUnixMs: Number.isFinite(snippet?.updatedAtUnixMs) ? Number(snippet.updatedAtUnixMs) : 0,
        } satisfies Snippet
      })
      .filter((snippet) => snippet.id && snippet.trajectoryId && snippet.itemId && snippet.field)
    : fallback.snippets

  return {
    ...data,
    coachees,
    trajectories,
    sessions,
    activities,
    activityTemplates,
    snippets,
    notes,
    templates: Array.isArray(data.templates)
      ? data.templates.map((template) => ({
          ...template,
          category:
            (template as any).category === 'gespreksverslag' || (template as any).category === 'ander-verslag'
              ? (template as any).category
              : inferTemplateCategoryFromName(String((template as any).name || '')),
          description: typeof (template as any).description === 'string' ? (template as any).description : '',
          isDefault: typeof (template as any).isDefault === 'boolean' ? (template as any).isDefault : false,
        }))
      : fallback.templates,
    practiceSettings: data.practiceSettings
      ? {
          practiceName: typeof data.practiceSettings.practiceName === 'string' ? data.practiceSettings.practiceName : '',
          website: typeof data.practiceSettings.website === 'string' ? data.practiceSettings.website : '',
          visitAddress: typeof data.practiceSettings.visitAddress === 'string' ? data.practiceSettings.visitAddress : '',
          postalAddress: typeof data.practiceSettings.postalAddress === 'string' ? data.practiceSettings.postalAddress : '',
          postalCodeCity: typeof data.practiceSettings.postalCodeCity === 'string' ? data.practiceSettings.postalCodeCity : '',
          contactName: typeof data.practiceSettings.contactName === 'string' ? data.practiceSettings.contactName : '',
          contactRole: typeof data.practiceSettings.contactRole === 'string' ? data.practiceSettings.contactRole : '',
          contactPhone: typeof data.practiceSettings.contactPhone === 'string' ? data.practiceSettings.contactPhone : '',
          contactEmail: typeof data.practiceSettings.contactEmail === 'string' ? data.practiceSettings.contactEmail : '',
          tintColor: typeof data.practiceSettings.tintColor === 'string' ? data.practiceSettings.tintColor : '#BE0165',
          logoDataUrl: typeof data.practiceSettings.logoDataUrl === 'string' ? data.practiceSettings.logoDataUrl : null,
          updatedAtUnixMs: Number.isFinite(data.practiceSettings.updatedAtUnixMs) ? Number(data.practiceSettings.updatedAtUnixMs) : 0,
        }
      : fallback.practiceSettings,
  }
}

function defaultTrajectoryIdForCoachee(coacheeId: string): string {
  return `trajectory_default_${String(coacheeId || '').trim()}`
}

export function createCoachee(data: LocalAppData, coachee: Coachee): LocalAppData {
  return { ...data, coachees: [coachee, ...data.coachees] }
}

export function updateCoacheeName(data: LocalAppData, coacheeId: string, name: string): LocalAppData {
  const trimmedName = name.trim()
  if (!trimmedName) return data
  return { ...data, coachees: data.coachees.map((c) => (c.id === coacheeId ? { ...c, name: trimmedName } : c)) }
}

export function updateCoachee(
  data: LocalAppData,
  coacheeId: string,
  values: { name?: string; clientDetails?: string; employerDetails?: string; firstSickDay?: string },
): LocalAppData {
  return {
    ...data,
    coachees: data.coachees.map((coachee) => {
      if (coachee.id !== coacheeId) return coachee
      return {
        ...coachee,
        ...(values.name !== undefined ? { name: values.name.trim() } : {}),
        ...(values.clientDetails !== undefined ? { clientDetails: values.clientDetails.trim() } : {}),
        ...(values.employerDetails !== undefined ? { employerDetails: values.employerDetails.trim() } : {}),
        ...(values.firstSickDay !== undefined ? { firstSickDay: values.firstSickDay.trim() } : {}),
      }
    }),
  }
}

export function archiveCoachee(data: LocalAppData, coacheeId: string): LocalAppData {
  return { ...data, coachees: data.coachees.map((c) => (c.id === coacheeId ? { ...c, isArchived: true } : c)) }
}

export function restoreCoachee(data: LocalAppData, coacheeId: string): LocalAppData {
  return { ...data, coachees: data.coachees.map((c) => (c.id === coacheeId ? { ...c, isArchived: false } : c)) }
}

export function deleteCoachee(data: LocalAppData, coacheeId: string): LocalAppData {
  const remainingCoachees = data.coachees.filter((c) => c.id !== coacheeId)
  const removedTrajectoryIds = new Set(data.trajectories.filter((trajectory) => trajectory.coacheeId === coacheeId).map((trajectory) => trajectory.id))
  const remainingTrajectories = data.trajectories.filter((trajectory) => trajectory.coacheeId !== coacheeId)
  const remainingSessions = data.sessions.filter((s) => s.coacheeId !== coacheeId)
  const remainingSessionIds = new Set(remainingSessions.map((session) => session.id))
  const remainingActivities = data.activities.filter((activity) => !removedTrajectoryIds.has(activity.trajectoryId))
  const remainingSnippets = data.snippets.filter(
    (snippet) => !removedTrajectoryIds.has(snippet.trajectoryId) && remainingSessionIds.has(snippet.itemId),
  )
  const remainingNotes = data.notes.filter((n) => remainingSessions.some((s) => s.id === n.sessionId))
  const remainingWrittenReports = data.writtenReports.filter((r) => remainingSessions.some((s) => s.id === r.sessionId))
  return {
    ...data,
    coachees: remainingCoachees,
    trajectories: remainingTrajectories,
    sessions: remainingSessions,
    activities: remainingActivities,
    snippets: remainingSnippets,
    activityTemplates: data.activityTemplates,
    notes: remainingNotes,
    writtenReports: remainingWrittenReports,
  }
}

export function createSession(data: LocalAppData, session: Session): { data: LocalAppData; sessionId: string } {
  return { data: { ...data, sessions: [session, ...data.sessions] }, sessionId: session.id }
}

export function createTrajectory(data: LocalAppData, trajectory: Trajectory): { data: LocalAppData; trajectoryId: string } {
  return { data: { ...data, trajectories: [trajectory, ...data.trajectories] }, trajectoryId: trajectory.id }
}

export function updateTrajectory(
  data: LocalAppData,
  trajectoryId: string,
  values: {
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
    updatedAtUnixMs?: number
  },
): LocalAppData {
  const updatedAtUnixMs = values.updatedAtUnixMs ?? Date.now()
  return {
    ...data,
    trajectories: data.trajectories.map((trajectory) => {
      if (trajectory.id !== trajectoryId) return trajectory
      return {
        ...trajectory,
        ...(values.coacheeId !== undefined ? { coacheeId: values.coacheeId } : {}),
        ...(values.name !== undefined ? { name: values.name.trim() } : {}),
        ...(values.dienstType !== undefined ? { dienstType: values.dienstType.trim() } : {}),
        ...(values.uwvContactName !== undefined ? { uwvContactName: values.uwvContactName } : {}),
        ...(values.uwvContactPhone !== undefined ? { uwvContactPhone: values.uwvContactPhone } : {}),
        ...(values.uwvContactEmail !== undefined ? { uwvContactEmail: values.uwvContactEmail } : {}),
        ...(values.orderNumber !== undefined ? { orderNumber: values.orderNumber } : {}),
        ...(values.startDate !== undefined ? { startDate: values.startDate } : {}),
        ...(values.planVanAanpak !== undefined ? { planVanAanpak: values.planVanAanpak } : {}),
        ...(values.maxHours !== undefined ? { maxHours: values.maxHours } : {}),
        ...(values.maxAdminHours !== undefined ? { maxAdminHours: values.maxAdminHours } : {}),
        updatedAtUnixMs,
      }
    }),
  }
}

export function deleteTrajectory(data: LocalAppData, trajectoryId: string): LocalAppData {
  return {
    ...data,
    trajectories: data.trajectories.filter((trajectory) => trajectory.id !== trajectoryId),
    sessions: data.sessions.map((session) => (session.trajectoryId === trajectoryId ? { ...session, trajectoryId: null } : session)),
    activities: data.activities.filter((activity) => activity.trajectoryId !== trajectoryId),
    snippets: data.snippets.filter((snippet) => snippet.trajectoryId !== trajectoryId),
  }
}

export function createActivityTemplate(
  data: LocalAppData,
  template: ActivityTemplate,
): { data: LocalAppData; templateId: string } {
  return { data: { ...data, activityTemplates: [template, ...data.activityTemplates] }, templateId: template.id }
}

export function updateActivityTemplate(
  data: LocalAppData,
  templateId: string,
  values: {
    name?: string
    description?: string
    category?: string
    defaultHours?: number
    isAdmin?: boolean
    organizationId?: string | null
    isActive?: boolean
    updatedAtUnixMs?: number
  },
): LocalAppData {
  const updatedAtUnixMs = values.updatedAtUnixMs ?? Date.now()
  return {
    ...data,
    activityTemplates: data.activityTemplates.map((template) => {
      if (template.id !== templateId) return template
      return {
        ...template,
        ...(values.name !== undefined ? { name: values.name.trim() } : {}),
        ...(values.description !== undefined ? { description: values.description.trim() } : {}),
        ...(values.category !== undefined ? { category: values.category.trim() } : {}),
        ...(values.defaultHours !== undefined ? { defaultHours: values.defaultHours } : {}),
        ...(values.isAdmin !== undefined ? { isAdmin: values.isAdmin } : {}),
        ...(values.organizationId !== undefined ? { organizationId: values.organizationId } : {}),
        ...(values.isActive !== undefined ? { isActive: values.isActive } : {}),
        updatedAtUnixMs,
      }
    }),
  }
}

export function deleteActivityTemplate(data: LocalAppData, templateId: string): LocalAppData {
  return {
    ...data,
    activityTemplates: data.activityTemplates.filter((template) => template.id !== templateId),
    activities: data.activities.map((activity) => (activity.templateId === templateId ? { ...activity, templateId: null } : activity)),
  }
}

export function createActivity(data: LocalAppData, activity: Activity): { data: LocalAppData; activityId: string } {
  return { data: { ...data, activities: [activity, ...data.activities] }, activityId: activity.id }
}

export function updateActivity(
  data: LocalAppData,
  activityId: string,
  values: {
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
    updatedAtUnixMs?: number
  },
): LocalAppData {
  const updatedAtUnixMs = values.updatedAtUnixMs ?? Date.now()
  return {
    ...data,
    activities: data.activities.map((activity) => {
      if (activity.id !== activityId) return activity
      return {
        ...activity,
        ...(values.trajectoryId !== undefined ? { trajectoryId: values.trajectoryId } : {}),
        ...(values.sessionId !== undefined ? { sessionId: values.sessionId } : {}),
        ...(values.templateId !== undefined ? { templateId: values.templateId } : {}),
        ...(values.name !== undefined ? { name: values.name.trim() } : {}),
        ...(values.category !== undefined ? { category: values.category.trim() } : {}),
        ...(values.status !== undefined ? { status: values.status } : {}),
        ...(values.plannedHours !== undefined ? { plannedHours: values.plannedHours } : {}),
        ...(values.actualHours !== undefined ? { actualHours: values.actualHours } : {}),
        ...(values.source !== undefined ? { source: values.source } : {}),
        ...(values.isAdmin !== undefined ? { isAdmin: values.isAdmin } : {}),
        updatedAtUnixMs,
      }
    }),
  }
}

export function deleteActivity(data: LocalAppData, activityId: string): LocalAppData {
  return { ...data, activities: data.activities.filter((activity) => activity.id !== activityId) }
}

export function createSnippet(data: LocalAppData, snippet: Snippet): { data: LocalAppData; snippetId: string } {
  return { data: { ...data, snippets: [snippet, ...data.snippets] }, snippetId: snippet.id }
}

export function updateSnippet(
  data: LocalAppData,
  snippetId: string,
  values: {
    field?: string
    text?: string
    status?: SnippetStatus
    updatedAtUnixMs?: number
  },
): LocalAppData {
  const updatedAtUnixMs = values.updatedAtUnixMs ?? Date.now()
  return {
    ...data,
    snippets: data.snippets.map((snippet) => {
      if (snippet.id !== snippetId) return snippet
      return {
        ...snippet,
        ...(values.field !== undefined ? { field: values.field.trim() } : {}),
        ...(values.text !== undefined ? { text: values.text.trim() } : {}),
        ...(values.status !== undefined ? { status: values.status } : {}),
        updatedAtUnixMs,
      }
    }),
  }
}

export function deleteSnippet(data: LocalAppData, snippetId: string): LocalAppData {
  return { ...data, snippets: data.snippets.filter((snippet) => snippet.id !== snippetId) }
}

export function listSessionsForCoachee(data: LocalAppData, coacheeId: string): Session[] {
  return data.sessions.filter((s) => s.coacheeId === coacheeId).sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
}

export function updateSession(
  data: LocalAppData,
  sessionId: string,
  values: {
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
  }
): LocalAppData {
  const currentSession = data.sessions.find((session) => session.id === sessionId)
  if (!currentSession) return data

  const hasChanges =
    (values.coacheeId !== undefined && values.coacheeId !== currentSession.coacheeId) ||
    (values.trajectoryId !== undefined && values.trajectoryId !== currentSession.trajectoryId) ||
    (values.kind !== undefined && values.kind !== currentSession.kind) ||
    (values.title !== undefined && values.title.trim() !== currentSession.title) ||
    (values.createdAtUnixMs !== undefined && values.createdAtUnixMs !== currentSession.createdAtUnixMs) ||
    (values.audioBlobId !== undefined && values.audioBlobId !== currentSession.audioBlobId) ||
    (values.audioDurationSeconds !== undefined && values.audioDurationSeconds !== currentSession.audioDurationSeconds) ||
    (values.uploadFileName !== undefined && values.uploadFileName !== currentSession.uploadFileName) ||
    (values.transcript !== undefined && values.transcript !== currentSession.transcript) ||
    (values.summary !== undefined && values.summary !== currentSession.summary) ||
    (values.summaryStructured !== undefined &&
      JSON.stringify(values.summaryStructured) !== JSON.stringify(currentSession.summaryStructured)) ||
    (values.reportDate !== undefined && values.reportDate !== currentSession.reportDate) ||
    (values.wvpWeekNumber !== undefined && values.wvpWeekNumber !== currentSession.wvpWeekNumber) ||
    (values.reportFirstSickDay !== undefined && values.reportFirstSickDay !== currentSession.reportFirstSickDay) ||
    (values.transcriptionStatus !== undefined && values.transcriptionStatus !== currentSession.transcriptionStatus) ||
    (values.transcriptionError !== undefined && values.transcriptionError !== currentSession.transcriptionError)

  if (!hasChanges) return data

  const now = Date.now()
  return {
    ...data,
    sessions: data.sessions.map((s) => {
      if (s.id !== sessionId) return s
      return {
        ...s,
        ...(values.coacheeId !== undefined ? { coacheeId: values.coacheeId } : {}),
        ...(values.trajectoryId !== undefined ? { trajectoryId: values.trajectoryId } : {}),
        ...(values.kind !== undefined ? { kind: values.kind } : {}),
        ...(values.title !== undefined ? { title: values.title.trim() } : {}),
        ...(values.createdAtUnixMs !== undefined ? { createdAtUnixMs: values.createdAtUnixMs } : {}),
        ...(values.audioBlobId !== undefined ? { audioBlobId: values.audioBlobId } : {}),
        ...(values.audioDurationSeconds !== undefined ? { audioDurationSeconds: values.audioDurationSeconds } : {}),
        ...(values.uploadFileName !== undefined ? { uploadFileName: values.uploadFileName } : {}),
        ...(values.transcript !== undefined ? { transcript: values.transcript } : {}),
        ...(values.summary !== undefined ? { summary: values.summary } : {}),
        ...(values.summaryStructured !== undefined ? { summaryStructured: values.summaryStructured } : {}),
        ...(values.reportDate !== undefined ? { reportDate: values.reportDate } : {}),
        ...(values.wvpWeekNumber !== undefined ? { wvpWeekNumber: values.wvpWeekNumber } : {}),
        ...(values.reportFirstSickDay !== undefined ? { reportFirstSickDay: values.reportFirstSickDay } : {}),
        ...(values.transcriptionStatus !== undefined ? { transcriptionStatus: values.transcriptionStatus } : {}),
        ...(values.transcriptionError !== undefined ? { transcriptionError: values.transcriptionError } : {}),
        updatedAtUnixMs: now,
      }
    }),
  }
}

export function deleteSession(data: LocalAppData, sessionId: string): LocalAppData {
  const remainingSessions = data.sessions.filter((s) => s.id !== sessionId)
  const remainingActivities = data.activities.filter((activity) => activity.sessionId !== sessionId)
  const remainingSnippets = data.snippets.filter((snippet) => snippet.itemId !== sessionId)
  const remainingNotes = data.notes.filter((n) => n.sessionId !== sessionId)
  const remainingWrittenReports = data.writtenReports.filter((r) => r.sessionId !== sessionId)
  return {
    ...data,
    sessions: remainingSessions,
    activities: remainingActivities,
    snippets: remainingSnippets,
    notes: remainingNotes,
    writtenReports: remainingWrittenReports,
  }
}

export function listNotesForSession(data: LocalAppData, sessionId: string): Note[] {
  return data.notes.filter((n) => n.sessionId === sessionId).sort((a, b) => b.updatedAtUnixMs - a.updatedAtUnixMs)
}

export function createNote(data: LocalAppData, note: Note): { data: LocalAppData; noteId: string } {
  const noteWithTitle = { ...note, title: typeof note.title === "string" ? note.title : "" }
  return { data: { ...data, notes: [noteWithTitle, ...data.notes] }, noteId: note.id }
}

export function updateNote(
  data: LocalAppData,
  noteId: string,
  values: { title?: string; text: string },
): LocalAppData {
  const trimmedText = values.text.trim()
  if (!trimmedText) return data
  const now = Date.now()
  const title = typeof values.title === "string" ? values.title.trim() : ""
  return {
    ...data,
    notes: data.notes.map((n) =>
      n.id === noteId ? { ...n, title, text: trimmedText, updatedAtUnixMs: now } : n,
    ),
  }
}

export function deleteNote(data: LocalAppData, noteId: string): LocalAppData {
  return { ...data, notes: data.notes.filter((n) => n.id !== noteId) }
}

export function getWrittenReport(data: LocalAppData, sessionId: string): WrittenReport | null {
  return data.writtenReports.find((r) => r.sessionId === sessionId) ?? null
}

export function setWrittenReport(data: LocalAppData, sessionId: string, text: string): LocalAppData {
  const now = Date.now()
  const trimmedText = text.trim()
  const existing = data.writtenReports.find((report) => report.sessionId === sessionId)
  if (existing && existing.text.trim() === trimmedText) return data
  const nextReport: WrittenReport = { sessionId, text: trimmedText, updatedAtUnixMs: now }
  const without = data.writtenReports.filter((r) => r.sessionId !== sessionId)
  return { ...data, writtenReports: [nextReport, ...without] }
}

export function createTemplate(data: LocalAppData, template: Template): { data: LocalAppData; templateId: string } {
  return { data: { ...data, templates: [template, ...data.templates] }, templateId: template.id }
}

export function updateTemplate(
  data: LocalAppData,
  templateId: string,
  values: { name?: string; description?: string; sections?: Template['sections']; isSaved?: boolean; updatedAtUnixMs: number },
): LocalAppData {
  return {
    ...data,
    templates: data.templates.map((template) => {
      if (template.id !== templateId) return template
      return {
        ...template,
        ...(typeof values.name === 'string' ? { name: values.name.trim() } : {}),
        ...(typeof values.description === 'string' ? { description: values.description.trim() } : {}),
        ...(values.sections ? { sections: values.sections } : {}),
        ...(typeof values.isSaved === 'boolean' ? { isSaved: values.isSaved } : {}),
        updatedAtUnixMs: values.updatedAtUnixMs,
      }
    }),
  }
}

export function deleteTemplate(data: LocalAppData, templateId: string): LocalAppData {
  return { ...data, templates: data.templates.filter((template) => template.id !== templateId) }
}

export function updatePracticeSettings(
  data: LocalAppData,
  values: {
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
  },
): LocalAppData {
  return {
    ...data,
    practiceSettings: {
      ...data.practiceSettings,
      ...(values.practiceName !== undefined ? { practiceName: values.practiceName.trim() } : {}),
      ...(values.website !== undefined ? { website: values.website.trim() } : {}),
      ...(values.visitAddress !== undefined ? { visitAddress: values.visitAddress.trim() } : {}),
      ...(values.postalAddress !== undefined ? { postalAddress: values.postalAddress.trim() } : {}),
      ...(values.postalCodeCity !== undefined ? { postalCodeCity: values.postalCodeCity.trim() } : {}),
      ...(values.contactName !== undefined ? { contactName: values.contactName.trim() } : {}),
      ...(values.contactRole !== undefined ? { contactRole: values.contactRole.trim() } : {}),
      ...(values.contactPhone !== undefined ? { contactPhone: values.contactPhone.trim() } : {}),
      ...(values.contactEmail !== undefined ? { contactEmail: values.contactEmail.trim() } : {}),
      ...(values.tintColor !== undefined ? { tintColor: values.tintColor } : {}),
      ...(values.logoDataUrl !== undefined ? { logoDataUrl: values.logoDataUrl } : {}),
      updatedAtUnixMs: values.updatedAtUnixMs,
    },
  }
}
