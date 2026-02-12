import { createAudioBlobRemote } from '../services/audioBlobs'
import { transcribeAudio } from '../services/transcription'
import { generateSummary } from '../services/summary'
import { normalizeTranscriptionError } from '../utils/transcriptionError'

type SessionUpdate = {
  audioBlobId?: string | null
  transcript?: string | null
  summary?: string | null
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError?: string | null
}

type E2eeAudio = {
  encryptAudioBlobForStorage: (params: { audioBlob: Blob; mimeType: string }) => Promise<Blob>
}

export async function processSessionAudio(params: {
  sessionId: string
  audioBlob: Blob
  mimeType: string
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
  initialAudioBlobId: string | null
  e2ee: E2eeAudio
  updateSession: (sessionId: string, values: SessionUpdate) => void
  onAudioUploaded?: (audioBlobId: string) => void | Promise<void>
}): Promise<void> {
  const { sessionId, audioBlob, mimeType, summaryTemplate, initialAudioBlobId, e2ee, updateSession, onAudioUploaded } = params

  let ensuredAudioBlobId = initialAudioBlobId
  if (!ensuredAudioBlobId) {
    const encryptedBlob = await e2ee.encryptAudioBlobForStorage({ audioBlob, mimeType })
    const createdAudio = await createAudioBlobRemote({ audioBlob: encryptedBlob, mimeType: 'application/octet-stream' })
    const nextId = String(createdAudio.audioBlobId || '').trim()
    if (!nextId) {
      throw new Error('Geen audio id teruggekregen van de server.')
    }
    ensuredAudioBlobId = nextId
    updateSession(sessionId, { audioBlobId: ensuredAudioBlobId })
    if (onAudioUploaded) {
      await onAudioUploaded(ensuredAudioBlobId)
    }
  } else if (onAudioUploaded) {
    await onAudioUploaded(ensuredAudioBlobId)
  }

  updateSession(sessionId, {
    transcriptionStatus: 'transcribing',
    transcriptionError: null,
  })

  try {
    const { transcript, summary } = await transcribeAudio({
      audioBlob,
      mimeType,
      languageCode: 'nl',
    })
    const cleanedSummary = String(summary || '').trim()
    if (cleanedSummary) {
      updateSession(sessionId, {
        transcript,
        summary: cleanedSummary,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      return
    }

    updateSession(sessionId, {
      transcript,
      transcriptionStatus: 'generating',
      transcriptionError: null,
    })
    const generatedSummary = await generateSummary({
      transcript,
      template: summaryTemplate,
    })
    updateSession(sessionId, {
      summary: generatedSummary,
      transcriptionStatus: 'done',
      transcriptionError: null,
    })
  } catch (error) {
    updateSession(sessionId, {
      transcriptionStatus: 'error',
      transcriptionError: normalizeTranscriptionError(error),
    })
    throw error
  }
}
