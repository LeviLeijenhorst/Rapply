export type Client = {
  id: string
  name: string
  clientDetails: string
  employerDetails: string
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
  name: string
  uwvContactName: string | null
  orderNumber: string | null
  startDate: string | null
  dienstType?: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type SnippetStatus = 'pending' | 'approved' | 'rejected'

export type Snippet = {
  id: string
  trajectoryId: string
  inputId: string
  itemId?: string
  field: string
  text: string
  date: number
  status: SnippetStatus
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type Note = {
  id: string
  sessionId: string
  title: string
  text: string
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

