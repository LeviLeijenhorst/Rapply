import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { reportApi } from '../api/reports/reportApi'
import { snippetApi } from '../api/snippets/snippetApi'

import { createId } from '../utils/createId'
import {
  archiveClient,
  createClient,
  createInput,
  createNote,
  createSnippet,
  createTemplate,
  createTrajectory,
  deleteClient,
  deleteInput,
  deleteNote,
  deleteSnippet,
  deleteTemplate,
  deleteTrajectory,
  loadLocalAppData,
  restoreClient,
  saveLocalAppData,
  setInputSummary,
  toggleTemplateSaved,
  updateClient,
  updateInput,
  updateNote,
  updateOrganizationSettings,
  updateSnippet,
  updateTemplate,
  updateTrajectory,
  updateUserSettings,
} from './localAppDataStore'
import type { Client, Input, LocalAppData, Note, Snippet, Template, TemplateCategory, TemplateSection, Trajectory } from './types'

type ContextValue = {
  data: LocalAppData
  isAppDataLoaded: boolean
  reset: () => void

  createClient: (values: { name: string; clientDetails?: string; employerDetails?: string }) => string
  updateClient: (clientId: string, values: { name?: string; clientDetails?: string; employerDetails?: string }) => void
  archiveClient: (clientId: string) => void
  restoreClient: (clientId: string) => void
  deleteClient: (clientId: string) => void

  createInput: (values: {
    clientId: string | null
    trajectoryId?: string | null
    title: string
    type?: Input['type']
    kind?: Input['kind']
    audioBlobId: string | null
    audioDurationSeconds: number | null
    uploadFileName: string | null
    transcriptionStatus?: Input['transcriptionStatus']
    transcriptionError?: string | null
  }) => string
  updateInput: (inputId: string, values: Partial<Omit<Input, 'id'>>) => void
  deleteInput: (inputId: string) => void
  createSession: (values: {
    clientId: string | null
    trajectoryId?: string | null
    title: string
    kind: Input['kind']
    audioBlobId: string | null
    audioDurationSeconds: number | null
    uploadFileName: string | null
    transcriptionStatus?: Input['transcriptionStatus']
    transcriptionError?: string | null
  }) => string
  updateSession: (sessionId: string, values: Partial<Omit<Input, 'id'>>) => void
  deleteSession: (sessionId: string) => void

  createTrajectory: (values: {
    clientId: string
    name: string
    uwvContactName?: string | null
    orderNumber?: string | null
    startDate?: string | null
  }) => string
  updateTrajectory: (
    trajectoryId: string,
    values: {
      clientId?: string
      name?: string
      uwvContactName?: string | null
      orderNumber?: string | null
      startDate?: string | null
    },
  ) => void
  deleteTrajectory: (trajectoryId: string) => void

  createSnippet: (values: {
    id?: string
    itemId?: string
    createdAtUnixMs?: number
    updatedAtUnixMs?: number
    trajectoryId: string
    inputId: string
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

  setInputSummary: (inputId: string, text: string) => void
  setWrittenReport: (sessionId: string, text: string) => void

  createTemplate: (values: { name: string; category: TemplateCategory; description: string; sections: TemplateSection[] }) => string
  updateTemplate: (templateId: string, values: { name?: string; description?: string; sections?: TemplateSection[] }) => void
  deleteTemplate: (templateId: string) => void
  toggleTemplateSaved: (templateId: string) => void

  updateOrganizationSettings: (values: {
    name?: string
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
  updateUserSettings: (values: {
    name?: string
    role?: string
    phone?: string
    email?: string
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
  const [data, setData] = useState<LocalAppData>(() => loadLocalAppData())
  const [isAppDataLoaded, setIsAppDataLoaded] = useState(() => !isAuthenticated)

  useEffect(() => {
    saveLocalAppData(data)
  }, [data])

  useEffect(() => {
    setIsAppDataLoaded(true)
  }, [isAuthenticated])

  const legacyCompatibleData = useMemo<LocalAppData>(
    () => ({
      ...data,
      coachees: data.clients,
      sessions: data.inputs,
      writtenReports: data.inputSummaries.map((summary) => ({
        sessionId: summary.inputId,
        text: summary.text,
        updatedAtUnixMs: summary.updatedAtUnixMs,
      })),
      practiceSettings:
        data.practiceSettings ??
        {
          practiceName: data.organizationSettings.name,
          website: data.organizationSettings.website,
          visitAddress: data.organizationSettings.visitAddress,
          postalAddress: data.organizationSettings.postalAddress,
          postalCodeCity: data.organizationSettings.postalCodeCity,
          contactName: data.userSettings.name,
          contactRole: data.userSettings.role,
          contactPhone: data.userSettings.phone,
          contactEmail: data.userSettings.email,
          tintColor: data.organizationSettings.tintColor ?? '#BE0165',
          logoDataUrl: data.organizationSettings.logoDataUrl ?? null,
          updatedAtUnixMs: Math.max(data.organizationSettings.updatedAtUnixMs, data.userSettings.updatedAtUnixMs),
        },
    }),
    [data],
  )

  const value = useMemo<ContextValue>(
    () => ({
      data: legacyCompatibleData,
      isAppDataLoaded,
      reset: () => setData(loadLocalAppData()),

      createClient: (values) => {
        const now = Date.now()
        const client: Client = {
          id: createId('client'),
          name: values.name,
          clientDetails: values.clientDetails ?? '',
          employerDetails: values.employerDetails ?? '',
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
          isArchived: false,
        }
        setData((previous) => createClient(previous, client))
        return client.id
      },
      updateClient: (clientId, values) => setData((previous) => updateClient(previous, clientId, values)),
      archiveClient: (clientId) => setData((previous) => archiveClient(previous, clientId)),
      restoreClient: (clientId) => setData((previous) => restoreClient(previous, clientId)),
      deleteClient: (clientId) => setData((previous) => deleteClient(previous, clientId)),

      createInput: (values) => {
        const now = Date.now()
        const input: Input = {
          id: createId('input'),
          clientId: values.clientId,
          trajectoryId: values.trajectoryId ?? null,
          title: values.title,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
          type: values.type ?? (values.kind === 'recording' ? 'recorded-session' : values.kind === 'upload' ? 'uploaded-session' : values.kind === 'written' ? 'written-recap' : 'spoken-recap'),
          kind: values.kind ?? (values.type === 'recorded-session' ? 'recording' : values.type === 'uploaded-session' ? 'upload' : values.type === 'written-recap' ? 'written' : 'intake'),
          audioBlobId: values.audioBlobId,
          audioDurationSeconds: values.audioDurationSeconds,
          uploadFileName: values.uploadFileName,
          transcript: null,
          summary: null,
          reportDate: null,
          transcriptionStatus: values.transcriptionStatus ?? 'idle',
          transcriptionError: values.transcriptionError ?? null,
        }
        setData((previous) => createInput(previous, input))
        return input.id
      },
      updateInput: (inputId, values) => setData((previous) => updateInput(previous, inputId, values)),
      deleteInput: (inputId) => setData((previous) => deleteInput(previous, inputId)),
      createSession: (values) => {
        const now = Date.now()
        const type: Input['type'] =
          values.kind === 'recording'
            ? 'recorded-session'
            : values.kind === 'upload'
              ? 'uploaded-session'
              : values.kind === 'written'
                ? 'written-recap'
                : 'spoken-recap'
        const input: Input = {
          id: createId('input'),
          clientId: values.clientId,
          trajectoryId: values.trajectoryId ?? null,
          title: values.title,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
          type,
          kind: values.kind,
          audioBlobId: values.audioBlobId,
          audioDurationSeconds: values.audioDurationSeconds,
          uploadFileName: values.uploadFileName,
          transcript: null,
          summary: null,
          reportDate: null,
          transcriptionStatus: values.transcriptionStatus ?? 'idle',
          transcriptionError: values.transcriptionError ?? null,
        }
        setData((previous) => createInput(previous, input))
        return input.id
      },
      updateSession: (sessionId, values) => setData((previous) => updateInput(previous, sessionId, values)),
      deleteSession: (sessionId) => setData((previous) => deleteInput(previous, sessionId)),

      createTrajectory: (values) => {
        const now = Date.now()
        const trajectory: Trajectory = {
          id: createId('trajectory'),
          clientId: values.clientId,
          name: values.name,
          uwvContactName: values.uwvContactName ?? null,
          orderNumber: values.orderNumber ?? null,
          startDate: values.startDate ?? null,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createTrajectory(previous, trajectory))
        return trajectory.id
      },
      updateTrajectory: (trajectoryId, values) => setData((previous) => updateTrajectory(previous, trajectoryId, values)),
      deleteTrajectory: (trajectoryId) => setData((previous) => deleteTrajectory(previous, trajectoryId)),

      createSnippet: (values) => {
        const now = Date.now()
        const snippet: Snippet = {
          id: values.id ?? createId('snippet'),
          trajectoryId: values.trajectoryId,
          inputId: values.inputId,
          itemId: values.itemId ?? values.inputId,
          field: values.field,
          text: values.text,
          date: values.date,
          status: values.status ?? 'pending',
          createdAtUnixMs: values.createdAtUnixMs ?? now,
          updatedAtUnixMs: values.updatedAtUnixMs ?? now,
        }
        setData((previous) => createSnippet(previous, snippet))
        return snippet.id
      },
      updateSnippet: (snippetId, values) => {
        const now = Date.now()
        const currentSnippet = data.snippets.find((snippet) => snippet.id === snippetId) ?? null
        setData((previous) => updateSnippet(previous, snippetId, values))
        if (!currentSnippet) return

        void snippetApi
          .update({
            id: snippetId,
            field: values.field,
            text: values.text,
            status: values.status,
            updatedAtUnixMs: now,
          })
          .catch((error) => {
            console.warn('[LocalAppDataProvider] Failed to update snippet remotely', { snippetId, error })
          })
      },
      deleteSnippet: (snippetId) => {
        const currentSnippet = data.snippets.find((snippet) => snippet.id === snippetId) ?? null
        setData((previous) => deleteSnippet(previous, snippetId))
        if (!currentSnippet) return

        void snippetApi.delete(snippetId).catch((error) => {
          console.warn('[LocalAppDataProvider] Failed to delete snippet remotely', { snippetId, error })
        })
      },

      createNote: (sessionId, values) => {
        const now = Date.now()
        const note: Note = {
          id: createId('note'),
          sessionId,
          title: values.title,
          text: values.text,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createNote(previous, note))
      },
      updateNote: (noteId, values) => setData((previous) => updateNote(previous, noteId, values)),
      deleteNote: (noteId) => setData((previous) => deleteNote(previous, noteId)),

      setInputSummary: (inputId, text) => setData((previous) => setInputSummary(previous, inputId, text)),
      setWrittenReport: (sessionId, text) => {
        const now = Date.now()
        const input = data.inputs.find((item) => item.id === sessionId) ?? null
        const previousSummary = data.inputSummaries.find((item) => item.inputId === sessionId)?.text ?? null

        setData((previous) => setInputSummary(previous, sessionId, text))
        if (previousSummary === text) return

        void reportApi
          .save({
            sourceSessionId: sessionId,
            clientId: input?.clientId ?? null,
            trajectoryId: input?.trajectoryId ?? null,
            title: String(input?.title || '').trim() || 'Rapportage',
            reportType: 'session_report',
            state: 'needs_review',
            reportText: String(text || ''),
            reportDate: input?.reportDate ?? null,
            createdAtUnixMs: input?.createdAtUnixMs ?? now,
            updatedAtUnixMs: now,
          })
          .catch((error) => {
            console.warn('[LocalAppDataProvider] Failed to save report remotely', { sessionId, error })
          })
      },

      createTemplate: (values) => {
        const now = Date.now()
        const template: Template = {
          id: createId('template'),
          name: values.name,
          category: values.category,
          description: values.description,
          sections: values.sections,
          isDefault: false,
          isSaved: true,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createTemplate(previous, template))
        return template.id
      },
      updateTemplate: (templateId, values) => setData((previous) => updateTemplate(previous, templateId, values)),
      deleteTemplate: (templateId) => setData((previous) => deleteTemplate(previous, templateId)),
      toggleTemplateSaved: (templateId) => setData((previous) => toggleTemplateSaved(previous, templateId)),

      updateOrganizationSettings: (values) => setData((previous) => updateOrganizationSettings(previous, values)),
      updateUserSettings: (values) => setData((previous) => updateUserSettings(previous, values)),
    }),
    [data, isAppDataLoaded, legacyCompatibleData],
  )

  useEffect(() => {
    const now = Date.now()
    const staleInputs = data.inputs.filter((input) => {
      if (input.transcriptionStatus !== 'transcribing' && input.transcriptionStatus !== 'generating') return false
      return now - input.updatedAtUnixMs > STALE_TRANSCRIPTION_TIMEOUT_MS
    })
    if (staleInputs.length === 0) return

    for (const input of staleInputs) {
      value.updateInput(input.id, {
        transcriptionStatus: 'error',
        transcriptionError: STALE_TRANSCRIPTION_ERROR_MESSAGE,
      })
    }
  }, [data.inputs, value])

  return <LocalAppDataContext.Provider value={value}>{children}</LocalAppDataContext.Provider>
}

export function useLocalAppData() {
  const value = useContext(LocalAppDataContext)
  if (!value) throw new Error('useLocalAppData must be used within LocalAppDataProvider')
  return value
}



