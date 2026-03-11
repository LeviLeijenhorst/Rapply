import { transcribeAudioBatch } from './transcribeAudioBatch'

export async function transcribeAudioFile(params: { audioBlob: Blob; mimeType: string }): Promise<string> {
  const response = await transcribeAudioBatch({
    audioBlob: params.audioBlob,
    mimeType: params.mimeType,
    languageCode: 'nl',
  })
  return String(response.transcript || '').trim()
}

export async function transcribeUploadedAudio(params: { audioBlob: Blob; mimeType: string }): Promise<string> {
  return transcribeAudioFile(params)
}

export async function transcribeDocument(text: string): Promise<string> {
  return String(text || '').trim()
}

export async function transcribeWrittenRecap(text: string): Promise<string> {
  return String(text || '').trim()
}
