export type Coachee = {
  id: string
  name: string
  clientDetails: string
  employerDetails: string
  firstSickDay: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  isArchived: boolean
}

export type SessionKind = 'recording' | 'upload' | 'written' | 'notes'

export type Session = {
  id: string
  coacheeId: string | null
  title: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  kind: SessionKind
  audioBlobId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
  reportDate: string | null
  wvpWeekNumber: string | null
  reportFirstSickDay: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
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

export type TemplateSection = {
  id: string
  title: string
  description: string
}

export type Template = {
  id: string
  name: string
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
  tintColor: string
  logoDataUrl: string | null
  updatedAtUnixMs: number
}

export type LocalAppData = {
  coachees: Coachee[]
  sessions: Session[]
  notes: Note[]
  writtenReports: WrittenReport[]
  templates: Template[]
  practiceSettings: PracticeSettings
}
