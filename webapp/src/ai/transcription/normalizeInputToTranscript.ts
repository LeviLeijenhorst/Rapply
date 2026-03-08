import type { SessionInput } from './transcriptionTypes'
import { transcribeAudioInput } from './transcribeAudioInput'
import { transcribeDocumentInput } from './transcribeDocumentInput'
import { transcribeUploadedAudio } from './transcribeUploadedAudio'
import { transcribeWrittenInput } from './transcribeWrittenInput'

export async function normalizeInputToTranscript(input: SessionInput): Promise<string> {
  if (input.inputType === 'written_recap') return transcribeWrittenInput(input.text)
  if (input.inputType === 'uploaded_document') return transcribeDocumentInput(input.text)
  if (input.inputType === 'uploaded_audio') return transcribeUploadedAudio({ audioBlob: input.audioBlob, mimeType: input.mimeType })
  return transcribeAudioInput({ audioBlob: input.audioBlob, mimeType: input.mimeType })
}
