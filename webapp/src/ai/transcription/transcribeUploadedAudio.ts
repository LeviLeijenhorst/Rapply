import { transcribeAudioInput } from './transcribeAudioInput'

export async function transcribeUploadedAudio(params: { audioBlob: Blob; mimeType: string }): Promise<string> {
  return transcribeAudioInput(params)
}
