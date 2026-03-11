import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import {
  archiveCoachee,
  createActivity,
  createActivityTemplate,
  createSnippet,
  createCoachee,
  createNote,
  createSession,
  createTemplate,
  createTrajectory,
  deleteActivity,
  deleteActivityTemplate,
  deleteSnippet,
  deleteCoachee,
  deleteNote,
  deleteSession,
  deleteTemplate,
  deleteTrajectory,
  loadLocalAppData,
  restoreCoachee,
  saveLocalAppData,
  setWrittenReport,
  updateActivity,
  updateActivityTemplate,
  updateSnippet,
  updatePracticeSettings,
  updateCoachee,
  updateNote,
  updateSession,
  updateTrajectory,
} from './localAppDataStore'
import { createId } from '../utils/createId'
import {
  Activity,
  ActivityTemplate,
  Coachee,
  LocalAppData,
  Note,
  PracticeSettings,
  Session,
  Snippet,
  Template,
  TemplateCategory,
  TemplateSection,
  Trajectory,
  WrittenReport,
} from './types'
import {
  readAppData,
} from '../api/appData/appDataApi'
import { createActivityRemote, deleteActivityRemote, updateActivityRemote } from '../api/activities/activityApi'
import {
  createActivityTemplateRemote,
  deleteActivityTemplateRemote,
  updateActivityTemplateRemote,
} from '../api/activities/activityTemplateApi'
import { createCoacheeRemote, deleteCoacheeRemote, updateCoacheeRemote } from '../api/clients/clientApi'
import { createNoteRemote, deleteNoteRemote, updateNoteRemote } from '../api/notes/noteApi'
import { updatePracticeSettingsRemote } from '../api/practice/practiceSettingsApi'
import { setWrittenReportRemote } from '../api/reports/reportApi'
import { createSessionRemote, deleteSessionRemote, updateSessionRemote } from '../api/sessions/sessionApi'
import { createSnippetRemote, deleteSnippetRemote, updateSnippetRemote } from '../api/snippets/snippetApi'
import { createTemplateRemote, deleteTemplateRemote, readDefaultTemplates, updateTemplateRemote } from '../api/templates/templateApi'
import { createTrajectoryRemote, deleteTrajectoryRemote, updateTrajectoryRemote } from '../api/trajectories/trajectoryApi'
import { useOptionalE2ee } from '../security/providers/E2eeProvider'

type ContextValue = {
  data: LocalAppData
  isAppDataLoaded: boolean
  reset: () => void

  createCoachee: (values: { name: string; clientDetails?: string; employerDetails?: string; firstSickDay?: string }) => string
  updateCoachee: (coacheeId: string, values: { name?: string; clientDetails?: string; employerDetails?: string; firstSickDay?: string }) => void
  archiveCoachee: (coacheeId: string) => void
  restoreCoachee: (coacheeId: string) => void
  deleteCoachee: (coacheeId: string) => void

  createSession: (values: {
    coacheeId: string | null
    trajectoryId?: string | null
    title: string
    kind: Session['kind']
    audioBlobId: string | null
    audioDurationSeconds: number | null
    uploadFileName: string | null
    transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
    transcriptionError?: string | null
  }) => string
  updateSession: (
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
      transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
      transcriptionError?: string | null
    }
  ) => void
  deleteSession: (sessionId: string) => void

  createTrajectory: (values: {
    coacheeId: string
    name: string
    dienstType?: string
    uwvContactName?: string | null
    uwvContactPhone?: string | null
    uwvContactEmail?: string | null
    orderNumber?: string | null
    startDate?: string | null
    planVanAanpak?: Trajectory['planVanAanpak']
    maxHours?: number
    maxAdminHours?: number
  }) => string
  updateTrajectory: (
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
    },
  ) => void
  deleteTrajectory: (trajectoryId: string) => void

  createActivityTemplate: (values: {
    name: string
    description?: string
    category: string
    defaultHours: number
    isAdmin?: boolean
    organizationId?: string | null
    isActive?: boolean
  }) => string
  updateActivityTemplate: (
    templateId: string,
    values: {
      name?: string
      description?: string
      category?: string
      defaultHours?: number
      isAdmin?: boolean
      organizationId?: string | null
      isActive?: boolean
    },
  ) => void
  deleteActivityTemplate: (templateId: string) => void

  createActivity: (values: {
    trajectoryId: string
    sessionId?: string | null
    templateId?: string | null
    name: string
    category: string
    status: Activity['status']
    plannedHours?: number | null
    actualHours?: number | null
    source?: Activity['source']
    isAdmin?: boolean
  }) => string
  updateActivity: (
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
    },
  ) => void
  deleteActivity: (activityId: string) => void

  createSnippet: (values: {
    trajectoryId: string
    itemId: string
    field: string
    text: string
    date: number
    status?: Snippet['status']
  }) => string
  updateSnippet: (
    snippetId: string,
    values: {
      field?: string
      text?: string
      status?: Snippet['status']
    },
  ) => void
  deleteSnippet: (snippetId: string) => void

  createNote: (sessionId: string, values: { title: string; text: string }) => void
  updateNote: (noteId: string, values: { title?: string; text: string }) => void
  deleteNote: (noteId: string) => void

  setWrittenReport: (sessionId: string, text: string) => void

  createTemplate: (values: { name: string; category: TemplateCategory; description: string; sections: TemplateSection[] }) => string
  updateTemplate: (templateId: string, values: { name?: string; description?: string; sections?: TemplateSection[] }) => void
  deleteTemplate: (templateId: string) => void
  toggleTemplateSaved: (templateId: string) => void
  updatePracticeSettings: (values: {
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
  }) => void
}

const LocalAppDataContext = createContext<ContextValue | null>(null)

type Props = {
  children: ReactNode
  isAuthenticated: boolean
}

const STALE_TRANSCRIPTION_TIMEOUT_MS = 6 * 60 * 60 * 1000
const STALE_TRANSCRIPTION_ERROR_MESSAGE = 'Transcriptie duurt te lang of is onderbroken. Probeer opnieuw.'

export function LocalAppDataProvider({ children, isAuthenticated }: Props) {
  const e2ee = useOptionalE2ee()
  const [data, setData] = useState<LocalAppData>(() => loadLocalAppData())
  const [isAppDataLoaded, setIsAppDataLoaded] = useState(() => !isAuthenticated)

  useEffect(() => {
    saveLocalAppData(data)
  }, [data])

  async function decryptRemoteData(remote: LocalAppData): Promise<LocalAppData> {
    if (!e2ee) {
      const trajectories = Array.isArray((remote as any).trajectories) ? (remote as any).trajectories : []
      const activities = Array.isArray((remote as any).activities) ? (remote as any).activities : []
      const activityTemplates = Array.isArray((remote as any).activityTemplates) ? (remote as any).activityTemplates : []
      const snippets = Array.isArray((remote as any).snippets) ? (remote as any).snippets : []
      const templates = Array.isArray(remote.templates) ? remote.templates : []
      return { ...remote, trajectories, activities, activityTemplates, snippets, templates, practiceSettings: remote.practiceSettings }
    }

    const decryptTextCompat = async (value: string): Promise<string> => {
      if (!value) return value
      try {
        return await e2ee.decryptText(value)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const name = typeof error === 'object' && error !== null && 'name' in error ? String((error as { name?: unknown }).name ?? '') : ''
        const isLegacyPlaintext =
          message === 'Ongeldige versleuteling' ||
          name === 'InvalidCharacterError' ||
          message.includes('Failed to execute \'atob\'') ||
          message.includes('not correctly encoded')
        if (isLegacyPlaintext) {
          // Backward compatibility for legacy plaintext values stored before E2EE was enabled.
          return value
        }
        throw error
      }
    }

    const coachees: Coachee[] = []
    for (const coachee of remote.coachees) {
      coachees.push({
        ...coachee,
        name: await decryptTextCompat(coachee.name),
        clientDetails: await decryptTextCompat(coachee.clientDetails ?? ''),
        employerDetails: await decryptTextCompat(coachee.employerDetails ?? ''),
        firstSickDay: await decryptTextCompat(coachee.firstSickDay ?? ''),
      })
    }

    const sessions: Session[] = []
    for (const session of remote.sessions) {
      sessions.push({
        ...session,
        title: await decryptTextCompat(session.title),
        uploadFileName: session.uploadFileName ? await decryptTextCompat(session.uploadFileName) : null,
        transcript: session.transcript ? await decryptTextCompat(session.transcript) : null,
        summary: session.summary ? await decryptTextCompat(session.summary) : null,
        summaryStructured:
          session.summaryStructured && typeof session.summaryStructured === 'object'
            ? {
                doelstelling: session.summaryStructured.doelstelling ? await decryptTextCompat(session.summaryStructured.doelstelling) : '',
                belastbaarheid: session.summaryStructured.belastbaarheid
                  ? await decryptTextCompat(session.summaryStructured.belastbaarheid)
                  : '',
                belemmeringen: session.summaryStructured.belemmeringen ? await decryptTextCompat(session.summaryStructured.belemmeringen) : '',
                voortgang: session.summaryStructured.voortgang ? await decryptTextCompat(session.summaryStructured.voortgang) : '',
                arbeidsmarktorientatie: session.summaryStructured.arbeidsmarktorientatie
                  ? await decryptTextCompat(session.summaryStructured.arbeidsmarktorientatie)
                  : '',
              }
            : null,
        reportDate: session.reportDate ? await decryptTextCompat(session.reportDate) : null,
        wvpWeekNumber: session.wvpWeekNumber ? await decryptTextCompat(session.wvpWeekNumber) : null,
        reportFirstSickDay: session.reportFirstSickDay ? await decryptTextCompat(session.reportFirstSickDay) : null,
        transcriptionError: session.transcriptionError ? await decryptTextCompat(session.transcriptionError) : null,
        audioDurationSeconds: typeof session.audioDurationSeconds === 'number' ? session.audioDurationSeconds : null,
        trajectoryId: typeof session.trajectoryId === 'string' ? session.trajectoryId : null,
      })
    }

    const trajectories: Trajectory[] = []
    const remoteTrajectories = Array.isArray((remote as any).trajectories) ? (remote as any).trajectories as Trajectory[] : []
    for (const trajectory of remoteTrajectories) {
      trajectories.push({
      ...trajectory,
      name: await decryptTextCompat(trajectory.name),
      dienstType: await decryptTextCompat(trajectory.dienstType),
      uwvContactName: trajectory.uwvContactName ? await decryptTextCompat(trajectory.uwvContactName) : null,
      uwvContactPhone: trajectory.uwvContactPhone ? await decryptTextCompat(trajectory.uwvContactPhone) : null,
      uwvContactEmail: trajectory.uwvContactEmail ? await decryptTextCompat(trajectory.uwvContactEmail) : null,
      orderNumber: trajectory.orderNumber ? await decryptTextCompat(trajectory.orderNumber) : null,
      startDate: trajectory.startDate ? await decryptTextCompat(trajectory.startDate) : null,
      planVanAanpak:
        trajectory.planVanAanpak && typeof trajectory.planVanAanpak.documentId === 'string'
          ? { documentId: await decryptTextCompat(trajectory.planVanAanpak.documentId) }
          : null,
      })
    }

    const activities: Activity[] = []
    const remoteActivities = Array.isArray((remote as any).activities) ? (remote as any).activities as Activity[] : []
    for (const activity of remoteActivities) {
      activities.push({
        ...activity,
        name: await decryptTextCompat(activity.name),
        category: await decryptTextCompat(activity.category),
      })
    }

    const activityTemplates: ActivityTemplate[] = []
    const remoteActivityTemplates = Array.isArray((remote as any).activityTemplates)
      ? (remote as any).activityTemplates as ActivityTemplate[]
      : []
    for (const template of remoteActivityTemplates) {
      activityTemplates.push({
        ...template,
        name: await decryptTextCompat(template.name),
        description: template.description ? await decryptTextCompat(template.description) : '',
        category: await decryptTextCompat(template.category),
        organizationId: template.organizationId ? await decryptTextCompat(template.organizationId) : null,
      })
    }

    const snippets: Snippet[] = []
    const remoteSnippets = Array.isArray((remote as any).snippets) ? ((remote as any).snippets as Snippet[]) : []
    for (const snippet of remoteSnippets) {
      snippets.push({
        ...snippet,
        field: await decryptTextCompat(snippet.field),
        text: await decryptTextCompat(snippet.text),
      })
    }

    const notes: Note[] = []
    for (const note of remote.notes) {
      notes.push({
        ...note,
        title: (note as any).title ? await decryptTextCompat((note as any).title) : "",
        text: await decryptTextCompat(note.text),
      })
    }

    const writtenReports: WrittenReport[] = []
    for (const report of remote.writtenReports) {
      writtenReports.push({ ...report, text: await decryptTextCompat(report.text) })
    }

    const templates: Template[] = []
    const remoteTemplates = Array.isArray(remote.templates) ? remote.templates : []
    for (const template of remoteTemplates) {
      templates.push(await decryptTemplate(template, decryptTextCompat))
    }

    const practiceSettings: PracticeSettings = {
      practiceName: await decryptTextCompat(remote.practiceSettings.practiceName),
      website: await decryptTextCompat(remote.practiceSettings.website),
      visitAddress: await decryptTextCompat(remote.practiceSettings.visitAddress ?? ''),
      postalAddress: await decryptTextCompat(remote.practiceSettings.postalAddress ?? ''),
      postalCodeCity: await decryptTextCompat(remote.practiceSettings.postalCodeCity ?? ''),
      contactName: await decryptTextCompat(remote.practiceSettings.contactName ?? ''),
      contactRole: await decryptTextCompat(remote.practiceSettings.contactRole ?? ''),
      contactPhone: await decryptTextCompat(remote.practiceSettings.contactPhone ?? ''),
      contactEmail: await decryptTextCompat(remote.practiceSettings.contactEmail ?? ''),
      tintColor: await decryptTextCompat(remote.practiceSettings.tintColor),
      logoDataUrl: remote.practiceSettings.logoDataUrl ? await decryptTextCompat(remote.practiceSettings.logoDataUrl) : null,
      updatedAtUnixMs: remote.practiceSettings.updatedAtUnixMs,
    }

    return { coachees, trajectories, sessions, activities, activityTemplates, snippets, notes, writtenReports, templates, practiceSettings }
  }

  async function encryptCoachee(coachee: Coachee): Promise<Coachee> {
    if (!e2ee) return coachee
    return {
      ...coachee,
      name: await e2ee.encryptText(coachee.name),
      clientDetails: await e2ee.encryptText(coachee.clientDetails ?? ''),
      employerDetails: await e2ee.encryptText(coachee.employerDetails ?? ''),
      firstSickDay: await e2ee.encryptText(coachee.firstSickDay ?? ''),
    }
  }

  async function encryptSession(session: Session): Promise<Session> {
    if (!e2ee) return session
    return {
      ...session,
      title: await e2ee.encryptText(session.title),
      uploadFileName: session.uploadFileName ? await e2ee.encryptText(session.uploadFileName) : null,
      transcript: session.transcript ? await e2ee.encryptText(session.transcript) : null,
      summary: session.summary ? await e2ee.encryptText(session.summary) : null,
      summaryStructured: session.summaryStructured
        ? {
            doelstelling: session.summaryStructured.doelstelling ? await e2ee.encryptText(session.summaryStructured.doelstelling) : '',
            belastbaarheid: session.summaryStructured.belastbaarheid ? await e2ee.encryptText(session.summaryStructured.belastbaarheid) : '',
            belemmeringen: session.summaryStructured.belemmeringen ? await e2ee.encryptText(session.summaryStructured.belemmeringen) : '',
            voortgang: session.summaryStructured.voortgang ? await e2ee.encryptText(session.summaryStructured.voortgang) : '',
            arbeidsmarktorientatie: session.summaryStructured.arbeidsmarktorientatie
              ? await e2ee.encryptText(session.summaryStructured.arbeidsmarktorientatie)
              : '',
          }
        : null,
      reportDate: session.reportDate ? await e2ee.encryptText(session.reportDate) : null,
      wvpWeekNumber: session.wvpWeekNumber ? await e2ee.encryptText(session.wvpWeekNumber) : null,
      reportFirstSickDay: session.reportFirstSickDay ? await e2ee.encryptText(session.reportFirstSickDay) : null,
      transcriptionError: session.transcriptionError ? await e2ee.encryptText(session.transcriptionError) : null,
    }
  }

  async function encryptTrajectory(trajectory: Trajectory): Promise<Trajectory> {
    if (!e2ee) return trajectory
    return {
      ...trajectory,
      name: await e2ee.encryptText(trajectory.name),
      dienstType: await e2ee.encryptText(trajectory.dienstType),
      uwvContactName: trajectory.uwvContactName ? await e2ee.encryptText(trajectory.uwvContactName) : null,
      uwvContactPhone: trajectory.uwvContactPhone ? await e2ee.encryptText(trajectory.uwvContactPhone) : null,
      uwvContactEmail: trajectory.uwvContactEmail ? await e2ee.encryptText(trajectory.uwvContactEmail) : null,
      orderNumber: trajectory.orderNumber ? await e2ee.encryptText(trajectory.orderNumber) : null,
      startDate: trajectory.startDate ? await e2ee.encryptText(trajectory.startDate) : null,
      planVanAanpak:
        trajectory.planVanAanpak && typeof trajectory.planVanAanpak.documentId === 'string'
          ? { documentId: await e2ee.encryptText(trajectory.planVanAanpak.documentId) }
          : null,
    }
  }

  async function encryptActivity(activity: Activity): Promise<Activity> {
    if (!e2ee) return activity
    return {
      ...activity,
      name: await e2ee.encryptText(activity.name),
      category: await e2ee.encryptText(activity.category),
    }
  }

  async function encryptActivityTemplate(template: ActivityTemplate): Promise<ActivityTemplate> {
    if (!e2ee) return template
    return {
      ...template,
      name: await e2ee.encryptText(template.name),
      description: await e2ee.encryptText(template.description || ''),
      category: await e2ee.encryptText(template.category),
      organizationId: template.organizationId ? await e2ee.encryptText(template.organizationId) : null,
    }
  }

  async function encryptSnippet(snippet: Snippet): Promise<Snippet> {
    if (!e2ee) return snippet
    return {
      ...snippet,
      field: await e2ee.encryptText(snippet.field),
      text: await e2ee.encryptText(snippet.text),
    }
  }

  async function encryptNote(note: Note): Promise<Note> {
    if (!e2ee) return note
    return {
      ...note,
      title: await e2ee.encryptText(note.title ?? ""),
      text: await e2ee.encryptText(note.text),
    }
  }

  async function encryptWrittenReport(report: WrittenReport): Promise<WrittenReport> {
    if (!e2ee) return report
    return { ...report, text: await e2ee.encryptText(report.text) }
  }

  async function decryptTemplate(template: Template, decryptTextCompat: (value: string) => Promise<string>): Promise<Template> {
    if (!e2ee) return template
    const sections: TemplateSection[] = []
    for (const section of template.sections) {
      sections.push({
        ...section,
        title: await decryptTextCompat(section.title),
        description: await decryptTextCompat(section.description),
      })
    }
    return {
      ...template,
      name: await decryptTextCompat(template.name),
      description: await decryptTextCompat(template.description || ''),
      sections,
    }
  }

  async function encryptTemplate(template: Template): Promise<Template> {
    if (!e2ee) return template
    const sections: TemplateSection[] = []
    for (const section of template.sections) {
      sections.push({
        ...section,
        title: await e2ee.encryptText(section.title),
        description: await e2ee.encryptText(section.description),
      })
    }
    return {
      ...template,
      name: await e2ee.encryptText(template.name),
      description: await e2ee.encryptText(template.description || ''),
      sections,
    }
  }

  async function encryptPracticeSettings(practiceSettings: PracticeSettings): Promise<PracticeSettings> {
    if (!e2ee) return practiceSettings
    return {
      practiceName: await e2ee.encryptText(practiceSettings.practiceName),
      website: await e2ee.encryptText(practiceSettings.website),
      visitAddress: await e2ee.encryptText(practiceSettings.visitAddress),
      postalAddress: await e2ee.encryptText(practiceSettings.postalAddress),
      postalCodeCity: await e2ee.encryptText(practiceSettings.postalCodeCity),
      contactName: await e2ee.encryptText(practiceSettings.contactName),
      contactRole: await e2ee.encryptText(practiceSettings.contactRole),
      contactPhone: await e2ee.encryptText(practiceSettings.contactPhone),
      contactEmail: await e2ee.encryptText(practiceSettings.contactEmail),
      tintColor: await e2ee.encryptText(practiceSettings.tintColor),
      logoDataUrl: practiceSettings.logoDataUrl ? await e2ee.encryptText(practiceSettings.logoDataUrl) : null,
      updatedAtUnixMs: practiceSettings.updatedAtUnixMs,
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAppDataLoaded(true)
      return
    }
    if (!e2ee) {
      setIsAppDataLoaded(false)
      return
    }
    let isActive = true
    setIsAppDataLoaded(false)
    void (async () => {
      try {
        const remoteRaw = await readAppData()
        const remote = await decryptRemoteData(remoteRaw)
        if (!isActive) return
        if (isEmptyAppData(remote)) {
          const localSnapshot = loadLocalAppData()
          if (!isEmptyAppData(localSnapshot)) {
            await seedRemoteFromLocal(localSnapshot)
            const seededRaw = await readAppData()
            const seeded = await decryptRemoteData(seededRaw)
            if (!isActive) return
            setData(seeded)
            return
          }
        }
        if (remote.templates.length === 0) {
          try {
            const defaults = await readDefaultTemplates()
            if (defaults.templates.length > 0) {
              for (const template of defaults.templates) {
                if (e2ee) {
                  await createTemplateRemote(await encryptTemplate(template))
                } else {
                  await createTemplateRemote(template)
                }
              }
              const seededRaw = await readAppData()
              const seeded = await decryptRemoteData(seededRaw)
              if (!isActive) return
              setData(seeded)
              return
            }
          } catch (error) {
            console.warn("[LocalAppDataProvider] Failed to load default templates", error)
          }
        }
        setData(remote)
      } catch (error) {
        console.error('[LocalAppDataProvider] Failed to load remote app data', error)
        // Keep/restore a local snapshot so data remains visible when remote sync fails.
        setData(loadLocalAppData())
      } finally {
        if (isActive) {
          setIsAppDataLoaded(true)
        }
      }
    })()
    return () => {
      isActive = false
    }
  }, [e2ee, isAuthenticated])

  async function refreshFromServer() {
    try {
      const remoteRaw = await readAppData()
      const remote = await decryptRemoteData(remoteRaw)
      setData((previous) => {
        const remoteBySessionId = new Map(remote.writtenReports.map((report) => [report.sessionId, report]))
        const mergedWrittenReports = [...remote.writtenReports]
        for (const localReport of previous.writtenReports) {
          const remoteReport = remoteBySessionId.get(localReport.sessionId)
          if (!remoteReport || localReport.updatedAtUnixMs > remoteReport.updatedAtUnixMs) {
            const withoutSameSession = mergedWrittenReports.filter((report) => report.sessionId !== localReport.sessionId)
            mergedWrittenReports.splice(0, mergedWrittenReports.length, localReport, ...withoutSameSession)
          }
        }
        return { ...remote, writtenReports: mergedWrittenReports }
      })
    } catch (error) {
      console.error('[LocalAppDataProvider] Failed to refresh remote app data', error)
    }
  }

  function wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  function runRemoteAction(action: Promise<void>) {
    void action.then(refreshFromServer).catch((error) => {
      console.error('[LocalAppDataProvider] Remote update failed', error)
    })
  }

  function isEmptyAppData(next: LocalAppData) {
    return (
      next.coachees.length === 0 &&
      next.trajectories.length === 0 &&
      next.sessions.length === 0 &&
      next.activities.length === 0 &&
      next.activityTemplates.length === 0 &&
      next.snippets.length === 0 &&
      next.notes.length === 0 &&
      next.writtenReports.length === 0 &&
      next.templates.length === 0
    )
  }

  function hasSessionChanges(session: Session, values: Parameters<ContextValue['updateSession']>[1]) {
    return (
      (values.coacheeId !== undefined && values.coacheeId !== session.coacheeId) ||
      (values.trajectoryId !== undefined && values.trajectoryId !== session.trajectoryId) ||
      (values.kind !== undefined && values.kind !== session.kind) ||
      (values.title !== undefined && values.title.trim() !== session.title) ||
      (values.createdAtUnixMs !== undefined && values.createdAtUnixMs !== session.createdAtUnixMs) ||
      (values.audioBlobId !== undefined && values.audioBlobId !== session.audioBlobId) ||
      (values.audioDurationSeconds !== undefined && values.audioDurationSeconds !== session.audioDurationSeconds) ||
      (values.uploadFileName !== undefined && values.uploadFileName !== session.uploadFileName) ||
      (values.transcript !== undefined && values.transcript !== session.transcript) ||
      (values.summary !== undefined && values.summary !== session.summary) ||
      (values.summaryStructured !== undefined &&
        JSON.stringify(values.summaryStructured) !== JSON.stringify(session.summaryStructured)) ||
      (values.reportDate !== undefined && values.reportDate !== session.reportDate) ||
      (values.wvpWeekNumber !== undefined && values.wvpWeekNumber !== session.wvpWeekNumber) ||
      (values.reportFirstSickDay !== undefined && values.reportFirstSickDay !== session.reportFirstSickDay) ||
      (values.transcriptionStatus !== undefined && values.transcriptionStatus !== session.transcriptionStatus) ||
      (values.transcriptionError !== undefined && values.transcriptionError !== session.transcriptionError)
    )
  }

  async function seedRemoteFromLocal(localSnapshot: LocalAppData) {
    for (const coachee of localSnapshot.coachees) {
      await createCoacheeRemote(await encryptCoachee(coachee))
    }
    for (const trajectory of localSnapshot.trajectories) {
      await createTrajectoryRemote(await encryptTrajectory(trajectory))
    }
    for (const session of localSnapshot.sessions) {
      await createSessionRemote(await encryptSession(session))
    }
    for (const activityTemplate of localSnapshot.activityTemplates) {
      await createActivityTemplateRemote(await encryptActivityTemplate(activityTemplate))
    }
    for (const activity of localSnapshot.activities) {
      await createActivityRemote(await encryptActivity(activity))
    }
    for (const snippet of localSnapshot.snippets) {
      await createSnippetRemote(await encryptSnippet(snippet))
    }
    for (const note of localSnapshot.notes) {
      await createNoteRemote(await encryptNote(note))
    }
    for (const report of localSnapshot.writtenReports) {
      await setWrittenReportRemote(await encryptWrittenReport(report))
    }
    for (const template of localSnapshot.templates) {
      await createTemplateRemote(await encryptTemplate(template))
    }
    await updatePracticeSettingsRemote(await encryptPracticeSettings(localSnapshot.practiceSettings))
  }


  const value = useMemo<ContextValue>(() => {
    return {
      data,
      isAppDataLoaded,
      reset: () => setData(loadLocalAppData()),

      createCoachee: (values) => {
        const trimmedName = values.name.trim()
        if (!trimmedName) return ''
        const now = Date.now()
        const coachee: Coachee = {
          id: createId('coachee'),
          name: trimmedName,
          clientDetails: (values.clientDetails ?? '').trim(),
          employerDetails: (values.employerDetails ?? '').trim(),
          firstSickDay: (values.firstSickDay ?? '').trim(),
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
          isArchived: false,
        }
        setData((previous) => createCoachee(previous, coachee))
        if (e2ee) {
          runRemoteAction(encryptCoachee(coachee).then(createCoacheeRemote))
        }
        return coachee.id
      },
      updateCoachee: (coacheeId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateCoachee(previous, coacheeId, values))
        if (!e2ee) return
        void (async () => {
          await updateCoacheeRemote({
            id: coacheeId,
            updatedAtUnixMs,
            ...(values.name !== undefined ? { name: await e2ee.encryptText(values.name.trim()) } : {}),
            ...(values.clientDetails !== undefined ? { clientDetails: await e2ee.encryptText(values.clientDetails.trim()) } : {}),
            ...(values.employerDetails !== undefined ? { employerDetails: await e2ee.encryptText(values.employerDetails.trim()) } : {}),
            ...(values.firstSickDay !== undefined ? { firstSickDay: await e2ee.encryptText(values.firstSickDay.trim()) } : {}),
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      archiveCoachee: (coacheeId) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => archiveCoachee(previous, coacheeId))
        runRemoteAction(updateCoacheeRemote({ id: coacheeId, isArchived: true, updatedAtUnixMs }))
      },
      restoreCoachee: (coacheeId) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => restoreCoachee(previous, coacheeId))
        runRemoteAction(updateCoacheeRemote({ id: coacheeId, isArchived: false, updatedAtUnixMs }))
      },
      deleteCoachee: (coacheeId) => {
        setData((previous) => deleteCoachee(previous, coacheeId))
        runRemoteAction(deleteCoacheeRemote(coacheeId))
      },

      createSession: (values) => {
        const title = values.title.trim()
        if (!title) return ''
        const now = Date.now()
        const session: Session = {
          id: createId('session'),
          coacheeId: values.coacheeId,
          trajectoryId: values.trajectoryId ?? null,
          title,
          kind: values.kind,
          audioBlobId: values.audioBlobId,
          audioDurationSeconds: values.audioDurationSeconds,
          uploadFileName: values.uploadFileName,
          transcript: null,
          summary: null,
          summaryStructured: null,
          reportDate: null,
          wvpWeekNumber: null,
          reportFirstSickDay: null,
          transcriptionStatus: values.transcriptionStatus ?? 'idle',
          transcriptionError: values.transcriptionError ?? null,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => {
          const result = createSession(previous, session)
          return result.data
        })
        if (e2ee) {
          runRemoteAction(encryptSession(session).then(createSessionRemote))
        }
        return session.id
      },
      updateSession: (sessionId, values) => {
        const currentSession = data.sessions.find((session) => session.id === sessionId)
        if (!currentSession || !hasSessionChanges(currentSession, values)) return
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateSession(previous, sessionId, values))
        if (!e2ee) return
        void (async () => {
          const hasSummaryStructuredField = Object.prototype.hasOwnProperty.call(values, 'summaryStructured')
          const encryptedTitle = typeof values.title === 'string' ? await e2ee.encryptText(values.title) : undefined
          const encryptedUploadFileName =
            values.uploadFileName === undefined ? undefined : values.uploadFileName === null ? null : await e2ee.encryptText(values.uploadFileName)
          const encryptedTranscript = values.transcript === undefined ? undefined : values.transcript === null ? null : await e2ee.encryptText(values.transcript)
          const encryptedSummary = values.summary === undefined ? undefined : values.summary === null ? null : await e2ee.encryptText(values.summary)
          const structuredValue = values.summaryStructured
          const encryptedSummaryStructured =
            !hasSummaryStructuredField
              ? undefined
              : structuredValue === null || structuredValue === undefined
                ? null
                : {
                    doelstelling: structuredValue.doelstelling
                      ? await e2ee.encryptText(structuredValue.doelstelling)
                      : '',
                    belastbaarheid: structuredValue.belastbaarheid
                      ? await e2ee.encryptText(structuredValue.belastbaarheid)
                      : '',
                    belemmeringen: structuredValue.belemmeringen
                      ? await e2ee.encryptText(structuredValue.belemmeringen)
                      : '',
                    voortgang: structuredValue.voortgang ? await e2ee.encryptText(structuredValue.voortgang) : '',
                    arbeidsmarktorientatie: structuredValue.arbeidsmarktorientatie
                      ? await e2ee.encryptText(structuredValue.arbeidsmarktorientatie)
                      : '',
                  }
          const encryptedError =
            values.transcriptionError === undefined
              ? undefined
              : values.transcriptionError === null
                ? null
                : await e2ee.encryptText(values.transcriptionError)
          const payload = {
            id: sessionId,
            updatedAtUnixMs,
            coacheeId: values.coacheeId,
            trajectoryId: values.trajectoryId,
            kind: values.kind,
            title: encryptedTitle,
            createdAtUnixMs: values.createdAtUnixMs,
            audioBlobId: values.audioBlobId,
            audioDurationSeconds: values.audioDurationSeconds,
            uploadFileName: encryptedUploadFileName,
            transcript: encryptedTranscript,
            summary: encryptedSummary,
            ...(hasSummaryStructuredField ? { summaryStructured: encryptedSummaryStructured ?? null } : {}),
            reportDate: values.reportDate === undefined ? undefined : values.reportDate === null ? null : await e2ee.encryptText(values.reportDate),
            wvpWeekNumber:
              values.wvpWeekNumber === undefined ? undefined : values.wvpWeekNumber === null ? null : await e2ee.encryptText(values.wvpWeekNumber),
            reportFirstSickDay:
              values.reportFirstSickDay === undefined
                ? undefined
                : values.reportFirstSickDay === null
                  ? null
                  : await e2ee.encryptText(values.reportFirstSickDay),
            transcriptionStatus: values.transcriptionStatus,
            transcriptionError: encryptedError,
          }
          await updateSessionRemote(payload)
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteSession: (sessionId) => {
        setData((previous) => deleteSession(previous, sessionId))
        runRemoteAction(deleteSessionRemote(sessionId))
      },

      createTrajectory: (values) => {
        const now = Date.now()
        const trimmedCoacheeId = String(values.coacheeId || '').trim()
        const trimmedName = String(values.name || '').trim()
        if (!trimmedCoacheeId || !trimmedName) return ''
        const trajectory: Trajectory = {
          id: createId('trajectory'),
          coacheeId: trimmedCoacheeId,
          name: trimmedName,
          dienstType: String(values.dienstType || 'Werkfit maken').trim() || 'Werkfit maken',
          uwvContactName: values.uwvContactName ?? null,
          uwvContactPhone: values.uwvContactPhone ?? null,
          uwvContactEmail: values.uwvContactEmail ?? null,
          orderNumber: values.orderNumber ?? null,
          startDate: values.startDate ?? null,
          planVanAanpak: values.planVanAanpak ?? null,
          maxHours: Number.isFinite(values.maxHours) ? Number(values.maxHours) : 41,
          maxAdminHours: Number.isFinite(values.maxAdminHours) ? Number(values.maxAdminHours) : 3,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createTrajectory(previous, trajectory).data)
        if (e2ee) {
          runRemoteAction(encryptTrajectory(trajectory).then(createTrajectoryRemote))
        }
        return trajectory.id
      },
      updateTrajectory: (trajectoryId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateTrajectory(previous, trajectoryId, { ...values, updatedAtUnixMs }))
        if (!e2ee) return
        void (async () => {
          await updateTrajectoryRemote({
            id: trajectoryId,
            updatedAtUnixMs,
            ...(values.coacheeId !== undefined ? { coacheeId: values.coacheeId } : {}),
            ...(values.name !== undefined ? { name: await e2ee.encryptText(values.name.trim()) } : {}),
            ...(values.dienstType !== undefined ? { dienstType: await e2ee.encryptText(values.dienstType.trim()) } : {}),
            ...(values.uwvContactName !== undefined
              ? { uwvContactName: values.uwvContactName === null ? null : await e2ee.encryptText(values.uwvContactName) }
              : {}),
            ...(values.uwvContactPhone !== undefined
              ? { uwvContactPhone: values.uwvContactPhone === null ? null : await e2ee.encryptText(values.uwvContactPhone) }
              : {}),
            ...(values.uwvContactEmail !== undefined
              ? { uwvContactEmail: values.uwvContactEmail === null ? null : await e2ee.encryptText(values.uwvContactEmail) }
              : {}),
            ...(values.orderNumber !== undefined
              ? { orderNumber: values.orderNumber === null ? null : await e2ee.encryptText(values.orderNumber) }
              : {}),
            ...(values.startDate !== undefined
              ? { startDate: values.startDate === null ? null : await e2ee.encryptText(values.startDate) }
              : {}),
            ...(values.planVanAanpak !== undefined
              ? {
                  planVanAanpak:
                    values.planVanAanpak === null
                      ? null
                      : {
                          documentId: await e2ee.encryptText(values.planVanAanpak.documentId),
                        },
                }
              : {}),
            ...(values.maxHours !== undefined ? { maxHours: values.maxHours } : {}),
            ...(values.maxAdminHours !== undefined ? { maxAdminHours: values.maxAdminHours } : {}),
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteTrajectory: (trajectoryId) => {
        setData((previous) => deleteTrajectory(previous, trajectoryId))
        runRemoteAction(deleteTrajectoryRemote(trajectoryId))
      },

      createActivityTemplate: (values) => {
        const now = Date.now()
        const name = String(values.name || '').trim()
        const category = String(values.category || '').trim()
        if (!name || !category) return ''
        const template: ActivityTemplate = {
          id: createId('activity-template'),
          name,
          description: String(values.description || '').trim(),
          category,
          defaultHours: Number.isFinite(values.defaultHours) ? Number(values.defaultHours) : 0,
          isAdmin: values.isAdmin === true,
          organizationId: values.organizationId ?? null,
          isActive: values.isActive !== false,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createActivityTemplate(previous, template).data)
        if (e2ee) {
          runRemoteAction(encryptActivityTemplate(template).then(createActivityTemplateRemote))
        }
        return template.id
      },
      updateActivityTemplate: (templateId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateActivityTemplate(previous, templateId, { ...values, updatedAtUnixMs }))
        if (!e2ee) return
        void (async () => {
          await updateActivityTemplateRemote({
            id: templateId,
            updatedAtUnixMs,
            ...(values.name !== undefined ? { name: await e2ee.encryptText(values.name.trim()) } : {}),
            ...(values.description !== undefined ? { description: await e2ee.encryptText(values.description.trim()) } : {}),
            ...(values.category !== undefined ? { category: await e2ee.encryptText(values.category.trim()) } : {}),
            ...(values.defaultHours !== undefined ? { defaultHours: values.defaultHours } : {}),
            ...(values.isAdmin !== undefined ? { isAdmin: values.isAdmin } : {}),
            ...(values.organizationId !== undefined
              ? { organizationId: values.organizationId === null ? null : await e2ee.encryptText(values.organizationId) }
              : {}),
            ...(values.isActive !== undefined ? { isActive: values.isActive } : {}),
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteActivityTemplate: (templateId) => {
        setData((previous) => deleteActivityTemplate(previous, templateId))
        runRemoteAction(deleteActivityTemplateRemote(templateId))
      },

      createActivity: (values) => {
        const now = Date.now()
        const trajectoryId = String(values.trajectoryId || '').trim()
        const name = String(values.name || '').trim()
        const category = String(values.category || '').trim()
        if (!trajectoryId || !name || !category) return ''
        const activity: Activity = {
          id: createId('activity'),
          trajectoryId,
          sessionId: values.sessionId ?? null,
          templateId: values.templateId ?? null,
          name,
          category,
          status: values.status,
          plannedHours: values.plannedHours ?? null,
          actualHours: values.actualHours ?? null,
          source: values.source ?? 'manual',
          isAdmin: values.isAdmin === true,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createActivity(previous, activity).data)
        if (e2ee) {
          runRemoteAction(encryptActivity(activity).then(createActivityRemote))
        }
        return activity.id
      },
      updateActivity: (activityId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateActivity(previous, activityId, { ...values, updatedAtUnixMs }))
        if (!e2ee) return
        void (async () => {
          await updateActivityRemote({
            id: activityId,
            updatedAtUnixMs,
            ...(values.trajectoryId !== undefined ? { trajectoryId: values.trajectoryId } : {}),
            ...(values.sessionId !== undefined ? { sessionId: values.sessionId } : {}),
            ...(values.templateId !== undefined ? { templateId: values.templateId } : {}),
            ...(values.name !== undefined ? { name: await e2ee.encryptText(values.name.trim()) } : {}),
            ...(values.category !== undefined ? { category: await e2ee.encryptText(values.category.trim()) } : {}),
            ...(values.status !== undefined ? { status: values.status } : {}),
            ...(values.plannedHours !== undefined ? { plannedHours: values.plannedHours } : {}),
            ...(values.actualHours !== undefined ? { actualHours: values.actualHours } : {}),
            ...(values.source !== undefined ? { source: values.source } : {}),
            ...(values.isAdmin !== undefined ? { isAdmin: values.isAdmin } : {}),
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteActivity: (activityId) => {
        setData((previous) => deleteActivity(previous, activityId))
        runRemoteAction(deleteActivityRemote(activityId))
      },

      createSnippet: (values) => {
        const now = Date.now()
        const trajectoryId = String(values.trajectoryId || '').trim()
        const itemId = String(values.itemId || '').trim()
        const field = String(values.field || '').trim()
        const text = String(values.text || '').trim()
        if (!trajectoryId || !itemId || !field || !text) return ''
        const snippet: Snippet = {
          id: createId('snippet'),
          trajectoryId,
          itemId,
          field,
          text,
          date: Number.isFinite(values.date) ? Number(values.date) : now,
          status: values.status ?? 'pending',
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createSnippet(previous, snippet).data)
        if (e2ee) {
          void (async () => {
            await createSnippetRemote({
              ...snippet,
              field: await e2ee.encryptText(snippet.field),
              text: await e2ee.encryptText(snippet.text),
            })
          })()
            .then(refreshFromServer)
            .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
        }
        return snippet.id
      },
      updateSnippet: (snippetId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateSnippet(previous, snippetId, { ...values, updatedAtUnixMs }))
        if (!e2ee) return
        void (async () => {
          await updateSnippetRemote({
            id: snippetId,
            updatedAtUnixMs,
            ...(values.field !== undefined ? { field: await e2ee.encryptText(values.field.trim()) } : {}),
            ...(values.text !== undefined ? { text: await e2ee.encryptText(values.text.trim()) } : {}),
            ...(values.status !== undefined ? { status: values.status } : {}),
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteSnippet: (snippetId) => {
        setData((previous) => deleteSnippet(previous, snippetId))
        runRemoteAction(deleteSnippetRemote(snippetId))
      },

      createNote: (sessionId, values) => {
        const trimmedText = values.text.trim()
        if (!trimmedText) return
        const trimmedTitle = (values.title ?? "").trim()
        const now = Date.now()
        const note: Note = {
          id: createId("note"),
          sessionId,
          title: trimmedTitle,
          text: trimmedText,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => {
          const result = createNote(previous, note)
          return result.data
        })
        if (e2ee) {
          runRemoteAction(encryptNote(note).then(createNoteRemote))
        }
      },
      updateNote: (noteId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateNote(previous, noteId, values))
        if (!e2ee) return
        void (async () => {
          const encryptedTitle = values.title !== undefined ? await e2ee.encryptText(values.title.trim()) : undefined
          const encryptedText = await e2ee.encryptText(values.text.trim())
          await updateNoteRemote({
            id: noteId,
            title: encryptedTitle,
            text: encryptedText,
            updatedAtUnixMs,
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error("[LocalAppDataProvider] Remote update failed", error))
      },
      deleteNote: (noteId) => {
        setData((previous) => deleteNote(previous, noteId))
        runRemoteAction(deleteNoteRemote(noteId))
      },

      setWrittenReport: (sessionId, text) => {
        const trimmedText = text.trim()
        if (!trimmedText) return
        const currentReport = data.writtenReports.find((report) => report.sessionId === sessionId)
        if (currentReport && currentReport.text.trim() === trimmedText) return
        const updatedAtUnixMs = Date.now()
        setData((previous) => setWrittenReport(previous, sessionId, text))
        const report: WrittenReport = { sessionId, text: trimmedText, updatedAtUnixMs }
        if (e2ee) {
          void (async () => {
            const encryptedReport = await encryptWrittenReport(report)
            let lastError: unknown = null
            for (let attempt = 1; attempt <= 4; attempt += 1) {
              try {
                await setWrittenReportRemote(encryptedReport)
                await refreshFromServer()
                return
              } catch (error) {
                lastError = error
                if (attempt >= 4) break
                await wait(220 * attempt)
              }
            }
            console.error('[LocalAppDataProvider] Failed to persist written report remotely', lastError)
          })()
        }
      },

      createTemplate: (values) => {
        const trimmedName = values.name.trim()
        if (!trimmedName) return ''
        const trimmedDescription = values.description.trim()
        const now = Date.now()
        const template: Template = {
          id: createId('template'),
          name: trimmedName,
          category: values.category,
          description: trimmedDescription,
          sections: values.sections,
          isSaved: false,
          isDefault: false,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => {
          const result = createTemplate(previous, template)
          return result.data
        })
        if (e2ee) {
          runRemoteAction(encryptTemplate(template).then(createTemplateRemote))
        }
        return template.id
      },
      updateTemplate: (templateId, values) => {
        const currentTemplate = data.templates.find((item) => item.id === templateId)
        if (currentTemplate?.isDefault) return
        const updatedAtUnixMs = Date.now()
        setData((previous) => ({
          ...previous,
          templates: previous.templates.map((template) => {
            if (template.id !== templateId) return template
            return {
              ...template,
              ...(typeof values.name === 'string' ? { name: values.name.trim() } : {}),
              ...(typeof values.description === 'string' ? { description: values.description.trim() } : {}),
              ...(values.sections ? { sections: values.sections } : {}),
              updatedAtUnixMs,
            }
          }),
        }))
        if (!e2ee) return
        void (async () => {
          const template = data.templates.find((item) => item.id === templateId)
          if (!template) return
          const nextTemplate: Template = {
            ...template,
            ...(typeof values.name === 'string' ? { name: values.name } : {}),
            ...(typeof values.description === 'string' ? { description: values.description } : {}),
            ...(values.sections ? { sections: values.sections } : {}),
            updatedAtUnixMs,
          }
          await updateTemplateRemote(await encryptTemplate(nextTemplate))
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteTemplate: (templateId) => {
        const currentTemplate = data.templates.find((item) => item.id === templateId)
        if (currentTemplate?.isDefault) return
        setData((previous) => deleteTemplate(previous, templateId))
        runRemoteAction(deleteTemplateRemote(templateId))
      },
      toggleTemplateSaved: (templateId) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => {
          const template = previous.templates.find((item) => item.id === templateId)
          if (!template) return previous
          return {
            ...previous,
            templates: previous.templates.map((item) =>
              item.id === templateId ? { ...item, isSaved: !item.isSaved, updatedAtUnixMs } : item,
            ),
          }
        })
        if (!e2ee) return
        void (async () => {
          const template = data.templates.find((item) => item.id === templateId)
          if (!template) return
          const nextTemplate: Template = { ...template, isSaved: !template.isSaved, updatedAtUnixMs }
          await updateTemplateRemote(await encryptTemplate(nextTemplate))
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      updatePracticeSettings: (values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updatePracticeSettings(previous, { ...values, updatedAtUnixMs }))
        void (async () => {
          const practiceName = values.practiceName !== undefined ? values.practiceName.trim() : undefined
          const website = values.website !== undefined ? values.website.trim() : undefined
          const visitAddress = values.visitAddress !== undefined ? values.visitAddress.trim() : undefined
          const postalAddress = values.postalAddress !== undefined ? values.postalAddress.trim() : undefined
          const postalCodeCity = values.postalCodeCity !== undefined ? values.postalCodeCity.trim() : undefined
          const contactName = values.contactName !== undefined ? values.contactName.trim() : undefined
          const contactRole = values.contactRole !== undefined ? values.contactRole.trim() : undefined
          const contactPhone = values.contactPhone !== undefined ? values.contactPhone.trim() : undefined
          const contactEmail = values.contactEmail !== undefined ? values.contactEmail.trim() : undefined
          const tintColor = values.tintColor
          const logoDataUrl = values.logoDataUrl
          const remotePracticeName = practiceName === undefined ? undefined : e2ee ? await e2ee.encryptText(practiceName) : practiceName
          const remoteWebsite = website === undefined ? undefined : e2ee ? await e2ee.encryptText(website) : website
          const remoteVisitAddress = visitAddress === undefined ? undefined : e2ee ? await e2ee.encryptText(visitAddress) : visitAddress
          const remotePostalAddress = postalAddress === undefined ? undefined : e2ee ? await e2ee.encryptText(postalAddress) : postalAddress
          const remotePostalCodeCity = postalCodeCity === undefined ? undefined : e2ee ? await e2ee.encryptText(postalCodeCity) : postalCodeCity
          const remoteContactName = contactName === undefined ? undefined : e2ee ? await e2ee.encryptText(contactName) : contactName
          const remoteContactRole = contactRole === undefined ? undefined : e2ee ? await e2ee.encryptText(contactRole) : contactRole
          const remoteContactPhone = contactPhone === undefined ? undefined : e2ee ? await e2ee.encryptText(contactPhone) : contactPhone
          const remoteContactEmail = contactEmail === undefined ? undefined : e2ee ? await e2ee.encryptText(contactEmail) : contactEmail
          const remoteTintColor = tintColor === undefined ? undefined : e2ee ? await e2ee.encryptText(tintColor) : tintColor
          const encryptedLogoDataUrl =
            logoDataUrl === undefined ? undefined : logoDataUrl === null ? null : e2ee ? await e2ee.encryptText(logoDataUrl) : logoDataUrl
          await updatePracticeSettingsRemote({
            practiceName: remotePracticeName,
            website: remoteWebsite,
            visitAddress: remoteVisitAddress,
            postalAddress: remotePostalAddress,
            postalCodeCity: remotePostalCodeCity,
            contactName: remoteContactName,
            contactRole: remoteContactRole,
            contactPhone: remoteContactPhone,
            contactEmail: remoteContactEmail,
            tintColor: remoteTintColor,
            logoDataUrl: encryptedLogoDataUrl,
            updatedAtUnixMs,
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
    }
  }, [data, e2ee, isAppDataLoaded])

  useEffect(() => {
    const now = Date.now()
    const staleSessions = data.sessions.filter((session) => {
      const isBusy = session.transcriptionStatus === 'transcribing' || session.transcriptionStatus === 'generating'
      if (!isBusy) return false
      const hasTranscript = Boolean(session.transcript && session.transcript.trim())
      if (session.transcriptionStatus === 'generating' && hasTranscript) return false
      const startedAt = Math.max(session.updatedAtUnixMs || 0, session.createdAtUnixMs || 0)
      return now - startedAt >= STALE_TRANSCRIPTION_TIMEOUT_MS
    })

    if (staleSessions.length === 0) return

    for (const session of staleSessions) {
      value.updateSession(session.id, {
        transcriptionStatus: 'error',
        transcriptionError: STALE_TRANSCRIPTION_ERROR_MESSAGE,
      })
    }
  }, [data.sessions, value.updateSession])

  return <LocalAppDataContext.Provider value={value}>{children}</LocalAppDataContext.Provider>
}

export function useLocalAppData() {
  const value = useContext(LocalAppDataContext)
  if (!value) {
    throw new Error('useLocalAppData must be used within LocalAppDataProvider')
  }
  return value
}
