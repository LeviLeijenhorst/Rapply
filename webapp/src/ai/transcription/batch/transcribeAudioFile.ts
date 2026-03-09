import { transcribeAudio } from '../../transcribeAudio'

export async function transcribeAudioFile(params: { audioBlob: Blob; mimeType: string }): Promise<string> {
  const response = await transcribeAudio({
    audioBlob: params.audioBlob,
    mimeType: params.mimeType,
    languageCode: 'nl',
  })
  return String(response.transcript || '').trim()
}
