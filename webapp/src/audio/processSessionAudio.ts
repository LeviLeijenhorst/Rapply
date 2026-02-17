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
import {
  clearPendingPreviewAudioIfEligible,
  clearPendingPreviewAudio,
  markPendingPreviewTranscriptionSucceeded,
  markPendingPreviewAudioUploaded,
  setPendingPreviewProcessingState,
} from './pendingPreviewStore'

type SessionUpdate = {
  audioBlobId?: string | null
  transcript?: string | null
  summary?: string | null
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError?: string | null
}

type E2eeAudio = {
  encryptAudioBlobForStorage: (params: { audioBlob: Blob; mimeType: string }) => Promise<Blob>
  shouldStoreAudioAsOctetStream: boolean
}

const activeProcessingSessionIds = new Set<string>()

export async function processSessionAudio(params: {
  sessionId: string
  audioBlob: Blob
  mimeType: string
  shouldSaveAudio?: boolean
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
  initialAudioBlobId: string | null
  e2ee: E2eeAudio
  updateSession: (sessionId: string, values: SessionUpdate) => void
}): Promise<void> {
  const { sessionId, audioBlob, mimeType, shouldSaveAudio = true, summaryTemplate, initialAudioBlobId, e2ee, updateSession } = params

  if (activeProcessingSessionIds.has(sessionId)) {
    return
  }
  activeProcessingSessionIds.add(sessionId)

  const runId = startTranscriptionRun(sessionId)

  let ensuredAudioBlobId = initialAudioBlobId
  let hasTranscriptResult = false
  try {
    if (shouldSaveAudio && !ensuredAudioBlobId) {
      await setPendingPreviewProcessingState({ sessionId, processingState: 'encrypting', errorMessage: null })
      const encryptedBlob = await e2ee.encryptAudioBlobForStorage({ audioBlob, mimeType })

      await setPendingPreviewProcessingState({ sessionId, processingState: 'uploading', errorMessage: null })
      const storageMimeType = e2ee.shouldStoreAudioAsOctetStream ? 'application/octet-stream' : mimeType
      const createdAudio = await createAudioBlobRemote({ audioBlob: encryptedBlob, mimeType: storageMimeType })
      const nextId = String(createdAudio.audioBlobId || '').trim()
      if (!nextId) {
        throw new Error('Geen audio id teruggekregen van de server.')
      }
      ensuredAudioBlobId = nextId
      updateSession(sessionId, { audioBlobId: ensuredAudioBlobId })
      await markPendingPreviewAudioUploaded({ sessionId, audioBlobId: ensuredAudioBlobId })
      await clearPendingPreviewAudioIfEligible(sessionId)
    } else if (shouldSaveAudio && ensuredAudioBlobId) {
      await markPendingPreviewAudioUploaded({ sessionId, audioBlobId: ensuredAudioBlobId })
      await clearPendingPreviewAudioIfEligible(sessionId)
    }

    updateSession(sessionId, {
      transcriptionStatus: 'transcribing',
      transcriptionError: null,
    })

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
      await markPendingPreviewTranscriptionSucceeded(sessionId)
      await clearPendingPreviewAudioIfEligible(sessionId)
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
    hasTranscriptResult = true
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
    await markPendingPreviewTranscriptionSucceeded(sessionId)
    await clearPendingPreviewAudioIfEligible(sessionId)
    finishTranscriptionRun(sessionId, runId)
  } catch (error) {
    if (!isTranscriptionRunActive(sessionId, runId)) {
      return
    }

    const errorMessage = normalizeTranscriptionError(error)
    if (isTranscriptionCancelledError(error)) {
      finishTranscriptionRun(sessionId, runId)
      return
    }

    if (hasTranscriptResult) {
      updateSession(sessionId, {
        transcriptionStatus: 'done',
        transcriptionError: errorMessage,
      })
      if (!shouldSaveAudio) {
        await clearPendingPreviewAudio(sessionId)
      }
      finishTranscriptionRun(sessionId, runId)
      return
    }

    if (shouldSaveAudio && !ensuredAudioBlobId) {
      await setPendingPreviewProcessingState({ sessionId, processingState: 'failed', errorMessage })
    }
    if (!shouldSaveAudio) {
      await setPendingPreviewProcessingState({ sessionId, processingState: 'failed', errorMessage })
      await clearPendingPreviewAudio(sessionId)
    }

    updateSession(sessionId, {
      transcriptionStatus: 'error',
      transcriptionError: errorMessage,
    })
    finishTranscriptionRun(sessionId, runId)
    throw error
  } finally {
    activeProcessingSessionIds.delete(sessionId)
  }
}
