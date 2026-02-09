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
  updateCoacheeName,
  updateNote,
  updateSession,
} from './localAppDataStore'
import { createId } from './createId'
import { Coachee, LocalAppData, Note, Session, SessionKind, Template, TemplateSection, WrittenReport } from './types'
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
} from '../services/appData'
import { useOptionalE2ee } from '../e2ee/E2eeProvider'

type ContextValue = {
  data: LocalAppData
  isAppDataLoaded: boolean
  reset: () => void

  createCoachee: (name: string) => string
  updateCoacheeName: (coacheeId: string, name: string) => void
  archiveCoachee: (coacheeId: string) => void
  restoreCoachee: (coacheeId: string) => void
  deleteCoachee: (coacheeId: string) => void

  createSession: (values: { coacheeId: string | null; title: string; kind: SessionKind; audioBlobId: string | null; uploadFileName: string | null }) => string
  updateSession: (
    sessionId: string,
    values: {
      coacheeId?: string | null
      title?: string
      transcript?: string | null
      summary?: string | null
      transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
      transcriptionError?: string | null
    }
  ) => void
  deleteSession: (sessionId: string) => void

  createNote: (sessionId: string, text: string) => void
  updateNote: (noteId: string, text: string) => void
  deleteNote: (noteId: string) => void

  setWrittenReport: (sessionId: string, text: string) => void

  createTemplate: (values: { name: string; sections: TemplateSection[] }) => string
  updateTemplate: (templateId: string, values: { name?: string; sections?: TemplateSection[] }) => void
  deleteTemplate: (templateId: string) => void
  toggleTemplateSaved: (templateId: string) => void
}

const LocalAppDataContext = createContext<ContextValue | null>(null)

type Props = {
  children: ReactNode
  isAuthenticated: boolean
}

export function LocalAppDataProvider({ children, isAuthenticated }: Props) {
  const e2ee = useOptionalE2ee()
  const [data, setData] = useState<LocalAppData>(() => loadLocalAppData())
  const [isAppDataLoaded, setIsAppDataLoaded] = useState(() => !isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      saveLocalAppData(data)
    }
  }, [data, isAuthenticated])

  async function decryptRemoteData(remote: LocalAppData): Promise<LocalAppData> {
    if (!e2ee) {
      const templates = Array.isArray(remote.templates) ? remote.templates : []
      return { ...remote, templates }
    }

    const coachees: Coachee[] = []
    for (const coachee of remote.coachees) {
      coachees.push({ ...coachee, name: await e2ee.decryptText(coachee.name) })
    }

    const sessions: Session[] = []
    for (const session of remote.sessions) {
      sessions.push({
        ...session,
        title: await e2ee.decryptText(session.title),
        uploadFileName: session.uploadFileName ? await e2ee.decryptText(session.uploadFileName) : null,
        transcript: session.transcript ? await e2ee.decryptText(session.transcript) : null,
        summary: session.summary ? await e2ee.decryptText(session.summary) : null,
        transcriptionError: session.transcriptionError ? await e2ee.decryptText(session.transcriptionError) : null,
      })
    }

    const notes: Note[] = []
    for (const note of remote.notes) {
      notes.push({ ...note, text: await e2ee.decryptText(note.text) })
    }

    const writtenReports: WrittenReport[] = []
    for (const report of remote.writtenReports) {
      writtenReports.push({ ...report, text: await e2ee.decryptText(report.text) })
    }

    const templates: Template[] = []
    const remoteTemplates = Array.isArray(remote.templates) ? remote.templates : []
    for (const template of remoteTemplates) {
      templates.push(await decryptTemplate(template))
    }

    return { coachees, sessions, notes, writtenReports, templates }
  }

  async function encryptCoachee(coachee: Coachee): Promise<Coachee> {
    if (!e2ee) return coachee
    return { ...coachee, name: await e2ee.encryptText(coachee.name) }
  }

  async function encryptSession(session: Session): Promise<Session> {
    if (!e2ee) return session
    return {
      ...session,
      title: await e2ee.encryptText(session.title),
      uploadFileName: session.uploadFileName ? await e2ee.encryptText(session.uploadFileName) : null,
      transcript: session.transcript ? await e2ee.encryptText(session.transcript) : null,
      summary: session.summary ? await e2ee.encryptText(session.summary) : null,
      transcriptionError: session.transcriptionError ? await e2ee.encryptText(session.transcriptionError) : null,
    }
  }

  async function encryptNote(note: Note): Promise<Note> {
    if (!e2ee) return note
    return { ...note, text: await e2ee.encryptText(note.text) }
  }

  async function encryptWrittenReport(report: WrittenReport): Promise<WrittenReport> {
    if (!e2ee) return report
    return { ...report, text: await e2ee.encryptText(report.text) }
  }

  async function decryptTemplate(template: Template): Promise<Template> {
    if (!e2ee) return template
    const sections: TemplateSection[] = []
    for (const section of template.sections) {
      sections.push({
        ...section,
        title: await e2ee.decryptText(section.title),
        description: await e2ee.decryptText(section.description),
      })
    }
    return { ...template, name: await e2ee.decryptText(template.name), sections }
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
    return { ...template, name: await e2ee.encryptText(template.name), sections }
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
        }
        setData(remote)
      } catch (error) {
        console.error('[LocalAppDataProvider] Failed to load remote app data', error)
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
      setData(remote)
    } catch (error) {
      console.error('[LocalAppDataProvider] Failed to refresh remote app data', error)
    }
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
  }


  const value = useMemo<ContextValue>(() => {
    return {
      data,
      isAppDataLoaded,
      reset: () => setData(loadLocalAppData()),

      createCoachee: (name) => {
        const trimmedName = name.trim()
        if (!trimmedName) return ''
        const now = Date.now()
        const coachee: Coachee = {
          id: createId('coachee'),
          name: trimmedName,
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
      updateCoacheeName: (coacheeId, name) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateCoacheeName(previous, coacheeId, name))
        if (!e2ee) return
        runRemoteAction(e2ee.encryptText(name.trim()).then((encrypted) => updateCoacheeRemote({ id: coacheeId, name: encrypted, updatedAtUnixMs })))
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
          uploadFileName: values.uploadFileName,
          transcript: null,
          summary: null,
          transcriptionStatus: 'idle',
          transcriptionError: null,
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
            transcript: encryptedTranscript,
            summary: encryptedSummary,
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

      createNote: (sessionId, text) => {
        const trimmedText = text.trim()
        if (!trimmedText) return
        const now = Date.now()
        const note: Note = {
          id: createId('note'),
          sessionId,
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
      updateNote: (noteId, text) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateNote(previous, noteId, text))
        if (!e2ee) return
        runRemoteAction(e2ee.encryptText(text.trim()).then((encrypted) => updateNoteRemote({ id: noteId, text: encrypted, updatedAtUnixMs })))
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
          runRemoteAction(encryptWrittenReport(report).then(setWrittenReportRemote))
        }
      },

      createTemplate: (values) => {
        const trimmedName = values.name.trim()
        if (!trimmedName) return ''
        const now = Date.now()
        const template: Template = {
          id: createId('template'),
          name: trimmedName,
          sections: values.sections,
          isSaved: false,
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
        const updatedAtUnixMs = Date.now()
        setData((previous) => ({
          ...previous,
          templates: previous.templates.map((template) => {
            if (template.id !== templateId) return template
            return {
              ...template,
              ...(typeof values.name === 'string' ? { name: values.name.trim() } : {}),
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
            ...(values.sections ? { sections: values.sections } : {}),
            updatedAtUnixMs,
          }
          await updateTemplateRemote(await encryptTemplate(nextTemplate))
        })()
          .then(refreshFromServer)
          .catch((error: unknown) => console.error('[LocalAppDataProvider] Remote update failed', error))
      },
      deleteTemplate: (templateId) => {
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
    }
  }, [data, e2ee, isAppDataLoaded])

  return <LocalAppDataContext.Provider value={value}>{children}</LocalAppDataContext.Provider>
}

export function useLocalAppData() {
  const value = useContext(LocalAppDataContext)
  if (!value) {
    throw new Error('useLocalAppData must be used within LocalAppDataProvider')
  }
  return value
}

