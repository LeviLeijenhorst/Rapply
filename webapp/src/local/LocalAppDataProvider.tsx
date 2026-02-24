import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import {
  archiveCoachee,
  createCoachee,
  createNote,
  createSession,
  createTemplate,
  deleteCoachee,
  deleteNote,
  deleteSession,
  deleteTemplate,
  loadLocalAppData,
  restoreCoachee,
  saveLocalAppData,
  setWrittenReport,
  updatePracticeSettings,
  updateCoachee,
  updateNote,
  updateSession,
} from './localAppDataStore'
import { createId } from './createId'
import { Coachee, LocalAppData, Note, PracticeSettings, Session, SessionKind, Template, TemplateSection, WrittenReport } from './types'
import {
  createCoacheeRemote,
  createNoteRemote,
  createSessionRemote,
  createTemplateRemote,
  deleteCoacheeRemote,
  deleteNoteRemote,
  deleteSessionRemote,
  deleteTemplateRemote,
  readAppData,
  readDefaultTemplates,
  setWrittenReportRemote,
  updateCoacheeRemote,
  updateNoteRemote,
  updateSessionRemote,
  updateTemplateRemote,
  updatePracticeSettingsRemote,
} from '../services/appData'
import { useOptionalE2ee } from '../e2ee/E2eeProvider'

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
    title: string
    kind: SessionKind
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
      title?: string
      audioBlobId?: string | null
      audioDurationSeconds?: number | null
      uploadFileName?: string | null
      transcript?: string | null
      summary?: string | null
      reportDate?: string | null
      wvpWeekNumber?: string | null
      reportFirstSickDay?: string | null
      transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
      transcriptionError?: string | null
    }
  ) => void
  deleteSession: (sessionId: string) => void

  createNote: (sessionId: string, values: { title: string; text: string }) => void
  updateNote: (noteId: string, values: { title?: string; text: string }) => void
  deleteNote: (noteId: string) => void

  setWrittenReport: (sessionId: string, text: string) => void

  createTemplate: (values: { name: string; description: string; sections: TemplateSection[] }) => string
  updateTemplate: (templateId: string, values: { name?: string; description?: string; sections?: TemplateSection[] }) => void
  deleteTemplate: (templateId: string) => void
  toggleTemplateSaved: (templateId: string) => void
  updatePracticeSettings: (values: { practiceName?: string; website?: string; tintColor?: string; logoDataUrl?: string | null }) => void
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
      const templates = Array.isArray(remote.templates) ? remote.templates : []
      return { ...remote, templates, practiceSettings: remote.practiceSettings }
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
        reportDate: session.reportDate ? await decryptTextCompat(session.reportDate) : null,
        wvpWeekNumber: session.wvpWeekNumber ? await decryptTextCompat(session.wvpWeekNumber) : null,
        reportFirstSickDay: session.reportFirstSickDay ? await decryptTextCompat(session.reportFirstSickDay) : null,
        transcriptionError: session.transcriptionError ? await decryptTextCompat(session.transcriptionError) : null,
        audioDurationSeconds: typeof session.audioDurationSeconds === 'number' ? session.audioDurationSeconds : null,
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
      tintColor: await decryptTextCompat(remote.practiceSettings.tintColor),
      logoDataUrl: remote.practiceSettings.logoDataUrl ? await decryptTextCompat(remote.practiceSettings.logoDataUrl) : null,
      updatedAtUnixMs: remote.practiceSettings.updatedAtUnixMs,
    }

    return { coachees, sessions, notes, writtenReports, templates, practiceSettings }
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
      reportDate: session.reportDate ? await e2ee.encryptText(session.reportDate) : null,
      wvpWeekNumber: session.wvpWeekNumber ? await e2ee.encryptText(session.wvpWeekNumber) : null,
      reportFirstSickDay: session.reportFirstSickDay ? await e2ee.encryptText(session.reportFirstSickDay) : null,
      transcriptionError: session.transcriptionError ? await e2ee.encryptText(session.transcriptionError) : null,
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
      next.sessions.length === 0 &&
      next.notes.length === 0 &&
      next.writtenReports.length === 0 &&
      next.templates.length === 0
    )
  }

  async function seedRemoteFromLocal(localSnapshot: LocalAppData) {
    for (const coachee of localSnapshot.coachees) {
      await createCoacheeRemote(await encryptCoachee(coachee))
    }
    for (const session of localSnapshot.sessions) {
      await createSessionRemote(await encryptSession(session))
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
          title,
          kind: values.kind,
          audioBlobId: values.audioBlobId,
          audioDurationSeconds: values.audioDurationSeconds,
          uploadFileName: values.uploadFileName,
          transcript: null,
          summary: null,
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
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateSession(previous, sessionId, values))
        if (!e2ee) return
        void (async () => {
          const encryptedTitle = typeof values.title === 'string' ? await e2ee.encryptText(values.title) : undefined
          const encryptedUploadFileName =
            values.uploadFileName === undefined ? undefined : values.uploadFileName === null ? null : await e2ee.encryptText(values.uploadFileName)
          const encryptedTranscript = values.transcript === undefined ? undefined : values.transcript === null ? null : await e2ee.encryptText(values.transcript)
          const encryptedSummary = values.summary === undefined ? undefined : values.summary === null ? null : await e2ee.encryptText(values.summary)
          const encryptedError =
            values.transcriptionError === undefined
              ? undefined
              : values.transcriptionError === null
                ? null
                : await e2ee.encryptText(values.transcriptionError)
          await updateSessionRemote({
            id: sessionId,
            updatedAtUnixMs,
            coacheeId: values.coacheeId,
            title: encryptedTitle,
            audioBlobId: values.audioBlobId,
            audioDurationSeconds: values.audioDurationSeconds,
            uploadFileName: encryptedUploadFileName,
            transcript: encryptedTranscript,
            summary: encryptedSummary,
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
          })
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteSession: (sessionId) => {
        setData((previous) => deleteSession(previous, sessionId))
        runRemoteAction(deleteSessionRemote(sessionId))
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
        const updatedAtUnixMs = Date.now()
        setData((previous) => setWrittenReport(previous, sessionId, text))
        const trimmedText = text.trim()
        if (!trimmedText) return
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
        if (!e2ee) return
        void (async () => {
          const encryptedPracticeName = values.practiceName !== undefined ? await e2ee.encryptText(values.practiceName.trim()) : undefined
          const encryptedWebsite = values.website !== undefined ? await e2ee.encryptText(values.website.trim()) : undefined
          const encryptedTintColor = values.tintColor !== undefined ? await e2ee.encryptText(values.tintColor) : undefined
          const encryptedLogoDataUrl =
            values.logoDataUrl === undefined ? undefined : values.logoDataUrl === null ? null : await e2ee.encryptText(values.logoDataUrl)
          await updatePracticeSettingsRemote({
            practiceName: encryptedPracticeName,
            website: encryptedWebsite,
            tintColor: encryptedTintColor,
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
