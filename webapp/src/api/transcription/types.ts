export type InputInputType =
  | 'full_audio_recording'
  | 'spoken_recap_recording'
  | 'written_recap'
  | 'uploaded_audio'
  | 'uploaded_document'

export type InputInput =
  | { inputType: 'full_audio_recording'; audioBlob: Blob; mimeType: string }
  | { inputType: 'spoken_recap_recording'; audioBlob: Blob; mimeType: string }
  | { inputType: 'uploaded_audio'; audioBlob: Blob; mimeType: string }
  | { inputType: 'written_recap'; text: string }
  | { inputType: 'uploaded_document'; text: string }

