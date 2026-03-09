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

export type SessionInputType = "recording" | "uploaded_audio" | "written_recap" | "intake"

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
  inputType: SessionInputType
  audioUploadId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcriptText: string | null
  summaryText: string | null
  summaryStructured: StructuredSessionSummary | null
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

export type Report = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  sourceSessionId: string | null
  title: string
  reportType: string
  state: "incomplete" | "needs_review" | "complete"
  reportText: string
  reportDate: string | null
  firstSickDay: string | null
  wvpWeekNumber: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type Trajectory = {
  id: string
  clientId: string
  name: string
  serviceType: string
  uwvContactName: string | null
  uwvContactPhone: string | null
  uwvContactEmail: string | null
  orderNumber: string | null
  startDate: string | null
  planOfAction: {
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
  clientId: string
  trajectoryId: string
  sourceSessionId: string
  snippetType: string
  text: string
  snippetDate: number
  approvalStatus: SnippetStatus
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
  reports: Report[]
  activities: Activity[]
  activityTemplates: ActivityTemplate[]
  snippets: Snippet[]
  notes: Note[]
  templates: Template[]
  practiceSettings: PracticeSettings
}
