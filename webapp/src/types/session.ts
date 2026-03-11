export type InputInputType =
  | 'full_audio_recording'
  | 'spoken_recap_recording'
  | 'written_recap'
  | 'uploaded_audio'
  | 'uploaded_document'

export type InputStatus = 'idle' | 'transcribing' | 'summarizing' | 'done' | 'error'

export type Input = {
  id: string
  clientId: string | null
  inputType: InputInputType
  transcript: string | null
  summary: string | null
  status: InputStatus
  title: string
  createdAt: number
  updatedAt: number
}

