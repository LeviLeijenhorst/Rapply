import { createDefaultLocalAppData } from './defaultData'
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import { Coachee, LocalAppData, Note, Session, SessionKind, Template, WrittenReport } from './types'
import { inferTemplateCategoryFromName } from '../utils/templateCategories'

const storageKey = 'coachscribe.localAppData.v2'

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
  const sessions = Array.isArray(data.sessions)
    ? data.sessions.map((session) => ({
        ...session,
        reportDate: typeof (session as any).reportDate === 'string' ? (session as any).reportDate : null,
        wvpWeekNumber: typeof (session as any).wvpWeekNumber === 'string' ? (session as any).wvpWeekNumber : null,
        reportFirstSickDay: typeof (session as any).reportFirstSickDay === 'string' ? (session as any).reportFirstSickDay : null,
      }))
    : fallback.sessions
  const notes = Array.isArray(data.notes)
    ? data.notes.map((n) => ({
        ...n,
        title: typeof (n as any).title === "string" ? (n as any).title : "",
      }))
    : fallback.notes
  return {
    ...data,
    coachees,
    sessions,
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
          tintColor: typeof data.practiceSettings.tintColor === 'string' ? data.practiceSettings.tintColor : '#BE0165',
          logoDataUrl: typeof data.practiceSettings.logoDataUrl === 'string' ? data.practiceSettings.logoDataUrl : null,
          updatedAtUnixMs: Number.isFinite(data.practiceSettings.updatedAtUnixMs) ? Number(data.practiceSettings.updatedAtUnixMs) : 0,
        }
      : fallback.practiceSettings,
  }
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
  const remainingSessions = data.sessions.filter((s) => s.coacheeId !== coacheeId)
  const remainingNotes = data.notes.filter((n) => remainingSessions.some((s) => s.id === n.sessionId))
  const remainingWrittenReports = data.writtenReports.filter((r) => remainingSessions.some((s) => s.id === r.sessionId))
  return { ...data, coachees: remainingCoachees, sessions: remainingSessions, notes: remainingNotes, writtenReports: remainingWrittenReports }
}

export function createSession(data: LocalAppData, session: Session): { data: LocalAppData; sessionId: string } {
  return { data: { ...data, sessions: [session, ...data.sessions] }, sessionId: session.id }
}

export function listSessionsForCoachee(data: LocalAppData, coacheeId: string): Session[] {
  return data.sessions.filter((s) => s.coacheeId === coacheeId).sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
}

export function updateSession(
  data: LocalAppData,
  sessionId: string,
  values: {
    coacheeId?: string | null
    title?: string
    audioBlobId?: string | null
    audioDurationSeconds?: number | null
    uploadFileName?: string | null
    transcript?: string | null
    summary?: string | null
    reportDate?: string | null
    wvpWeekNumber?: string | null
    reportFirstSickDay?: string | null
    transcriptionStatus?: Session['transcriptionStatus']
    transcriptionError?: string | null
  }
): LocalAppData {
  const now = Date.now()
  return {
    ...data,
    sessions: data.sessions.map((s) => {
      if (s.id !== sessionId) return s
      return {
        ...s,
        ...(values.coacheeId !== undefined ? { coacheeId: values.coacheeId } : {}),
        ...(values.title !== undefined ? { title: values.title.trim() } : {}),
        ...(values.audioBlobId !== undefined ? { audioBlobId: values.audioBlobId } : {}),
        ...(values.audioDurationSeconds !== undefined ? { audioDurationSeconds: values.audioDurationSeconds } : {}),
        ...(values.uploadFileName !== undefined ? { uploadFileName: values.uploadFileName } : {}),
        ...(values.transcript !== undefined ? { transcript: values.transcript } : {}),
        ...(values.summary !== undefined ? { summary: values.summary } : {}),
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
  const remainingNotes = data.notes.filter((n) => n.sessionId !== sessionId)
  const remainingWrittenReports = data.writtenReports.filter((r) => r.sessionId !== sessionId)
  return { ...data, sessions: remainingSessions, notes: remainingNotes, writtenReports: remainingWrittenReports }
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
  values: { practiceName?: string; website?: string; tintColor?: string; logoDataUrl?: string | null; updatedAtUnixMs: number },
): LocalAppData {
  return {
    ...data,
    practiceSettings: {
      ...data.practiceSettings,
      ...(values.practiceName !== undefined ? { practiceName: values.practiceName.trim() } : {}),
      ...(values.website !== undefined ? { website: values.website.trim() } : {}),
      ...(values.tintColor !== undefined ? { tintColor: values.tintColor } : {}),
      ...(values.logoDataUrl !== undefined ? { logoDataUrl: values.logoDataUrl } : {}),
      updatedAtUnixMs: values.updatedAtUnixMs,
    },
  }
}
