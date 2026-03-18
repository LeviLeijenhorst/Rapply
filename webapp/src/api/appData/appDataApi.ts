import { callSecureApi } from '../secureApi'
import type {
  Client,
  Input,
  LocalAppData,
  Note,
  OrganizationSettings,
  Report,
  Snippet,
  Template,
  Trajectory,
  UserSettings,
} from '../../storage/types'

type RemoteWorkspaceData = Partial<{
  clients: unknown[]
  trajectories: unknown[]
  inputs: unknown[]
  sessions: unknown[]
  snippets: unknown[]
  notes: unknown[]
  reports: unknown[]
  templates: unknown[]
  organizationSettings: unknown
  userSettings: unknown
}>

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value)
  return normalized || null
}

function normalizeInputType(value: unknown): Input['type'] {
  const normalized = normalizeText(value)
  if (
    normalized === 'recorded-session' ||
    normalized === 'uploaded-session' ||
    normalized === 'spoken-recap' ||
    normalized === 'written-recap' ||
    normalized === 'uploaded-document'
  ) {
    return normalized
  }
  if (normalized === 'recording' || normalized === 'full_audio_recording') return 'recorded-session'
  if (normalized === 'uploaded_audio') return 'uploaded-session'
  if (normalized === 'written_recap') return 'written-recap'
  if (normalized === 'written_report' || normalized === 'written-report') return 'written-recap'
  if (normalized === 'spoken_recap' || normalized === 'spoken_recap_recording' || normalized === 'intake') return 'spoken-recap'
  if (normalized === 'uploaded_document') return 'uploaded-document'
  if (normalized === 'upload') return 'uploaded-session'
  if (normalized === 'written') return 'written-recap'
  return 'spoken-recap'
}

function mapTypeToKind(type: Input['type']): Input['kind'] {
  if (type === 'recorded-session') return 'recording'
  if (type === 'uploaded-session' || type === 'uploaded-document') return 'upload'
  if (type === 'written-recap') return 'written'
  return 'intake'
}

function normalizeSnippetStatus(value: unknown): Snippet['status'] {
  const normalized = normalizeText(value)
  if (normalized === 'approved' || normalized === 'rejected') return normalized
  return 'pending'
}

function normalizeReportState(value: unknown): Report['state'] {
  const normalized = normalizeText(value)
  if (normalized === 'incomplete' || normalized === 'complete') return normalized
  return 'needs_review'
}

function normalizeClients(raw: unknown): Client[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      const name = normalizeText(source.name)
      if (!id || !name) return null
      const now = Date.now()
      const assignedCoaches = Array.isArray(source.assignedCoaches)
        ? source.assignedCoaches
            .map((coach) => {
              const coachSource = (coach && typeof coach === 'object' ? coach : {}) as Record<string, unknown>
              const userId = normalizeText(coachSource.userId)
              if (!userId) return null
              return {
                userId,
                displayName: normalizeNullableText(coachSource.displayName),
                email: normalizeNullableText(coachSource.email),
                role: normalizeText(coachSource.role) || 'coach',
              }
            })
            .filter(Boolean)
        : []
      return {
        id,
        organizationId: normalizeNullableText(source.organizationId) ?? undefined,
        name,
        clientDetails: String(source.clientDetails ?? ''),
        employerDetails: String(source.employerDetails ?? ''),
        trajectoryStartDate: normalizeNullableText(source.trajectoryStartDate),
        trajectoryEndDate: normalizeNullableText(source.trajectoryEndDate),
        createdByUserId: normalizeNullableText(source.createdByUserId),
        primaryCoachUserId: normalizeNullableText(source.primaryCoachUserId),
        assignedCoaches: assignedCoaches as Client['assignedCoaches'],
        assignedCoachUserIds:
          Array.isArray(source.assignedCoachUserIds) && source.assignedCoachUserIds.length > 0
            ? source.assignedCoachUserIds.map((value) => normalizeText(value)).filter(Boolean)
            : (assignedCoaches as Array<any>).map((coach) => coach.userId),
        createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
        isArchived: Boolean(source.isArchived),
      } satisfies Client
    })
    .filter(Boolean) as Client[]
}

function normalizeTrajectories(raw: unknown): Trajectory[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      const clientId = normalizeText(source.clientId)
      if (!id || !clientId) return null
      const now = Date.now()
      const planOfAction =
        source.planOfAction && typeof source.planOfAction === 'object'
          ? { documentId: normalizeText((source.planOfAction as Record<string, unknown>).documentId) }
          : null
      return {
        id,
        clientId,
        isActive: typeof source.isActive === 'boolean' ? source.isActive : true,
        name: normalizeText(source.name) || 'Traject',
        serviceType: normalizeNullableText(source.serviceType ?? source.dienstType),
        uwvContactName: normalizeNullableText(source.uwvContactName),
        uwvContactPhone: normalizeNullableText(source.uwvContactPhone),
        uwvContactEmail: normalizeNullableText(source.uwvContactEmail),
        orderNumber: normalizeNullableText(source.orderNumber),
        startDate: normalizeNullableText(source.startDate),
        planOfAction: planOfAction?.documentId ? planOfAction : null,
        maxHours: Number.isFinite(Number(source.maxHours)) ? Number(source.maxHours) : 0,
        maxAdminHours: Number.isFinite(Number(source.maxAdminHours)) ? Number(source.maxAdminHours) : 0,
        createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
      } satisfies Trajectory
    })
    .filter(Boolean) as Trajectory[]
}

function normalizeInputs(raw: unknown): Input[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      if (!id) return null
      const now = Date.now()
      const type = normalizeInputType(source.inputType ?? source.type ?? source.kind)
      return {
        id,
        clientId: normalizeNullableText(source.clientId),
        trajectoryId: normalizeNullableText(source.trajectoryId),
        title: normalizeText(source.title) || 'Input',
        createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
        type,
        kind: mapTypeToKind(type),
        audioBlobId: normalizeNullableText(source.audioUploadId ?? source.audioBlobId),
        audioDurationSeconds: Number.isFinite(Number(source.audioDurationSeconds)) ? Number(source.audioDurationSeconds) : null,
        uploadFileName: normalizeNullableText(source.uploadFileName),
        transcript: normalizeNullableText(source.transcriptText ?? source.transcript ?? source.sourceText),
        summary: normalizeNullableText(source.summaryText ?? source.summary),
        summaryStructured:
          source.summaryStructured && typeof source.summaryStructured === 'object' ? source.summaryStructured : null,
        reportDate: normalizeNullableText(source.reportDate),
        transcriptionStatus:
          source.transcriptionStatus === 'transcribing' ||
          source.transcriptionStatus === 'generating' ||
          source.transcriptionStatus === 'done' ||
          source.transcriptionStatus === 'error'
            ? source.transcriptionStatus
            : 'idle',
        transcriptionError: normalizeNullableText(source.transcriptionError),
      } satisfies Input
    })
    .filter(Boolean) as Input[]
}

function normalizeSnippets(raw: unknown): Snippet[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      const inputId = normalizeText(source.sourceInputId ?? source.sourceSessionId ?? source.inputId ?? source.itemId)
      const fields = [
        ...(Array.isArray(source.fieldIds) ? source.fieldIds : []),
        ...(Array.isArray(source.fields) ? source.fields : []),
        source.fieldId,
        source.snippetType,
        source.field,
      ]
        .map((item) => normalizeText(item))
        .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
      const fieldId = fields[0] ?? ''
      if (!id || !inputId || !fieldId) return null
      const now = Date.now()
      const clientId = normalizeNullableText(source.clientId)
      return {
        id,
        clientId,
        trajectoryId: normalizeNullableText(source.trajectoryId),
        inputId,
        sourceInputId: inputId,
        sourceSessionId: inputId,
        itemId: inputId,
        fields,
        field: fieldId,
        fieldId,
        text: String(source.text ?? ''),
        date: Number.isFinite(Number(source.snippetDate)) ? Number(source.snippetDate) : now,
        status: normalizeSnippetStatus(source.approvalStatus ?? source.status),
        createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
      } satisfies Snippet
    })
    .filter(Boolean) as Snippet[]
}

function normalizeNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      if (!id) return null
      const sourceInputId = normalizeNullableText(source.sourceInputId ?? source.sessionId ?? source.inputId)
      const now = Date.now()
      return {
        id,
        clientId: normalizeNullableText(source.clientId),
        sourceInputId,
        sessionId: sourceInputId ?? '',
        title: String(source.title ?? ''),
        text: String(source.text ?? ''),
        createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
      } satisfies Note
    })
    .filter(Boolean) as Note[]
}

function normalizeReports(raw: unknown): Report[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      if (!id) return null
      const now = Date.now()
      return {
        id,
        clientId: normalizeNullableText(source.clientId),
        trajectoryId: normalizeNullableText(source.trajectoryId),
        sourceInputId: normalizeNullableText(source.sourceInputId ?? source.sourceSessionId),
        createdByUserId: normalizeNullableText(source.createdByUserId),
        primaryAuthorUserId: normalizeNullableText(source.primaryAuthorUserId),
        reportCoachUserIds: Array.isArray(source.reportCoachUserIds)
          ? source.reportCoachUserIds.map((value) => normalizeText(value)).filter(Boolean)
          : [],
        reportCoaches: Array.isArray(source.reportCoaches)
          ? source.reportCoaches
              .map((coach) => {
                const coachSource = (coach && typeof coach === 'object' ? coach : {}) as Record<string, unknown>
                const userId = normalizeText(coachSource.userId)
                if (!userId) return null
                return {
                  userId,
                  displayName: normalizeNullableText(coachSource.displayName),
                  email: normalizeNullableText(coachSource.email),
                }
              })
              .filter((coach): coach is { userId: string; displayName: string | null; email: string | null } => Boolean(coach))
          : [],
        title: normalizeText(source.title) || 'Rapportage',
        reportType: normalizeText(source.reportType) || 'uwv',
        state: normalizeReportState(source.state),
        reportText: String(source.reportText ?? source.text ?? ''),
        reportStructuredJson:
          source.reportStructuredJson && typeof source.reportStructuredJson === 'object'
            ? (source.reportStructuredJson as Report['reportStructuredJson'])
            : null,
        reportDate: normalizeNullableText(source.reportDate),
        createdAtUnixMs: Number.isFinite(Number(source.createdAtUnixMs)) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : now,
      } satisfies Report
    })
    .filter(Boolean) as Report[]
}

function normalizeTemplates(raw: unknown): Template[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((value) => {
      const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
      const id = normalizeText(source.id)
      const name = normalizeText(source.name)
      if (!id || !name) return null
      return {
        id,
        name,
        category: 'gespreksverslag',
        description: String(source.description ?? ''),
        sections: [],
        isDefault: true,
        isSaved: true,
      } satisfies Template
    })
    .filter(Boolean) as Template[]
}

function normalizeOrganizationSettings(raw: unknown): OrganizationSettings {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    name: String(source.practiceName ?? source.name ?? ''),
    practiceName: String(source.practiceName ?? source.name ?? ''),
    website: String(source.website ?? ''),
    visitAddress: String(source.visitAddress ?? ''),
    postalAddress: String(source.postalAddress ?? ''),
    postalCodeCity: String(source.postalCodeCity ?? ''),
    tintColor: String(source.tintColor ?? '#BE0165'),
    logoDataUrl: normalizeNullableText(source.logoDataUrl),
    contactName: String(source.contactName ?? ''),
    contactRole: String(source.contactRole ?? ''),
    contactPhone: String(source.contactPhone ?? ''),
    contactEmail: String(source.contactEmail ?? ''),
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : 0,
  }
}

function normalizeUserSettings(raw: unknown): UserSettings {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    name: String(source.contactName ?? source.name ?? ''),
    role: String(source.contactRole ?? source.role ?? ''),
    phone: String(source.contactPhone ?? source.phone ?? ''),
    email: String(source.contactEmail ?? source.email ?? ''),
    updatedAtUnixMs: Number.isFinite(Number(source.updatedAtUnixMs)) ? Number(source.updatedAtUnixMs) : 0,
  }
}

export async function readAppData(): Promise<LocalAppData> {
  const response = await callSecureApi<RemoteWorkspaceData>('/app-data', {})
  const inputsSource = Array.isArray(response.inputs) ? response.inputs : Array.isArray(response.sessions) ? response.sessions : []
  const reports = normalizeReports(response.reports)

  return {
    clients: normalizeClients(response.clients),
    trajectories: normalizeTrajectories(response.trajectories),
    inputs: normalizeInputs(inputsSource),
    reports,
    snippets: normalizeSnippets(response.snippets),
    notes: normalizeNotes(response.notes),
    templates: normalizeTemplates(response.templates),
    inputSummaries: reports
      .filter((report) => Boolean(report.sourceInputId))
      .map((report) => ({
        inputId: String(report.sourceInputId || ''),
        sessionId: String(report.sourceInputId || ''),
        text: report.reportText,
        updatedAtUnixMs: report.updatedAtUnixMs,
      })),
    organizationSettings: normalizeOrganizationSettings(response.organizationSettings),
    userSettings: normalizeUserSettings(response.userSettings),
  }
}
