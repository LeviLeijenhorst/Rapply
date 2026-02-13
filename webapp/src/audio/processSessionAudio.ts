import { createAudioBlobRemote } from '../services/audioBlobs'
import { isTranscriptionCancelledError, transcribeAudio } from '../services/transcription'
import { generateSummary } from '../services/summary'
import {
  finishTranscriptionRun,
  isTranscriptionRunActive,
  setSummaryAbortController,
  setTranscriptionAbortController,
  setTranscriptionOperationId,
  startTranscriptionRun,
} from '../services/transcriptionRunStore'
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
  const runId = startTranscriptionRun(sessionId)

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
    const transcriptionAbortController = new AbortController()
    setTranscriptionAbortController(sessionId, runId, transcriptionAbortController)
    const { transcript, summary } = await transcribeAudio({
      audioBlob,
      mimeType,
      languageCode: 'nl',
      signal: transcriptionAbortController.signal,
      progress: {
        onOperationPrepared: (operationId) => {
          if (!isTranscriptionRunActive(sessionId, runId)) return
          setTranscriptionOperationId(sessionId, runId, operationId)
        },
      },
    })
    if (!isTranscriptionRunActive(sessionId, runId)) return
    setTranscriptionAbortController(sessionId, runId, null)
    const cleanedSummary = String(summary || '').trim()
    if (cleanedSummary) {
      updateSession(sessionId, {
        transcript,
        summary: cleanedSummary,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      finishTranscriptionRun(sessionId, runId)
      return
    }

    const summaryAbortController = new AbortController()
    setSummaryAbortController(sessionId, runId, summaryAbortController)
    updateSession(sessionId, {
      transcript,
      transcriptionStatus: 'generating',
      transcriptionError: null,
    })
    const generatedSummary = await generateSummary({
      transcript,
      template: summaryTemplate,
      signal: summaryAbortController.signal,
    })
    if (!isTranscriptionRunActive(sessionId, runId)) return
    updateSession(sessionId, {
      summary: generatedSummary,
      transcriptionStatus: 'done',
      transcriptionError: null,
    })
    finishTranscriptionRun(sessionId, runId)
  } catch (error) {
    if (!isTranscriptionRunActive(sessionId, runId)) {
      return
    }
    if (isTranscriptionCancelledError(error)) {
      finishTranscriptionRun(sessionId, runId)
      return
    }
    updateSession(sessionId, {
      transcriptionStatus: 'error',
      transcriptionError: normalizeTranscriptionError(error),
    })
    finishTranscriptionRun(sessionId, runId)
    throw error
  }
}
