import type { InputInput } from './types'
import {
  transcribeAudioFile,
  transcribeDocument,
  transcribeUploadedAudio,
  transcribeWrittenRecap,
} from './batch/transcribeInputsBatch'

export async function normalizeTranscript(input: InputInput): Promise<string> {
  if (input.inputType === 'written_recap') return transcribeWrittenRecap(input.text)
  if (input.inputType === 'uploaded_document') return transcribeDocument(input.text)
  if (input.inputType === 'uploaded_audio') return transcribeUploadedAudio({ audioBlob: input.audioBlob, mimeType: input.mimeType })
  return transcribeAudioFile({ audioBlob: input.audioBlob, mimeType: input.mimeType })
}

