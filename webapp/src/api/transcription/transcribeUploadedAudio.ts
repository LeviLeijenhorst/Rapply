import { transcribeAudioFile } from './batch/transcribeAudioFile'

export async function transcribeUploadedAudio(params: { audioBlob: Blob; mimeType: string }): Promise<string> {
  return transcribeAudioFile(params)
}
