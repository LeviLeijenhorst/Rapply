export type Client = {
  id: string
  name: string
  clientDetails: string
  employerDetails: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  isArchived: boolean
}

export type Input = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  title: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  type: 'recorded-session' | 'uploaded-session' | 'spoken-recap' | 'written-recap' | 'uploaded-document'
  audioBlobId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
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
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type SnippetStatus = 'pending' | 'approved' | 'rejected'

export type Snippet = {
  id: string
  trajectoryId: string
  inputId: string
  field: string
  text: string
  date: number
  status: SnippetStatus
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type OrganizationSettings = {
  name: string
  website: string
  visitAddress: string
  postalAddress: string
  postalCodeCity: string
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
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
}
