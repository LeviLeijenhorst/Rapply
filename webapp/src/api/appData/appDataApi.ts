import { callSecureApi } from '../secureApi'
import type { Client, Input, LocalAppData, Snippet, Trajectory } from '../../storage/types'

type RemoteWorkspaceData = Partial<{
  clients: unknown[]
  coachees: unknown[]
  trajectories: unknown[]
  inputs: unknown[]
  sessions: unknown[]
  snippets: unknown[]
  organizationSettings: unknown
  userSettings: unknown
}>

function normalizeInputType(value: unknown): Input['type'] {
  switch (value) {
    case 'recorded-session':
    case 'uploaded-session':
    case 'spoken-recap':
    case 'written-recap':
    case 'uploaded-document':
      return value
    case 'recording':
      return 'recorded-session'
    case 'upload':
      return 'uploaded-session'
    case 'written':
      return 'written-recap'
    default:
      return 'spoken-recap'
  }
}

function mapTypeToKind(type: Input['type']): Input['kind'] {
  switch (type) {
    case 'recorded-session':
      return 'recording'
    case 'uploaded-session':
      return 'upload'
    case 'written-recap':
      return 'written'
    default:
      return 'intake'
  }
}

function normalizeClients(raw: unknown[]): Client[] {
  return raw
    .map((item) => {
      const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const id = String(source.id ?? '').trim()
      const name = String(source.name ?? '').trim()
      if (!id || !name) return null
      const now = Date.now()
      return {
        id,
        name,
        clientDetails: String(source.clientDetails ?? ''),
        employerDetails: String(source.employerDetails ?? ''),
        createdAtUnixMs: Number.isFinite(source.createdAtUnixMs) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(source.updatedAtUnixMs) ? Number(source.updatedAtUnixMs) : now,
        isArchived: Boolean(source.isArchived),
      } satisfies Client
    })
    .filter(Boolean) as Client[]
}

function normalizeTrajectories(raw: unknown[]): Trajectory[] {
  return raw
    .map((item) => {
      const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const id = String(source.id ?? '').trim()
      const clientId = String(source.clientId ?? source.coacheeId ?? '').trim()
      if (!id || !clientId) return null
      const now = Date.now()
      return {
        id,
        clientId,
        name: String(source.name ?? '').trim() || 'Traject',
        uwvContactName: typeof source.uwvContactName === 'string' ? source.uwvContactName : null,
        orderNumber: typeof source.orderNumber === 'string' ? source.orderNumber : null,
        startDate: typeof source.startDate === 'string' ? source.startDate : null,
        createdAtUnixMs: Number.isFinite(source.createdAtUnixMs) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(source.updatedAtUnixMs) ? Number(source.updatedAtUnixMs) : now,
      } satisfies Trajectory
    })
    .filter(Boolean) as Trajectory[]
}

function normalizeInputs(raw: unknown[]): Input[] {
  return raw
    .map((item) => {
      const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const id = String(source.id ?? '').trim()
      if (!id) return null
      const now = Date.now()
      const type = normalizeInputType(source.type ?? source.kind ?? source.inputType)
      return {
        id,
        clientId: typeof source.clientId === 'string' ? source.clientId : typeof source.coacheeId === 'string' ? source.coacheeId : null,
        trajectoryId: typeof source.trajectoryId === 'string' ? source.trajectoryId : null,
        title: String(source.title ?? '').trim() || 'Input',
        createdAtUnixMs: Number.isFinite(source.createdAtUnixMs) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(source.updatedAtUnixMs) ? Number(source.updatedAtUnixMs) : now,
        type,
        kind: mapTypeToKind(type),
        audioBlobId: typeof source.audioBlobId === 'string' ? source.audioBlobId : null,
        audioDurationSeconds: Number.isFinite(source.audioDurationSeconds) ? Number(source.audioDurationSeconds) : null,
        uploadFileName: typeof source.uploadFileName === 'string' ? source.uploadFileName : null,
        transcript: typeof source.transcript === 'string' ? source.transcript : null,
        summary: typeof source.summary === 'string' ? source.summary : null,
        reportDate: typeof source.reportDate === 'string' ? source.reportDate : null,
        transcriptionStatus:
          source.transcriptionStatus === 'transcribing' ||
          source.transcriptionStatus === 'generating' ||
          source.transcriptionStatus === 'done' ||
          source.transcriptionStatus === 'error'
            ? source.transcriptionStatus
            : 'idle',
        transcriptionError: typeof source.transcriptionError === 'string' ? source.transcriptionError : null,
      } satisfies Input
    })
    .filter(Boolean) as Input[]
}

function normalizeSnippets(raw: unknown[]): Snippet[] {
  return raw
    .map((item) => {
      const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      const id = String(source.id ?? '').trim()
      const trajectoryId = String(source.trajectoryId ?? '').trim()
      const inputId = String(source.inputId ?? source.itemId ?? '').trim()
      const field = String(source.field ?? '').trim()
      if (!id || !trajectoryId || !inputId || !field) return null
      const now = Date.now()
      return {
        id,
        trajectoryId,
        inputId,
        itemId: inputId,
        field,
        text: String(source.text ?? ''),
        date: Number.isFinite(source.date) ? Number(source.date) : now,
        status: source.status === 'approved' || source.status === 'rejected' ? source.status : 'pending',
        createdAtUnixMs: Number.isFinite(source.createdAtUnixMs) ? Number(source.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(source.updatedAtUnixMs) ? Number(source.updatedAtUnixMs) : now,
      } satisfies Snippet
    })
    .filter(Boolean) as Snippet[]
}

export async function readAppData(): Promise<LocalAppData> {
  const response = await callSecureApi<RemoteWorkspaceData>('/app-data', {})
  const clientsSource = Array.isArray(response.clients) ? response.clients : Array.isArray(response.coachees) ? response.coachees : []
  const inputsSource = Array.isArray(response.inputs) ? response.inputs : Array.isArray(response.sessions) ? response.sessions : []

  const organization = (response.organizationSettings && typeof response.organizationSettings === 'object' ? response.organizationSettings : {}) as Record<string, unknown>
  const user = (response.userSettings && typeof response.userSettings === 'object' ? response.userSettings : {}) as Record<string, unknown>

  return {
    clients: normalizeClients(clientsSource),
    trajectories: normalizeTrajectories(Array.isArray(response.trajectories) ? response.trajectories : []),
    inputs: normalizeInputs(inputsSource),
    snippets: normalizeSnippets(Array.isArray(response.snippets) ? response.snippets : []),
    notes: [],
    templates: [],
    inputSummaries: [],
    organizationSettings: {
      name: String(organization.name ?? ''),
      website: String(organization.website ?? ''),
      visitAddress: String(organization.visitAddress ?? ''),
      postalAddress: String(organization.postalAddress ?? ''),
      postalCodeCity: String(organization.postalCodeCity ?? ''),
      tintColor: String(organization.tintColor ?? '#BE0165'),
      logoDataUrl: typeof organization.logoDataUrl === 'string' ? organization.logoDataUrl : null,
      contactName: String(organization.contactName ?? ''),
      contactRole: String(organization.contactRole ?? ''),
      contactPhone: String(organization.contactPhone ?? ''),
      contactEmail: String(organization.contactEmail ?? ''),
      updatedAtUnixMs: Number.isFinite(organization.updatedAtUnixMs) ? Number(organization.updatedAtUnixMs) : 0,
    },
    userSettings: {
      name: String(user.name ?? ''),
      role: String(user.role ?? ''),
      phone: String(user.phone ?? ''),
      email: String(user.email ?? ''),
      updatedAtUnixMs: Number.isFinite(user.updatedAtUnixMs) ? Number(user.updatedAtUnixMs) : 0,
    },
  }
}

