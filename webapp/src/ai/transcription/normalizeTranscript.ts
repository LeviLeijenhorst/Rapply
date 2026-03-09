import type { SessionInput } from './types'
import { transcribeAudioFile } from './batch/transcribeAudioFile'
import { transcribeDocument } from './batch/transcribeDocument'
import { transcribeUploadedAudio } from './transcribeUploadedAudio'
import { transcribeWrittenRecap } from './batch/transcribeWrittenRecap'

export async function normalizeTranscript(input: SessionInput): Promise<string> {
  if (input.inputType === 'written_recap') return transcribeWrittenRecap(input.text)
  if (input.inputType === 'uploaded_document') return transcribeDocument(input.text)
  if (input.inputType === 'uploaded_audio') return transcribeUploadedAudio({ audioBlob: input.audioBlob, mimeType: input.mimeType })
  return transcribeAudioFile({ audioBlob: input.audioBlob, mimeType: input.mimeType })
}
