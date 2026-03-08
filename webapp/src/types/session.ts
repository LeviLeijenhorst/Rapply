export type SessionInputType =
  | 'full_audio_recording'
  | 'spoken_recap_recording'
  | 'written_recap'
  | 'uploaded_audio'
  | 'uploaded_document'

export type SessionStatus = 'idle' | 'transcribing' | 'summarizing' | 'done' | 'error'

export type Session = {
  id: string
  clientId: string | null
  inputType: SessionInputType
  transcript: string | null
  summary: string | null
  status: SessionStatus
  title: string
  createdAt: number
  updatedAt: number
}
