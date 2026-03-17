export type Client = {
  id: string
  organizationId?: string
  name: string
  clientDetails: string
  employerDetails: string
  trajectoryStartDate?: string | null
  trajectoryEndDate?: string | null
  createdByUserId?: string | null
  primaryCoachUserId?: string | null
  assignedCoachUserIds?: string[]
  assignedCoaches?: Array<{
    userId: string
    displayName: string | null
    email: string | null
    role: string
  }>
  createdAtUnixMs: number
  updatedAtUnixMs: number
  isArchived: boolean
}

export type InputType = 'recorded-session' | 'uploaded-session' | 'spoken-recap' | 'written-recap' | 'uploaded-document'
export type InputKind = 'recording' | 'upload' | 'written' | 'notes' | 'intake'

export type Input = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  title: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  type: InputType
  kind: InputKind
  audioBlobId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
  summaryStructured?: unknown
  reportDate: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
}

export type Trajectory = {
  id: string
  clientId: string
  isActive?: boolean
  name: string
  serviceType?: string | null
  uwvContactName: string | null
  uwvContactPhone?: string | null
  uwvContactEmail?: string | null
  orderNumber: string | null
  startDate: string | null
  planOfAction?: { documentId: string } | null
  maxHours?: number
  maxAdminHours?: number
  dienstType?: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type SnippetStatus = 'pending' | 'approved' | 'rejected'

export type Snippet = {
  id: string
  clientId?: string | null
  trajectoryId: string | null
  inputId: string
  sourceInputId?: string | null
  sourceSessionId?: string | null
  itemId?: string
  fields?: string[]
  field: string
  fieldId?: string
  text: string
  date: number
  status: SnippetStatus
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type Note = {
  id: string
  clientId?: string | null
  sourceInputId?: string | null
  sessionId: string
  title: string
  text: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type ReportFieldType = 'programmatic' | 'ai' | 'manual'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[]

export type ReportFieldVersion = {
  id: string
  source: 'ai_generation' | 'ai_regeneration' | 'manual_edit' | 'chat_update'
  answer: JsonValue
  factualBasis: string
  reasoning: string
  confidence: number | null
  prompt: string | null
  createdAtUnixMs: number
}

export type StructuredReportField = {
  fieldId: string
  label: string
  fieldType: ReportFieldType
  answer: JsonValue
  factualBasis: string
  reasoning: string
  confidence: number | null
  updatedAtUnixMs: number
  versions: ReportFieldVersion[]
}

export type StructuredReport = {
  templateId: string
  templateName: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  fields: Record<string, StructuredReportField>
}

export type ReportState = 'incomplete' | 'needs_review' | 'complete'

export type Report = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  sourceInputId: string | null
  createdByUserId?: string | null
  primaryAuthorUserId?: string | null
  reportCoachUserIds?: string[]
  reportCoaches?: Array<{
    userId: string
    displayName: string | null
    email: string | null
  }>
  title: string
  reportType: string
  state: ReportState
  reportText: string
  reportStructuredJson: StructuredReport | null
  reportDate: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type TemplateCategory = 'gespreksverslag' | 'ander-verslag'

export type TemplateSection = {
  id: string
  title: string
  prompt: string
}

export type Template = {
  id: string
  name: string
  category: TemplateCategory
  description: string
  sections: TemplateSection[]
  isDefault?: boolean
  isSaved?: boolean
  createdAtUnixMs?: number
  updatedAtUnixMs?: number
}

export type WrittenReport = {
  sessionId: string
  text: string
  updatedAtUnixMs: number
}

export type InputSummary = {
  inputId: string
  sessionId?: string
  text: string
  updatedAtUnixMs: number
}

export type OrganizationSettings = {
  name: string
  practiceName?: string
  website: string
  visitAddress: string
  postalAddress: string
  postalCodeCity: string
  visitPostalCodeCity?: string
  tintColor?: string
  logoDataUrl?: string | null
  contactName?: string
  contactRole?: string
  contactPhone?: string
  contactEmail?: string
  updatedAtUnixMs: number
}

export type UserSettings = {
  name: string
  role: string
  phone: string
  email: string
  updatedAtUnixMs: number
}

export type LocalAppData = {
  clients: Client[]
  trajectories: Trajectory[]
  inputs: Input[]
  reports: Report[]
  snippets: Snippet[]
  notes: Note[]
  templates: Template[]
  inputSummaries: InputSummary[]
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
  practiceSettings?: {
    practiceName: string
    website: string
    visitAddress: string
    postalAddress: string
    postalCodeCity: string
    contactName: string
    contactRole: string
    contactPhone: string
    contactEmail: string
    tintColor: string
    logoDataUrl: string | null
    updatedAtUnixMs: number
  }
  coachees?: Client[]
  sessions?: Input[]
  writtenReports?: WrittenReport[]
}

