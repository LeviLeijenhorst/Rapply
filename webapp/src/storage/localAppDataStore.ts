import { createDefaultLocalAppData } from './defaultData'
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from './localStorageJson'
import type {
  Client,
  Input,
  InputSummary,
  LocalAppData,
  Note,
  OrganizationSettings,
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

  return {
    clients: normalizeClients(source.clients ?? source.coachees, fallback.clients),
    trajectories: normalizeTrajectories(source.trajectories, normalizeClients(source.clients ?? source.coachees, fallback.clients), fallback.trajectories),
    inputs: normalizeInputs(source.inputs ?? source.sessions, fallback.inputs),
    snippets: normalizeSnippets(source.snippets, fallback.snippets),
    notes: normalizeNotes(source.notes, fallback.notes),
    templates: normalizeTemplates(source.templates, fallback.templates),
    inputSummaries: normalizeInputSummaries(source.inputSummaries ?? source.writtenReports, fallback.inputSummaries),
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
    .filter((client): client is Client => Boolean(client))
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
        name: String(candidate.name ?? '').trim() || 'Traject',
        uwvContactName: typeof candidate.uwvContactName === 'string' ? candidate.uwvContactName : null,
        orderNumber: typeof candidate.orderNumber === 'string' ? candidate.orderNumber : null,
        startDate: typeof candidate.startDate === 'string' ? candidate.startDate : null,
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Trajectory
    })
    .filter((trajectory): trajectory is Trajectory => Boolean(trajectory))

  if (normalized.length > 0) return normalized
  if (clients.length === 0) return fallback

  return clients.map((client) => ({
    id: defaultTrajectoryIdForClient(client.id),
    clientId: client.id,
    name: 'Traject',
    uwvContactName: null,
    orderNumber: null,
    startDate: null,
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
        reportDate: nullableText(candidate.reportDate),
        transcriptionStatus: normalizeTranscriptionStatus(candidate.transcriptionStatus),
        transcriptionError: nullableText(candidate.transcriptionError),
      } satisfies Input
    })
    .filter(Boolean) as Input[]
}

function normalizeSnippets(raw: unknown, fallback: Snippet[]): Snippet[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const now = Date.now()
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      const trajectoryId = String(candidate.trajectoryId ?? '').trim()
      const inputId = String(candidate.inputId ?? candidate.itemId ?? '').trim()
      const field = String(candidate.field ?? '').trim()
      if (!id || !trajectoryId || !inputId || !field) return null
      return {
        id,
        trajectoryId,
        inputId,
        itemId: inputId,
        field,
        text: String(candidate.text ?? ''),
        date: Number.isFinite(candidate.date) ? Number(candidate.date) : now,
        status: normalizeSnippetStatus(candidate.status),
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Snippet
    })
    .filter(Boolean) as Snippet[]
}

function normalizeNotes(raw: unknown, fallback: Note[]): Note[] {
  if (!Array.isArray(raw)) return fallback
  return raw
    .map((item) => {
      const candidate = item as Record<string, unknown>
      const id = String(candidate.id ?? '').trim()
      const sessionId = String(candidate.sessionId ?? candidate.inputId ?? '').trim()
      if (!id || !sessionId) return null
      const now = Date.now()
      return {
        id,
        sessionId,
        title: String(candidate.title ?? ''),
        text: String(candidate.text ?? ''),
        createdAtUnixMs: Number.isFinite(candidate.createdAtUnixMs) ? Number(candidate.createdAtUnixMs) : now,
        updatedAtUnixMs: Number.isFinite(candidate.updatedAtUnixMs) ? Number(candidate.updatedAtUnixMs) : now,
      } satisfies Note
    })
    .filter((note): note is Note => Boolean(note))
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
    .filter((summary): summary is InputSummary => Boolean(summary))
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
      return 'recorded-session'
    case 'upload':
      return 'uploaded-session'
    case 'written':
      return 'written-recap'
    case 'notes':
    case 'intake':
      return 'spoken-recap'
    default:
      return 'written-recap'
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
    snippets: data.snippets.filter((snippet) => !removedTrajectoryIds.has(snippet.trajectoryId) && !removedInputIds.has(snippet.inputId)),
    notes: data.notes.filter((note) => !removedInputIds.has(note.sessionId)),
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
    snippets: data.snippets.filter((snippet) => snippet.trajectoryId !== trajectoryId && !removedInputIds.has(snippet.inputId)),
    notes: data.notes.filter((note) => !removedInputIds.has(note.sessionId)),
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
    snippets: data.snippets.filter((snippet) => snippet.inputId !== inputId),
    notes: data.notes.filter((note) => note.sessionId !== inputId),
    inputSummaries: data.inputSummaries.filter((summary) => summary.inputId !== inputId),
  }
}

export function createSnippet(data: LocalAppData, snippet: Snippet): LocalAppData {
  return { ...data, snippets: [snippet, ...data.snippets] }
}

export function updateSnippet(
  data: LocalAppData,
  snippetId: string,
  values: { field?: string; text?: string; status?: SnippetStatus },
): LocalAppData {
  return {
    ...data,
    snippets: data.snippets.map((snippet) => {
      if (snippet.id !== snippetId) return snippet
      return {
        ...snippet,
        ...(values.field !== undefined ? { field: values.field } : null),
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


