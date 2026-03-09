export type Client = {
  id: string
  name: string
  clientDetails: string
  employerDetails: string
  firstSickDay: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  isArchived: boolean
}

// Session is used as a generic artifact container in the current product.
// kind distinguishes conversation inputs, notes artifacts, intake artifacts, and written reports.
export type SessionKind = "recording" | "upload" | "written" | "notes" | "intake"

export type StructuredSessionSummary = {
  doelstelling: string
  belastbaarheid: string
  belemmeringen: string
  voortgang: string
  arbeidsmarktorientatie: string
}

export type Session = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  title: string
  kind: SessionKind
  audioBlobId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
  summaryStructured: StructuredSessionSummary | null
  reportDate: string | null
  wvpWeekNumber: string | null
  reportFirstSickDay: string | null
  transcriptionStatus: "idle" | "transcribing" | "generating" | "done" | "error"
  transcriptionError: string | null
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

export type WrittenReport = {
  sessionId: string
  text: string
  updatedAtUnixMs: number
}

export type Trajectory = {
  id: string
  clientId: string
  name: string
  dienstType: string
  uwvContactName: string | null
  uwvContactPhone: string | null
  uwvContactEmail: string | null
  orderNumber: string | null
  startDate: string | null
  planVanAanpak: {
    documentId: string
  } | null
  maxHours: number
  maxAdminHours: number
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type ActivityStatus = "planned" | "executed"
export type ActivitySource = "manual" | "ai_detected"

export type Activity = {
  id: string
  trajectoryId: string
  sessionId: string | null
  templateId: string | null
  name: string
  category: string
  status: ActivityStatus
  plannedHours: number | null
  actualHours: number | null
  source: ActivitySource
  isAdmin: boolean
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type ActivityTemplate = {
  id: string
  name: string
  description: string
  category: string
  defaultHours: number
  isAdmin: boolean
  organizationId: string | null
  isActive: boolean
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type SnippetStatus = "pending" | "approved" | "rejected"

export type Snippet = {
  id: string
  trajectoryId: string
  itemId: string
  field: string
  text: string
  date: number
  status: SnippetStatus
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type TemplateSection = {
  id: string
  title: string
  description: string
}

export type TemplateCategory = "gespreksverslag" | "ander-verslag"

export type Template = {
  id: string
  name: string
  category: TemplateCategory
  description: string
  sections: TemplateSection[]
  isSaved: boolean
  isDefault: boolean
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type PracticeSettings = {
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

export type AppData = {
  clients: Client[]
  trajectories: Trajectory[]
  sessions: Session[]
  activities: Activity[]
  activityTemplates: ActivityTemplate[]
  snippets: Snippet[]
  notes: Note[]
  writtenReports: WrittenReport[]
  templates: Template[]
  practiceSettings: PracticeSettings
}
