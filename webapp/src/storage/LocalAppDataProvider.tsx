import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readAppData } from '../api/appData/appDataApi'
import { clientApi } from '../api/clients/clientApi'
import { createNoteRemote, deleteNoteRemote, updateNoteRemote } from '../api/notes/noteApi'
import { approveSnippet as approvePipelineSnippet, rejectSnippet as rejectPipelineSnippet } from '../api/pipeline/pipelineApi'
import { updateOrganizationSettingsRemote, updateUserSettingsRemote } from '../api/practice/practiceSettingsApi'
import { reportApi } from '../api/reports/reportApi'
import { sessionApi } from '../api/sessions/sessionApi'
import { snippetApi } from '../api/snippets/snippetApi'
import { useOptionalE2ee } from '../security/providers/E2eeProvider'
import { createTrajectoryRemote, deleteTrajectoryRemote, updateTrajectoryRemote } from '../api/trajectories/trajectoryApi'
import { createId } from '../utils/createId'
import { decryptAppDataTextFields } from './decryptAppData'
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
  deleteReport,
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
  upsertReport,
} from './localAppDataStore'
import type {
  Client,
  Input,
  LocalAppData,
  Note,
  Report,
  Snippet,
  Template,
  TemplateCategory,
  TemplateSection,
  Trajectory,
} from './types'

type ContextValue = {
  data: LocalAppData
  isAppDataLoaded: boolean
  refreshAppData: () => Promise<void>
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
  deleteReport: (reportId: string) => void
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
    trajectoryId: string | null
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

  createNote: (
    inputId: string | null,
    values: { title: string; text: string },
    options?: { clientId?: string | null; sourceInputId?: string | null },
  ) => void
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
    visitPostalCodeCity?: string
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

function mapTypeToKind(type: Input['type']): Input['kind'] {
  if (type === 'recorded-session') return 'recording'
  if (type === 'uploaded-session' || type === 'uploaded-document') return 'upload'
  if (type === 'written-recap') return 'written'
  return 'intake'
}

function mapKindToType(kind: Input['kind']): Input['type'] {
  if (kind === 'recording') return 'recorded-session'
  if (kind === 'upload') return 'uploaded-session'
  if (kind === 'written') return 'written-recap'
  return 'spoken-recap'
}

export function LocalAppDataProvider({ children, isAuthenticated }: Props) {
  const [data, setData] = useState<LocalAppData>(() => loadLocalAppData())
  const [isAppDataLoaded, setIsAppDataLoaded] = useState(() => !isAuthenticated)
  const e2ee = useOptionalE2ee()

  const refreshAppData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsAppDataLoaded(true)
      return
    }
    try {
      const remoteData = await readAppData()
      const nextData = e2ee ? await decryptAppDataTextFields(remoteData, e2ee) : remoteData
      setData(nextData)
    } catch (error) {
      console.warn('[LocalAppDataProvider] Failed to refresh app data from server', error)
    } finally {
      setIsAppDataLoaded(true)
    }
  }, [e2ee, isAuthenticated])

  const runRemoteMutation = useCallback(
    (label: string, operation: () => Promise<void>, shouldRefresh = false) => {
      void operation()
        .then(() => {
          if (shouldRefresh) {
            void refreshAppData()
          }
        })
        .catch((error) => {
          console.warn(`[LocalAppDataProvider] Failed remote mutation: ${label}`, error)
        })
    },
    [refreshAppData],
  )

  useEffect(() => {
    saveLocalAppData(data)
  }, [data])

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAppDataLoaded(true)
      return
    }
    setIsAppDataLoaded(false)
    void refreshAppData()
  }, [isAuthenticated, refreshAppData])

  const value = useMemo<ContextValue>(
    () => ({
      data,
      isAppDataLoaded,
      refreshAppData,
      reset: () => {
        if (isAuthenticated) {
          void refreshAppData()
          return
        }
        setData(loadLocalAppData())
      },

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
        runRemoteMutation('create client', () => clientApi.create(client))
        return client.id
      },
      updateClient: (clientId, values) => {
        const now = Date.now()
        setData((previous) => updateClient(previous, clientId, values))
        runRemoteMutation('update client', () =>
          clientApi.update({
            id: clientId,
            updatedAtUnixMs: now,
            ...values,
          }),
        )
      },
      archiveClient: (clientId) => {
        const now = Date.now()
        setData((previous) => archiveClient(previous, clientId))
        runRemoteMutation('archive client', () =>
          clientApi.update({
            id: clientId,
            isArchived: true,
            updatedAtUnixMs: now,
          }),
        )
      },
      restoreClient: (clientId) => {
        const now = Date.now()
        setData((previous) => restoreClient(previous, clientId))
        runRemoteMutation('restore client', () =>
          clientApi.update({
            id: clientId,
            isArchived: false,
            updatedAtUnixMs: now,
          }),
        )
      },
      deleteClient: (clientId) => {
        setData((previous) => deleteClient(previous, clientId))
        runRemoteMutation('delete client', () => clientApi.delete(clientId), true)
      },

      createInput: (values) => {
        const now = Date.now()
        const type = values.type ?? mapKindToType(values.kind ?? 'intake')
        const input: Input = {
          id: createId('input'),
          clientId: values.clientId,
          trajectoryId: values.trajectoryId ?? null,
          title: values.title,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
          type,
          kind: values.kind ?? mapTypeToKind(type),
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
        runRemoteMutation('create input', () => sessionApi.create(input))
        return input.id
      },
      updateInput: (inputId, values) => {
        const updatedAtUnixMs = values.updatedAtUnixMs ?? Date.now()
        setData((previous) => updateInput(previous, inputId, values))
        runRemoteMutation('update input', () =>
          sessionApi.update({
            id: inputId,
            updatedAtUnixMs,
            clientId: values.clientId,
            trajectoryId: values.trajectoryId,
            title: values.title,
            createdAtUnixMs: values.createdAtUnixMs,
            type: values.type,
            audioBlobId: values.audioBlobId,
            audioDurationSeconds: values.audioDurationSeconds,
            uploadFileName: values.uploadFileName,
            transcript: values.transcript,
            summary: values.summary,
            summaryStructured: values.summaryStructured,
            reportDate: values.reportDate,
            transcriptionStatus: values.transcriptionStatus,
            transcriptionError: values.transcriptionError,
          }),
        )
      },
      deleteInput: (inputId) => {
        setData((previous) => deleteInput(previous, inputId))
        runRemoteMutation('delete input', () => sessionApi.delete(inputId), true)
      },
      deleteReport: (reportId) => {
        setData((previous) => deleteReport(previous, reportId))
        runRemoteMutation('delete report', () => reportApi.delete(reportId), true)
      },
      createSession: (values) => {
        const now = Date.now()
        const input: Input = {
          id: createId('input'),
          clientId: values.clientId,
          trajectoryId: values.trajectoryId ?? null,
          title: values.title,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
          type: mapKindToType(values.kind),
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
        runRemoteMutation('create session', () => sessionApi.create(input))
        return input.id
      },
      updateSession: (sessionId, values) => {
        const updatedAtUnixMs = values.updatedAtUnixMs ?? Date.now()
        setData((previous) => updateInput(previous, sessionId, values))
        runRemoteMutation('update session', () =>
          sessionApi.update({
            id: sessionId,
            updatedAtUnixMs,
            clientId: values.clientId,
            trajectoryId: values.trajectoryId,
            title: values.title,
            createdAtUnixMs: values.createdAtUnixMs,
            type: values.type,
            audioBlobId: values.audioBlobId,
            audioDurationSeconds: values.audioDurationSeconds,
            uploadFileName: values.uploadFileName,
            transcript: values.transcript,
            summary: values.summary,
            summaryStructured: values.summaryStructured,
            reportDate: values.reportDate,
            transcriptionStatus: values.transcriptionStatus,
            transcriptionError: values.transcriptionError,
          }),
        )
      },
      deleteSession: (sessionId) => {
        setData((previous) => deleteInput(previous, sessionId))
        runRemoteMutation('delete session', () => sessionApi.delete(sessionId), true)
      },

      createTrajectory: (values) => {
        const now = Date.now()
        const trajectory: Trajectory = {
          id: createId('trajectory'),
          clientId: values.clientId,
          isActive: true,
          name: values.name,
          serviceType: null,
          uwvContactName: values.uwvContactName ?? null,
          uwvContactPhone: null,
          uwvContactEmail: null,
          orderNumber: values.orderNumber ?? null,
          startDate: values.startDate ?? null,
          planOfAction: null,
          maxHours: 0,
          maxAdminHours: 0,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createTrajectory(previous, trajectory))
        runRemoteMutation('create trajectory', () => createTrajectoryRemote(trajectory))
        return trajectory.id
      },
      updateTrajectory: (trajectoryId, values) => {
        const now = Date.now()
        setData((previous) => updateTrajectory(previous, trajectoryId, values))
        runRemoteMutation('update trajectory', () =>
          updateTrajectoryRemote({
            id: trajectoryId,
            updatedAtUnixMs: now,
            ...values,
          }),
        )
      },
      deleteTrajectory: (trajectoryId) => {
        setData((previous) => deleteTrajectory(previous, trajectoryId))
        runRemoteMutation('delete trajectory', () => deleteTrajectoryRemote(trajectoryId), true)
      },

      createSnippet: (values) => {
        const now = Date.now()
        const inputId = values.inputId
        const fieldId = values.field
        const snippet: Snippet = {
          id: values.id ?? createId('snippet'),
          clientId: data.inputs.find((item) => item.id === inputId)?.clientId ?? null,
          trajectoryId: values.trajectoryId ?? null,
          inputId,
          sourceInputId: inputId,
          sourceSessionId: inputId,
          itemId: values.itemId ?? inputId,
          field: fieldId,
          fieldId,
          text: values.text,
          date: values.date,
          status: values.status ?? 'pending',
          createdAtUnixMs: values.createdAtUnixMs ?? now,
          updatedAtUnixMs: values.updatedAtUnixMs ?? now,
        }
        setData((previous) => createSnippet(previous, snippet))
        runRemoteMutation('create snippet', () => snippetApi.create(snippet))
        return snippet.id
      },
      updateSnippet: (snippetId, values) => {
        const now = Date.now()
        setData((previous) => updateSnippet(previous, snippetId, values))
        if (values.status === 'approved') {
          runRemoteMutation('approve snippet', () => approvePipelineSnippet(snippetId))
          return
        }
        if (values.status === 'rejected') {
          runRemoteMutation('reject snippet', () => rejectPipelineSnippet(snippetId))
          return
        }
        runRemoteMutation('update snippet', () =>
          snippetApi.update({
            id: snippetId,
            field: values.field,
            text: values.text,
            status: values.status,
            updatedAtUnixMs: now,
          }),
        )
      },
      deleteSnippet: (snippetId) => {
        setData((previous) => deleteSnippet(previous, snippetId))
        runRemoteMutation('delete snippet', () => snippetApi.delete(snippetId))
      },

      createNote: (inputId, values, options) => {
        const now = Date.now()
        const fallbackSourceInputId = String(inputId || '').trim() || null
        const sourceInputId =
          options && Object.prototype.hasOwnProperty.call(options, 'sourceInputId')
            ? String(options.sourceInputId || '').trim() || null
            : fallbackSourceInputId
        const linkedInput = sourceInputId ? data.inputs.find((input) => input.id === sourceInputId) ?? null : null
        const clientId =
          options && Object.prototype.hasOwnProperty.call(options, 'clientId')
            ? options.clientId ?? null
            : linkedInput?.clientId ?? null
        const note: Note = {
          id: createId('note'),
          clientId,
          sourceInputId,
          sessionId: sourceInputId ?? '',
          title: values.title,
          text: values.text,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        setData((previous) => createNote(previous, note))
        runRemoteMutation('create note', () => createNoteRemote(note))
      },
      updateNote: (noteId, values) => {
        const now = Date.now()
        setData((previous) => updateNote(previous, noteId, values))
        runRemoteMutation('update note', () =>
          updateNoteRemote({
            id: noteId,
            title: values.title,
            text: values.text,
            updatedAtUnixMs: now,
          }),
        )
      },
      deleteNote: (noteId) => {
        setData((previous) => deleteNote(previous, noteId))
        runRemoteMutation('delete note', () => deleteNoteRemote(noteId))
      },

      setInputSummary: (inputId, text) => setData((previous) => setInputSummary(previous, inputId, text)),
      setWrittenReport: (sessionId, text) => {
        const now = Date.now()
        const sourceInputId = String(sessionId || '').trim()
        const input = data.inputs.find((item) => item.id === sourceInputId) ?? null
        const existingReport = data.reports.find((item) => item.sourceInputId === sourceInputId) ?? null
        const report: Report = {
          id: existingReport?.id ?? createId('report'),
          clientId: input?.clientId ?? existingReport?.clientId ?? null,
          trajectoryId: input?.trajectoryId ?? existingReport?.trajectoryId ?? null,
          sourceInputId,
          createdByUserId: existingReport?.createdByUserId ?? null,
          primaryAuthorUserId: existingReport?.primaryAuthorUserId ?? null,
          reportCoachUserIds:
            existingReport?.reportCoachUserIds && existingReport.reportCoachUserIds.length > 0
              ? existingReport.reportCoachUserIds
              : ((input?.clientId
                  ? data.clients.find((client) => client.id === input.clientId)?.assignedCoachUserIds
                  : null) ?? []),
          reportCoaches: existingReport?.reportCoaches ?? [],
          title: String(input?.title || existingReport?.title || '').trim() || 'Rapportage',
          reportType: existingReport?.reportType ?? 'session_report',
          state: existingReport?.state ?? 'needs_review',
          reportText: String(text || ''),
          reportStructuredJson: existingReport?.reportStructuredJson ?? null,
          reportDate: input?.reportDate ?? existingReport?.reportDate ?? null,
          createdAtUnixMs: existingReport?.createdAtUnixMs ?? now,
          updatedAtUnixMs: now,
        }
        setData((previous) => {
          const withSummary = setInputSummary(previous, sourceInputId, report.reportText)
          return upsertReport(withSummary, report)
        })
        runRemoteMutation('save written report', () =>
          reportApi.save({
            id: report.id,
            sourceSessionId: sourceInputId,
            reportCoachUserIds: report.reportCoachUserIds,
            clientId: report.clientId,
            trajectoryId: report.trajectoryId,
            title: report.title,
            reportType: report.reportType,
            state: report.state,
            reportText: report.reportText,
            reportStructuredJson: report.reportStructuredJson,
            reportDate: report.reportDate,
            createdAtUnixMs: report.createdAtUnixMs,
            updatedAtUnixMs: report.updatedAtUnixMs,
          }),
        )
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

      updateOrganizationSettings: (values) => {
        const now = Date.now()
        setData((previous) => updateOrganizationSettings(previous, values))
        runRemoteMutation('update organization settings', () =>
          updateOrganizationSettingsRemote({
            practiceName: values.practiceName ?? values.name,
            website: values.website,
            visitAddress: values.visitAddress,
            postalAddress: values.postalAddress,
            postalCodeCity: values.postalCodeCity,
            visitPostalCodeCity: values.visitPostalCodeCity,
            contactName: values.contactName,
            contactRole: values.contactRole,
            contactPhone: values.contactPhone,
            contactEmail: values.contactEmail,
            tintColor: values.tintColor,
            logoDataUrl: values.logoDataUrl,
            updatedAtUnixMs: now,
          }),
        )
      },
      updateUserSettings: (values) => {
        const now = Date.now()
        setData((previous) => updateUserSettings(previous, values))
        runRemoteMutation('update user settings', () =>
          updateUserSettingsRemote({
            contactName: values.name,
            contactRole: values.role,
            contactPhone: values.phone,
            contactEmail: values.email,
            updatedAtUnixMs: now,
          }),
        )
      },
    }),
    [data, isAppDataLoaded, isAuthenticated, refreshAppData, runRemoteMutation],
  )

  useEffect(() => {
    const now = Date.now()
    const staleInputs = data.inputs.filter((input) => {
      if (input.transcriptionStatus !== 'transcribing' && input.transcriptionStatus !== 'generating') return false
      return now - input.updatedAtUnixMs > STALE_TRANSCRIPTION_TIMEOUT_MS
    })
    if (staleInputs.length === 0) return

    for (const input of staleInputs) {
      const updatedAtUnixMs = Date.now()
      setData((previous) =>
        updateInput(previous, input.id, {
          transcriptionStatus: 'error',
          transcriptionError: STALE_TRANSCRIPTION_ERROR_MESSAGE,
          updatedAtUnixMs,
        }),
      )
      runRemoteMutation('mark stale transcription as error', () =>
        sessionApi.update({
          id: input.id,
          updatedAtUnixMs,
          transcriptionStatus: 'error',
          transcriptionError: STALE_TRANSCRIPTION_ERROR_MESSAGE,
        }),
      )
    }
  }, [data.inputs, runRemoteMutation])

  return <LocalAppDataContext.Provider value={value}>{children}</LocalAppDataContext.Provider>
}

export function useLocalAppData() {
  const value = useContext(LocalAppDataContext)
  if (!value) throw new Error('useLocalAppData must be used within LocalAppDataProvider')
  return value
}
