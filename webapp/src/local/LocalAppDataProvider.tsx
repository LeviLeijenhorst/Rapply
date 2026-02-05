import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import {
  archiveCoachee,
  createCoachee,
  createNote,
  createSession,
  deleteCoachee,
  deleteNote,
  deleteSession,
  loadLocalAppData,
  restoreCoachee,
  saveLocalAppData,
  setWrittenReport,
  updateCoacheeName,
  updateNote,
  updateSession,
} from './localAppDataStore'
import { createId } from './createId'
import { Coachee, LocalAppData, Note, Session, SessionKind, WrittenReport } from './types'
import {
  createCoacheeRemote,
  createNoteRemote,
  createSessionRemote,
  deleteCoacheeRemote,
  deleteNoteRemote,
  deleteSessionRemote,
  readAppData,
  setWrittenReportRemote,
  updateCoacheeRemote,
  updateNoteRemote,
  updateSessionRemote,
} from '../services/appData'

type ContextValue = {
  data: LocalAppData
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
}

const LocalAppDataContext = createContext<ContextValue | null>(null)

type Props = {
  children: ReactNode
}

export function LocalAppDataProvider({ children }: Props) {
  const [data, setData] = useState<LocalAppData>(() => loadLocalAppData())

  useEffect(() => {
    saveLocalAppData(data)
  }, [data])

  useEffect(() => {
    let isActive = true
    void (async () => {
      try {
        const remote = await readAppData()
        if (!isActive) return
        if (isEmptyAppData(remote)) {
          const localSnapshot = loadLocalAppData()
          if (!isEmptyAppData(localSnapshot)) {
            await seedRemoteFromLocal(localSnapshot)
            const seeded = await readAppData()
            if (!isActive) return
            setData(seeded)
            return
          }
        }
        setData(remote)
      } catch (error) {
        console.error('[LocalAppDataProvider] Failed to load remote app data', error)
      }
    })()
    return () => {
      isActive = false
    }
  }, [])

  async function refreshFromServer() {
    try {
      const remote = await readAppData()
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
    return next.coachees.length === 0 && next.sessions.length === 0 && next.notes.length === 0 && next.writtenReports.length === 0
  }

  async function seedRemoteFromLocal(localSnapshot: LocalAppData) {
    for (const coachee of localSnapshot.coachees) {
      await createCoacheeRemote(coachee)
    }
    for (const session of localSnapshot.sessions) {
      await createSessionRemote(session)
    }
    for (const note of localSnapshot.notes) {
      await createNoteRemote(note)
    }
    for (const report of localSnapshot.writtenReports) {
      await setWrittenReportRemote(report)
    }
  }

  const value = useMemo<ContextValue>(() => {
    return {
      data,
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
        runRemoteAction(createCoacheeRemote(coachee))
        return coachee.id
      },
      updateCoacheeName: (coacheeId, name) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateCoacheeName(previous, coacheeId, name))
        runRemoteAction(updateCoacheeRemote({ id: coacheeId, name: name.trim(), updatedAtUnixMs }))
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
        runRemoteAction(createSessionRemote(session))
        return session.id
      },
      updateSession: (sessionId, values) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateSession(previous, sessionId, values))
        runRemoteAction(
          updateSessionRemote({
            id: sessionId,
            updatedAtUnixMs,
            coacheeId: values.coacheeId,
            title: values.title,
            transcript: values.transcript,
            summary: values.summary,
            transcriptionStatus: values.transcriptionStatus,
            transcriptionError: values.transcriptionError,
          }),
        )
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
        runRemoteAction(createNoteRemote(note))
      },
      updateNote: (noteId, text) => {
        const updatedAtUnixMs = Date.now()
        setData((previous) => updateNote(previous, noteId, text))
        runRemoteAction(updateNoteRemote({ id: noteId, text: text.trim(), updatedAtUnixMs }))
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
        runRemoteAction(setWrittenReportRemote(report))
      },
    }
  }, [data])

  return <LocalAppDataContext.Provider value={value}>{children}</LocalAppDataContext.Provider>
}

export function useLocalAppData() {
  const value = useContext(LocalAppDataContext)
  if (!value) {
    throw new Error('useLocalAppData must be used within LocalAppDataProvider')
  }
  return value
}

