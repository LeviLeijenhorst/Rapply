import { createDefaultLocalAppData } from './defaultData'
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import type {
  Client,
  Input,
  InputSummary,
  LocalAppData,
  Note,
  OrganizationSettings,
  Report,
  Snippet,
  SnippetStatus,
  Template,
  Trajectory,
  UserSettings,
} from './types'

const storageKey = 'coachscribe.localAppData.v4'
const previousStorageKeys = ['coachscribe.localAppData.v3', 'coachscribe.localAppData.v2']

export function loadLocalAppData(): LocalAppData {
  const current = readJsonFromLocalStorage<LocalAppData>(storageKey)
  if (current.ok) return normalizeLocalAppData(current.value)

  for (const previousKey of previousStorageKeys) {
    const previous = readJsonFromLocalStorage<unknown>(previousKey)
    if (!previous.ok) continue
    const migrated = normalizeLocalAppData(previous.value)
    writeJsonToLocalStorage(storageKey, migrated)
    return migrated
  }

  const initial = createDefaultLocalAppData()
  writeJsonToLocalStorage(storageKey, initial)
  return initial
}

export function saveLocalAppData(data: LocalAppData) {
  writeJsonToLocalStorage(storageKey, data)
}

function normalizeLocalAppData(raw: unknown): LocalAppData {
  const fallback = createDefaultLocalAppData()
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const clients = normalizeClients(source.clients ?? source.coachees, fallback.clients)
  const trajectories = normalizeTrajectories(source.trajectories, clients, fallback.trajectories)
  const inputs = normalizeInputs(source.inputs ?? source.sessions, fallback.inputs)
  const reports = normalizeReports(source.reports, fallback.reports)
  const inputSummaries =
    source.inputSummaries !== undefined || source.writtenReports !== undefined
      ? normalizeInputSummaries(source.inputSummaries ?? source.writtenReports, fallback.inputSummaries)
      : reports
          .filter((report) => Boolean(report.sourceInputId))
          .map((report) => ({
            inputId: String(report.sourceInputId || ''),
            sessionId: String(report.sourceInputId || ''),
            text: report.reportText,
            updatedAtUnixMs: report.updatedAtUnixMs,
          }))

  return {
    clients,
    trajectories,
    inputs,
    reports,
    snippets: normalizeSnippets(source.snippets, fallback.snippets),
    notes: normalizeNotes(source.notes, fallback.notes),
    templates: normalizeTemplates(source.templates, fallback.templates),
    inputSummaries,
    organizationSettings: normalizeOrganizationSettings(source.organizationSettings ?? source.practiceSettings, fallback.organizationSettings),
    userSettings: normalizeUserSettings(source.userSettings ?? source.practiceSettings, fallback.userSettings),
  }
}

function normalizeClients(raw: unknown, fallback: Client[]): Client[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const now = Date.now()
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      const name = String(candidate.name ?? '').trim()
      if (!id || !name) return null
      return {
        id,
        name,
        clientDetails: String(candidate.clientDetails ?? ''),
        employerDetails: String(candidate.employerDetails ?? ''),
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
        isArchived: Boolean(candidate.isArchived),
      } satisfies Client
    })
    .filter(Boolean) as Client[]
}

function normalizeTrajectories(raw: unknown, clients: Client[], fallback: Trajectory[]): Trajectory[] {
  const now = Date.now()
  const normalized = (Array.isArray(raw) ? raw : [])
    .map((item) => {
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      const clientId = String(candidate.clientId ?? candidate.coacheeId ?? '').trim()
      if (!id || !clientId) return null
      return {
        id,
        clientId,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
        name: String(candidate.name ?? '').trim() || 'Traject',
        serviceType:
          typeof candidate.serviceType === 'string'
            ? candidate.serviceType
            : typeof candidate.dienstType === 'string'
              ? candidate.dienstType
              : null,
        uwvContactName: typeof candidate.uwvContactName === 'string' ? candidate.uwvContactName : null,
        uwvContactPhone: typeof candidate.uwvContactPhone === 'string' ? candidate.uwvContactPhone : null,
        uwvContactEmail: typeof candidate.uwvContactEmail === 'string' ? candidate.uwvContactEmail : null,
        orderNumber: typeof candidate.orderNumber === 'string' ? candidate.orderNumber : null,
        startDate: typeof candidate.startDate === 'string' ? candidate.startDate : null,
        planOfAction:
          candidate.planOfAction && typeof candidate.planOfAction === 'object' && typeof (candidate.planOfAction as any).documentId === 'string'
            ? { documentId: String((candidate.planOfAction as any).documentId || '').trim() }
            : null,
        maxHours: Number.isFinite(candidate.maxHours) ? Number(candidate.maxHours) : 0,
        maxAdminHours: Number.isFinite(candidate.maxAdminHours) ? Number(candidate.maxAdminHours) : 0,
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Trajectory
    })
    .filter(Boolean) as Trajectory[]

  if (normalized.length > 0) return normalized
  if (clients.length === 0) return fallback

  return clients.map((client) => ({
    id: defaultTrajectoryIdForClient(client.id),
    clientId: client.id,
    isActive: true,
    name: 'Traject',
    serviceType: 'werkfit',
    uwvContactName: null,
    uwvContactPhone: null,
    uwvContactEmail: null,
    orderNumber: null,
    startDate: null,
    planOfAction: null,
    maxHours: 0,
    maxAdminHours: 0,
    createdAtUnixMs: client.createdAtUnixMs,
    updatedAtUnixMs: client.updatedAtUnixMs,
  }))
}

function normalizeInputs(raw: unknown, fallback: Input[]): Input[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const now = Date.now()
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      if (!id) return null
      const type = normalizeInputType(candidate.type ?? candidate.kind)
      return {
        id,
        clientId: nullableText(candidate.clientId ?? candidate.coacheeId),
        trajectoryId: nullableText(candidate.trajectoryId),
        title: String(candidate.title ?? '').trim() || 'Input',
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
        type,
        kind: mapTypeToKind(type),
        audioBlobId: nullableText(candidate.audioBlobId),
        audioDurationSeconds: Number.isFinite(candidate.audioDurationSeconds) ? Number(candidate.audioDurationSeconds) : null,
        uploadFileName: nullableText(candidate.uploadFileName),
        transcript: nullableText(candidate.transcript),
        summary: nullableText(candidate.summary),
        summaryStructured:
          candidate.summaryStructured && typeof candidate.summaryStructured === 'object'
            ? candidate.summaryStructured
            : null,
        reportDate: nullableText(candidate.reportDate),
        transcriptionStatus: normalizeTranscriptionStatus(candidate.transcriptionStatus),
        transcriptionError: nullableText(candidate.transcriptionError),
      } satisfies Input
    })
    .filter(Boolean) as Input[]
}

function normalizeReports(raw: unknown, fallback: Report[]): Report[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const now = Date.now()
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      if (!id) return null
      const stateRaw = String(candidate.state ?? '').trim()
      const state: Report['state'] = stateRaw === 'incomplete' || stateRaw === 'complete' ? stateRaw : 'needs_review'
      return {
        id,
        clientId: nullableText(candidate.clientId),
        trajectoryId: nullableText(candidate.trajectoryId),
        sourceInputId: nullableText(candidate.sourceInputId ?? candidate.sourceSessionId ?? candidate.inputId),
        title: String(candidate.title ?? '').trim() || 'Rapportage',
        reportType: String(candidate.reportType ?? '').trim() || 'uwv',
        state,
        reportText: String(candidate.reportText ?? candidate.text ?? ''),
        reportStructuredJson:
          candidate.reportStructuredJson && typeof candidate.reportStructuredJson === 'object'
            ? (candidate.reportStructuredJson as Report['reportStructuredJson'])
            : null,
        reportDate: nullableText(candidate.reportDate),
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Report
    })
    .filter(Boolean) as Report[]
}

function normalizeSnippets(raw: unknown, fallback: Snippet[]): Snippet[] {
  if (!Array.isArray(raw)) return fallback
  const byId = new Set<string>()
  const bySemanticKey = new Set<string>()
  const normalized = raw
    .map((item) => {
      const now = Date.now()
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      const trajectoryId = nullableText(candidate.trajectoryId)
      const inputId = String(candidate.inputId ?? candidate.itemId ?? candidate.sourceInputId ?? candidate.sourceSessionId ?? '').trim()
      const fields = normalizeSnippetLabels(candidate.fields ?? candidate.fieldIds, [
        candidate.field,
        candidate.fieldId,
        candidate.snippetType,
      ])
      const field = fields[0] || ''
      if (!id || !inputId || !field) return null
      return {
        id,
        clientId: nullableText(candidate.clientId),
        trajectoryId,
        inputId,
        sourceInputId: nullableText(candidate.sourceInputId ?? inputId),
        sourceSessionId: nullableText(candidate.sourceSessionId ?? inputId),
        itemId: inputId,
        fields,
        field,
        fieldId: field,
        text: String(candidate.text ?? ''),
        date: Number.isFinite(candidate.date) ? Number(candidate.date) : now,
        status: normalizeSnippetStatus(candidate.status),
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Snippet
    })
    .filter((snippet) => snippet !== null)

  return normalized.filter((snippet) => {
    if (byId.has(snippet.id)) return false
    byId.add(snippet.id)
    const key = createSnippetSemanticKey(snippet)
    if (!key) return true
    if (bySemanticKey.has(key)) return false
    bySemanticKey.add(key)
    return true
  })
}

function normalizeSnippetValue(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeSnippetLabels(raw: unknown, fallbackValues: unknown[] = []): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  const values = [
    ...(Array.isArray(raw) ? raw : []),
    ...fallbackValues,
  ]
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

function createSnippetSemanticKey(snippet: Pick<Snippet, 'inputId' | 'field' | 'text' | 'fields'>): string {
  const inputId = normalizeSnippetValue(snippet.inputId)
  const fields = normalizeSnippetLabels(snippet.fields, [snippet.field]).map((label) => normalizeSnippetValue(label)).filter(Boolean).sort()
  const text = normalizeSnippetValue(snippet.text)
  if (!inputId || fields.length === 0 || !text) return ''
  return `${inputId}::${fields.join('|')}::${text}`
}

function normalizeNotes(raw: unknown, fallback: Note[]): Note[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      const sourceInputId = nullableText(candidate.sourceInputId ?? candidate.sessionId ?? candidate.inputId)
      if (!id) return null
      const now = Date.now()
      return {
        id,
        clientId: nullableText(candidate.clientId),
        sourceInputId,
        sessionId: sourceInputId ?? '',
        title: String(candidate.title ?? ''),
        text: String(candidate.text ?? ''),
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Note
    })
    .filter(Boolean) as Note[]
}

function normalizeTemplates(raw: unknown, fallback: Template[]): Template[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      if (!id) return null
      return {
        id,
        name: String(candidate.name ?? '').trim() || 'Template',
        category: candidate.category === 'ander-verslag' ? 'ander-verslag' : 'gespreksverslag',
        description: String(candidate.description ?? ''),
        sections: Array.isArray(candidate.sections) ? (candidate.sections as Template['sections']) : [],
        isDefault: Boolean(candidate.isDefault),
        isSaved: candidate.isSaved !== false,
      } satisfies Template
    })
    .filter(Boolean) as Template[]
}

function normalizeInputSummaries(raw: unknown, fallback: InputSummary[]): InputSummary[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const candidate = item as Record<string, unknown>
      const inputId = String(candidate.inputId ?? candidate.sessionId ?? '').trim()
      if (!inputId) return null
      return {
        inputId,
        text: String(candidate.text ?? ''),
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : Date.now(),
      } satisfies InputSummary
    })
    .filter(Boolean) as InputSummary[]
}

function normalizeOrganizationSettings(raw: unknown, fallback: OrganizationSettings): OrganizationSettings {
  const candidate = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    name: String(candidate.name ?? candidate.practiceName ?? fallback.name),
    practiceName: String(candidate.practiceName ?? candidate.name ?? fallback.name),
    website: String(candidate.website ?? fallback.website),
    visitAddress: String(candidate.visitAddress ?? fallback.visitAddress),
    postalAddress: String(candidate.postalAddress ?? fallback.postalAddress),
    postalCodeCity: String(candidate.postalCodeCity ?? fallback.postalCodeCity),
    visitPostalCodeCity: String(candidate.visitPostalCodeCity ?? fallback.visitPostalCodeCity ?? ''),
    tintColor: String(candidate.tintColor ?? fallback.tintColor ?? '#BE0165'),
    logoDataUrl: typeof candidate.logoDataUrl === 'string' ? candidate.logoDataUrl : null,
    contactName: String(candidate.contactName ?? ''),
    contactRole: String(candidate.contactRole ?? ''),
    contactPhone: String(candidate.contactPhone ?? ''),
    contactEmail: String(candidate.contactEmail ?? ''),
    updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : fallback.updatedAtUnixMs,
  }
}

function normalizeUserSettings(raw: unknown, fallback: UserSettings): UserSettings {
  const candidate = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    name: String(candidate.name ?? candidate.contactName ?? fallback.name),
    role: String(candidate.role ?? candidate.contactRole ?? fallback.role),
    phone: String(candidate.phone ?? candidate.contactPhone ?? fallback.phone),
    email: String(candidate.email ?? candidate.contactEmail ?? fallback.email),
    updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : fallback.updatedAtUnixMs,
  }
}

function normalizeInputType(value: unknown): Input['type'] {
  switch (value) {
    case 'recorded-session':
    case 'uploaded-session':
    case 'spoken-recap':
    case 'written-recap':
    case 'uploaded-document':
      return value
    case 'recording':
    case 'full_audio_recording':
      return 'recorded-session'
    case 'uploaded_audio':
      return 'uploaded-session'
    case 'spoken_recap':
    case 'spoken_recap_recording':
    case 'intake':
      return 'spoken-recap'
    case 'written_recap':
      return 'written-recap'
    case 'written_report':
    case 'written-report':
      return 'written-recap'
    case 'uploaded_document':
      return 'uploaded-document'
    case 'upload':
      return 'uploaded-session'
    case 'written':
      return 'written-recap'
    case 'notes':
      return 'spoken-recap'
    default:
      return 'spoken-recap'
  }
}

function mapTypeToKind(type: Input['type']): Input['kind'] {
  switch (type) {
    case 'recorded-session':
      return 'recording'
    case 'uploaded-session':
    case 'uploaded-document':
      return 'upload'
    case 'written-recap':
      return 'written'
    default:
      return 'intake'
  }
}

function normalizeTranscriptionStatus(value: unknown): Input['transcriptionStatus'] {
  switch (value) {
    case 'idle':
    case 'transcribing':
    case 'generating':
    case 'done':
    case 'error':
      return value
    default:
      return 'idle'
  }
}

function normalizeSnippetStatus(value: unknown): SnippetStatus {
  switch (value) {
    case 'approved':
    case 'rejected':
      return value
    default:
      return 'pending'
  }
}

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value
}

function defaultTrajectoryIdForClient(clientId: string): string {
  return `trajectory_default_${String(clientId || '').trim()}`
}

export function createClient(data: LocalAppData, client: Client): LocalAppData {
  return { ...data, clients: [client, ...data.clients] }
}

export function updateClient(
  data: LocalAppData,
  clientId: string,
  values: { name?: string; clientDetails?: string; employerDetails?: string },
): LocalAppData {
  return {
    ...data,
    clients: data.clients.map((client) => {
      if (client.id !== clientId) return client
      return {
        ...client,
        ...(values.name !== undefined ? { name: values.name } : null),
        ...(values.clientDetails !== undefined ? { clientDetails: values.clientDetails } : null),
        ...(values.employerDetails !== undefined ? { employerDetails: values.employerDetails } : null),
        updatedAtUnixMs: Date.now(),
      }
    }),
  }
}

export function archiveClient(data: LocalAppData, clientId: string): LocalAppData {
  return {
    ...data,
    clients: data.clients.map((client) => (client.id === clientId ? { ...client, isArchived: true, updatedAtUnixMs: Date.now() } : client)),
  }
}

export function restoreClient(data: LocalAppData, clientId: string): LocalAppData {
  return {
    ...data,
    clients: data.clients.map((client) => (client.id === clientId ? { ...client, isArchived: false, updatedAtUnixMs: Date.now() } : client)),
  }
}

export function deleteClient(data: LocalAppData, clientId: string): LocalAppData {
  const remainingTrajectories = data.trajectories.filter((trajectory) => trajectory.clientId !== clientId)
  const removedTrajectoryIds = new Set(data.trajectories.filter((trajectory) => trajectory.clientId === clientId).map((trajectory) => trajectory.id))
  const removedInputIds = new Set(data.inputs.filter((input) => input.clientId === clientId || removedTrajectoryIds.has(String(input.trajectoryId ?? ''))).map((input) => input.id))

  return {
    ...data,
    clients: data.clients.filter((client) => client.id !== clientId),
    trajectories: remainingTrajectories,
    inputs: data.inputs.filter((input) => !removedInputIds.has(input.id)),
    reports: data.reports.filter((report) => !removedInputIds.has(String(report.sourceInputId || '')) && report.clientId !== clientId),
    snippets: data.snippets.filter(
      (snippet) => !removedTrajectoryIds.has(String(snippet.trajectoryId || '')) && !removedInputIds.has(snippet.inputId),
    ),
    notes: data.notes.filter((note) => !removedInputIds.has(String(note.sourceInputId ?? note.sessionId ?? '')) && note.clientId !== clientId),
    inputSummaries: data.inputSummaries.filter((summary) => !removedInputIds.has(summary.inputId)),
  }
}

export function createTrajectory(data: LocalAppData, trajectory: Trajectory): LocalAppData {
  return { ...data, trajectories: [trajectory, ...data.trajectories] }
}

export function updateTrajectory(
  data: LocalAppData,
  trajectoryId: string,
  values: { clientId?: string; name?: string; uwvContactName?: string | null; orderNumber?: string | null; startDate?: string | null },
): LocalAppData {
  return {
    ...data,
    trajectories: data.trajectories.map((trajectory) => {
      if (trajectory.id !== trajectoryId) return trajectory
      return {
        ...trajectory,
        ...(values.clientId !== undefined ? { clientId: values.clientId } : null),
        ...(values.name !== undefined ? { name: values.name } : null),
        ...(values.uwvContactName !== undefined ? { uwvContactName: values.uwvContactName } : null),
        ...(values.orderNumber !== undefined ? { orderNumber: values.orderNumber } : null),
        ...(values.startDate !== undefined ? { startDate: values.startDate } : null),
        updatedAtUnixMs: Date.now(),
      }
    }),
  }
}

export function deleteTrajectory(data: LocalAppData, trajectoryId: string): LocalAppData {
  const removedInputIds = new Set(data.inputs.filter((input) => input.trajectoryId === trajectoryId).map((input) => input.id))
  return {
    ...data,
    trajectories: data.trajectories.filter((trajectory) => trajectory.id !== trajectoryId),
    inputs: data.inputs.filter((input) => input.trajectoryId !== trajectoryId),
    reports: data.reports.filter((report) => report.trajectoryId !== trajectoryId),
    snippets: data.snippets.filter((snippet) => snippet.trajectoryId !== trajectoryId && !removedInputIds.has(snippet.inputId)),
    notes: data.notes.filter((note) => !removedInputIds.has(String(note.sourceInputId ?? note.sessionId ?? ''))),
    inputSummaries: data.inputSummaries.filter((summary) => !removedInputIds.has(summary.inputId)),
  }
}

export function createInput(data: LocalAppData, input: Input): LocalAppData {
  return { ...data, inputs: [input, ...data.inputs] }
}

export function updateInput(data: LocalAppData, inputId: string, values: Partial<Omit<Input, 'id'>>): LocalAppData {
  return {
    ...data,
    inputs: data.inputs.map((input) => {
      if (input.id !== inputId) return input
      return {
        ...input,
        ...values,
        updatedAtUnixMs: values.updatedAtUnixMs ?? Date.now(),
      }
    }),
  }
}

export function deleteInput(data: LocalAppData, inputId: string): LocalAppData {
  return {
    ...data,
    inputs: data.inputs.filter((input) => input.id !== inputId),
    reports: data.reports.filter((report) => report.sourceInputId !== inputId),
    snippets: data.snippets.filter((snippet) => snippet.inputId !== inputId),
    notes: data.notes.filter((note) => note.sourceInputId !== inputId && note.sessionId !== inputId),
    inputSummaries: data.inputSummaries.filter((summary) => summary.inputId !== inputId),
  }
}

export function deleteReport(data: LocalAppData, reportId: string): LocalAppData {
  return {
    ...data,
    reports: data.reports.filter((report) => report.id !== reportId),
  }
}

export function createSnippet(data: LocalAppData, snippet: Snippet): LocalAppData {
  const existingByIdIndex = data.snippets.findIndex((existingSnippet) => existingSnippet.id === snippet.id)
  if (existingByIdIndex >= 0) {
    return {
      ...data,
      snippets: data.snippets.map((existingSnippet, index) => (index === existingByIdIndex ? snippet : existingSnippet)),
    }
  }

  const semanticKey = createSnippetSemanticKey(snippet)
  if (semanticKey) {
    const existingSemanticIndex = data.snippets.findIndex(
      (existingSnippet) => createSnippetSemanticKey(existingSnippet) === semanticKey,
    )
    if (existingSemanticIndex >= 0) {
      return {
        ...data,
        snippets: data.snippets.map((existingSnippet, index) =>
          index === existingSemanticIndex
            ? {
                ...existingSnippet,
                ...snippet,
                id: existingSnippet.id,
              }
            : existingSnippet,
        ),
      }
    }
  }

  return { ...data, snippets: [snippet, ...data.snippets] }
}

export function updateSnippet(
  data: LocalAppData,
  snippetId: string,
  values: { field?: string; fields?: string[]; text?: string; status?: SnippetStatus },
): LocalAppData {
  return {
    ...data,
    snippets: data.snippets.map((snippet) => {
      if (snippet.id !== snippetId) return snippet
      const nextFields =
        values.fields !== undefined
          ? normalizeSnippetLabels(values.fields, [])
          : values.field !== undefined
            ? normalizeSnippetLabels([], [values.field])
            : undefined
      const primaryField = nextFields && nextFields.length > 0 ? nextFields[0] : undefined
      return {
        ...snippet,
        ...(nextFields !== undefined
          ? {
              fields: nextFields,
              field: primaryField ?? snippet.field,
              fieldId: primaryField ?? snippet.fieldId ?? snippet.field,
            }
          : null),
        ...(values.text !== undefined ? { text: values.text } : null),
        ...(values.status !== undefined ? { status: values.status } : null),
        updatedAtUnixMs: Date.now(),
      }
    }),
  }
}

export function deleteSnippet(data: LocalAppData, snippetId: string): LocalAppData {
  return {
    ...data,
    snippets: data.snippets.filter((snippet) => snippet.id !== snippetId),
  }
}

export function createNote(data: LocalAppData, note: Note): LocalAppData {
  return { ...data, notes: [note, ...data.notes] }
}

export function updateNote(data: LocalAppData, noteId: string, values: { title?: string; text: string }): LocalAppData {
  return {
    ...data,
    notes: data.notes.map((note) => {
      if (note.id !== noteId) return note
      return {
        ...note,
        text: values.text,
        ...(values.title !== undefined ? { title: values.title } : null),
        updatedAtUnixMs: Date.now(),
      }
    }),
  }
}

export function deleteNote(data: LocalAppData, noteId: string): LocalAppData {
  return {
    ...data,
    notes: data.notes.filter((note) => note.id !== noteId),
  }
}

export function createTemplate(data: LocalAppData, template: Template): LocalAppData {
  return { ...data, templates: [template, ...data.templates] }
}

export function updateTemplate(data: LocalAppData, templateId: string, values: Partial<Template>): LocalAppData {
  return {
    ...data,
    templates: data.templates.map((template) => (template.id === templateId ? { ...template, ...values } : template)),
  }
}

export function deleteTemplate(data: LocalAppData, templateId: string): LocalAppData {
  return {
    ...data,
    templates: data.templates.filter((template) => template.id !== templateId),
  }
}

export function toggleTemplateSaved(data: LocalAppData, templateId: string): LocalAppData {
  return {
    ...data,
    templates: data.templates.map((template) =>
      template.id === templateId ? { ...template, isSaved: !(template.isSaved !== false) } : template,
    ),
  }
}

export function setInputSummary(data: LocalAppData, inputId: string, text: string): LocalAppData {
  const existing = data.inputSummaries.find((summary) => summary.inputId === inputId)
  if (existing) {
    return {
      ...data,
      inputSummaries: data.inputSummaries.map((summary) =>
        summary.inputId === inputId ? { ...summary, text, updatedAtUnixMs: Date.now() } : summary,
      ),
    }
  }

  return {
    ...data,
    inputSummaries: [{ inputId, text, updatedAtUnixMs: Date.now() }, ...data.inputSummaries],
  }
}

export function upsertReport(data: LocalAppData, report: Report): LocalAppData {
  const existingIndex = data.reports.findIndex((item) => item.id === report.id)
  if (existingIndex < 0) {
    return { ...data, reports: [report, ...data.reports] }
  }
  return {
    ...data,
    reports: data.reports.map((item) => (item.id === report.id ? report : item)),
  }
}

export function updateOrganizationSettings(data: LocalAppData, values: Partial<Omit<OrganizationSettings, 'updatedAtUnixMs'>>): LocalAppData {
  return {
    ...data,
    organizationSettings: {
      ...data.organizationSettings,
      ...values,
      updatedAtUnixMs: Date.now(),
    },
  }
}

export function updateUserSettings(data: LocalAppData, values: Partial<Omit<UserSettings, 'updatedAtUnixMs'>>): LocalAppData {
  return {
    ...data,
    userSettings: {
      ...data.userSettings,
      ...values,
      updatedAtUnixMs: Date.now(),
    },
  }
}


