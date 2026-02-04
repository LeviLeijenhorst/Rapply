export type Coachee = {
  id: string
  name: string
  createdAtUnixMs: number
  isArchived: boolean
}

export type SessionKind = 'recording' | 'upload' | 'written' | 'notes'

export type Session = {
  id: string
  coacheeId: string | null
  title: string
  createdAtUnixMs: number
  kind: SessionKind
  audioBlobId: string | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
}

export type Note = {
  id: string
  sessionId: string
  text: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type WrittenReport = {
  sessionId: string
  text: string
  updatedAtUnixMs: number
}

export type LocalAppData = {
  coachees: Coachee[]
  sessions: Session[]
  notes: Note[]
  writtenReports: WrittenReport[]
}

