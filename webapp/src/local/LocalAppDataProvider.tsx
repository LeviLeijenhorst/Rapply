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
import { LocalAppData, SessionKind } from './types'

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

  const value = useMemo<ContextValue>(() => {
    return {
      data,
      reset: () => setData(loadLocalAppData()),

      createCoachee: (name) => {
        let createdCoacheeId = ''
        setData((previous) => {
          const result = createCoachee(previous, name)
          const newCoachee = result.coachees.find((c) => c.name === name.trim() && !c.isArchived)
          if (newCoachee) {
            createdCoacheeId = newCoachee.id
          }
          return result
        })
        return createdCoacheeId
      },
      updateCoacheeName: (coacheeId, name) => setData((previous) => updateCoacheeName(previous, coacheeId, name)),
      archiveCoachee: (coacheeId) => setData((previous) => archiveCoachee(previous, coacheeId)),
      restoreCoachee: (coacheeId) => setData((previous) => restoreCoachee(previous, coacheeId)),
      deleteCoachee: (coacheeId) => setData((previous) => deleteCoachee(previous, coacheeId)),

      createSession: (values) => {
        let createdSessionId = ''
        setData((previous) => {
          const result = createSession(previous, values)
          createdSessionId = result.sessionId
          return result.data
        })
        return createdSessionId
      },
      updateSession: (sessionId, values) => setData((previous) => updateSession(previous, sessionId, values)),
      deleteSession: (sessionId) => setData((previous) => deleteSession(previous, sessionId)),

      createNote: (sessionId, text) => setData((previous) => createNote(previous, sessionId, text)),
      updateNote: (noteId, text) => setData((previous) => updateNote(previous, noteId, text)),
      deleteNote: (noteId) => setData((previous) => deleteNote(previous, noteId)),

      setWrittenReport: (sessionId, text) => setData((previous) => setWrittenReport(previous, sessionId, text)),
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

