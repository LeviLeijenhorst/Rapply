import { useRef } from 'react'

import { downloadAudioStream } from '../../audio/downloadAudioStream'
import { clearPendingPreviewAudio, clearPendingPreviewAudioIfEligible, getPendingPreviewAudioForTranscription, markPendingPreviewTranscriptionSucceeded } from '../../audio/pendingPreviewStore'
import type { Session, StructuredSessionSummary } from '../../storage/types'
import { loadAudioBlobRemote } from '../../api/audio/audioBlobApi'
import { fetchBillingStatus } from '../../api/billing/billingApi'
import { cancelTranscriptionOperation, isTranscriptionCancelledError, transcribeAudio } from '../../ai/transcribeAudio'
import {
  cancelTranscriptionRun,
  finishTranscriptionRun,
  isTranscriptionRunActive,
  setSummaryAbortController,
  setTranscriptionAbortController,
  setTranscriptionOperationId,
  startTranscriptionRun,
} from '../../ai/transcription/transcriptionRunState'
import { hasStructuredSummaryContent, mapReportMarkdownToStructuredSummary } from '../../types/structuredSummary'
import { normalizeTranscriptionError } from '../../audio/processing/transcriptionError'

type TranscriptionStatus = Session['transcriptionStatus']
type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

type Params = {
  buildSummaryInputWithContext: (sourceText: string) => string
  clearQuickQuestionsChatForSession: (sessionId: string) => void
  currentAudioDurationSeconds: number | null
  deleteSession: (sessionId: string) => void
  e2ee: {
    decryptAudioBlobFromStorage: (blob: Blob) => Promise<{ audioBlob: Blob; mimeType: string }>
    decryptAudioChunkFromStorage: (params: { encryptedChunk: Uint8Array }) => Promise<Uint8Array>
  } | null
  editableSessionTitle: string
  effectiveTranscriptionStatus: TranscriptionStatus
  generateStructuredSessionSummary: (params: { transcript: string; signal?: AbortSignal }) => Promise<StructuredSessionSummary>
  hasTranscript: boolean
  isDeletingAudio: boolean
  isDownloadingAudio: boolean
  onBack: () => void
  pendingPreviewShouldSaveAudio: boolean | null
  readRemainingTranscriptionSeconds: (status: BillingStatus | null) => number
  session: Session | null
  sessionId: string
  setForcedTranscriptionStatus: (value: 'transcribing' | 'generating' | null) => void
  setIsCancelTranscriptionModalVisible: (visible: boolean) => void
  setIsDeletingAudio: (value: boolean) => void
  setIsDownloadingAudio: (value: boolean) => void
  setIsNoMinutesModalVisible: (visible: boolean) => void
  setRemainingTranscriptionSeconds: (seconds: number) => void
  setRequiredTranscriptionSeconds: (seconds: number) => void
  updateSession: (sessionId: string, patch: Partial<Session>) => void
}

function parseRemainingSecondsFromErrorMessage(message: string): number | null {
  const match = String(message || '').match(/remaining\s+(\d+(?:[.,]\d+)?)\s*s/i)
  if (!match?.[1]) return null
  const parsed = Number.parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.floor(parsed))
}

function isInsufficientMinutesError(error: unknown): boolean {
  const rawMessage = String(error instanceof Error ? error.message : error || '')
  const normalizedMessage = normalizeTranscriptionError(error)
  const loweredRaw = rawMessage.toLowerCase()
  const loweredNormalized = normalizedMessage.toLowerCase()
  return (
    loweredRaw.includes('not enough seconds remaining') ||
    loweredRaw.includes('insufficient') ||
    loweredNormalized.includes('niet genoeg minuten over voor transcriptie')
  )
}

export function useSessieDetailTranscriptionFlow({
  buildSummaryInputWithContext,
  clearQuickQuestionsChatForSession,
  currentAudioDurationSeconds,
  deleteSession,
  e2ee,
  editableSessionTitle,
  effectiveTranscriptionStatus,
  generateStructuredSessionSummary,
  hasTranscript,
  isDeletingAudio,
  isDownloadingAudio,
  onBack,
  pendingPreviewShouldSaveAudio,
  readRemainingTranscriptionSeconds,
  session,
  sessionId,
  setForcedTranscriptionStatus,
  setIsCancelTranscriptionModalVisible,
  setIsDeletingAudio,
  setIsDownloadingAudio,
  setIsNoMinutesModalVisible,
  setRemainingTranscriptionSeconds,
  setRequiredTranscriptionSeconds,
  updateSession,
}: Params) {
  const generationRunIdRef = useRef(0)
  const generationSnapshotRef = useRef<{
    transcript: string | null
    summary: string | null
    summaryStructured: StructuredSessionSummary | null
    transcriptionStatus: TranscriptionStatus
    transcriptionError: string | null
  } | null>(null)

  function beginGenerationRun() {
    const runId = startTranscriptionRun(sessionId)
    generationRunIdRef.current = runId
    generationSnapshotRef.current = {
      transcript: session?.transcript ?? null,
      summary: session?.summary ?? null,
      summaryStructured: session?.summaryStructured ?? null,
      transcriptionStatus: session?.transcriptionStatus ?? 'idle',
      transcriptionError: session?.transcriptionError ?? null,
    }
    return runId
  }

  function isGenerationRunActive(runId: number) {
    return generationRunIdRef.current === runId && isTranscriptionRunActive(sessionId, runId)
  }

  function clearGenerationTracking() {
    setForcedTranscriptionStatus(null)
    finishTranscriptionRun(sessionId, generationRunIdRef.current)
    generationSnapshotRef.current = null
  }

  function restoreSessionAfterGenerationFailure() {
    const previousSnapshot = generationSnapshotRef.current
    if (previousSnapshot) {
      updateSession(sessionId, {
        transcript: previousSnapshot.transcript,
        summary: previousSnapshot.summary,
        summaryStructured: previousSnapshot.summaryStructured,
        transcriptionStatus: previousSnapshot.transcriptionStatus === 'error' ? 'idle' : previousSnapshot.transcriptionStatus,
        transcriptionError: null,
      })
      return
    }
    updateSession(sessionId, {
      transcriptionStatus: hasTranscript ? 'done' : 'idle',
      transcriptionError: null,
    })
  }

  async function ensureSufficientTranscriptionMinutes(): Promise<boolean> {
    const requiredSeconds = Math.max(1, Math.ceil(currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? 1))
    try {
      const response = await fetchBillingStatus()
      const remainingSeconds = readRemainingTranscriptionSeconds(response?.billingStatus ?? null)
      if (remainingSeconds < requiredSeconds) {
        setRequiredTranscriptionSeconds(requiredSeconds)
        setRemainingTranscriptionSeconds(remainingSeconds)
        setIsNoMinutesModalVisible(true)
        return false
      }
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to read billing status before transcription start', error)
    }
    return true
  }

  async function generateSummaryFromTranscript(transcriptValue: string, runIdOverride?: number) {
    const transcript = String(transcriptValue || '').trim()
    if (!transcript) return

    const runId = runIdOverride ?? beginGenerationRun()
    const summaryAbortController = new AbortController()
    setSummaryAbortController(sessionId, runId, summaryAbortController)

    try {
      setForcedTranscriptionStatus('generating')
      updateSession(sessionId, {
        transcript,
        transcriptionStatus: 'generating',
        transcriptionError: null,
        summary: null,
        summaryStructured: null,
      })
      const generatedSummary = await generateStructuredSessionSummary({
        transcript: buildSummaryInputWithContext(transcript),
        signal: summaryAbortController.signal,
      })
      if (!isGenerationRunActive(runId)) return
      updateSession(sessionId, {
        summary: null,
        summaryStructured: generatedSummary,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      await markPendingPreviewTranscriptionSucceeded(sessionId)
      await clearPendingPreviewAudioIfEligible(sessionId)
      clearGenerationTracking()
    } catch (error) {
      if (!isGenerationRunActive(runId)) return
      if (isTranscriptionCancelledError(error)) return
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: normalizeTranscriptionError(error),
      })
      clearGenerationTracking()
    }
  }

  async function loadDecryptedSessionAudio(audioId: string): Promise<{ audioBlob: Blob; mimeType: string }> {
    if (!e2ee) throw new Error('Encryptiecontext ontbreekt')
    try {
      const storedAudio = await loadAudioBlobRemote(audioId)
      if (!storedAudio) {
        throw new Error('Audio blob not found')
      }
      const decryptedBlob = await e2ee.decryptAudioBlobFromStorage(storedAudio.blob)
      return { audioBlob: decryptedBlob.audioBlob, mimeType: decryptedBlob.mimeType }
    } catch (blobError) {
      console.warn('[transcription] Blob load failed for session audio, trying stream fallback', {
        sessionId,
        audioId,
        error: blobError,
      })
      return downloadAudioStream({
        audioStreamId: audioId,
        decryptChunk: (encryptedChunk) => e2ee.decryptAudioChunkFromStorage({ encryptedChunk }),
      })
    }
  }

  async function loadAudioForTranscription(): Promise<{ audioBlob: Blob; mimeType: string }> {
    const audioId = String(session?.audioBlobId || '').trim()
    if (audioId) {
      return loadDecryptedSessionAudio(audioId)
    }
    const pendingPreview = await getPendingPreviewAudioForTranscription(sessionId)
    if (pendingPreview) {
      return {
        audioBlob: pendingPreview.blob,
        mimeType: pendingPreview.mimeType,
      }
    }
    throw new Error('Geen audio beschikbaar om een transcript te maken.')
  }

  async function retryTranscription() {
    if (session?.transcriptionStatus === 'transcribing' || session?.transcriptionStatus === 'generating') return
    setForcedTranscriptionStatus('transcribing')
    if (!(await ensureSufficientTranscriptionMinutes())) {
      setForcedTranscriptionStatus(null)
      return
    }

    const runId = beginGenerationRun()
    const transcriptionAbortController = new AbortController()
    setTranscriptionAbortController(sessionId, runId, transcriptionAbortController)

    try {
      updateSession(sessionId, { transcriptionStatus: 'transcribing', transcriptionError: null, summary: null, summaryStructured: null })
      console.log('[transcription][retry] audio-download-start', { sessionId, audioId: session?.audioBlobId ?? null })
      const decrypted = await loadAudioForTranscription()
      if (!isGenerationRunActive(runId)) return
      console.log('[transcription][retry] audio-download-done', {
        sessionId,
        mimeType: decrypted.mimeType,
        audioBytes: decrypted.audioBlob.size,
      })

      console.log('[transcription][retry] transcribe-start', { sessionId })
      const { transcript, summary } = await transcribeAudio({
        audioBlob: decrypted.audioBlob,
        mimeType: decrypted.mimeType,
        languageCode: 'nl',
        signal: transcriptionAbortController.signal,
        progress: {
          onOperationPrepared: (operationId) => {
            if (!isGenerationRunActive(runId)) return
            setTranscriptionOperationId(sessionId, runId, operationId)
          },
        },
      })
      if (!isGenerationRunActive(runId)) return
      setTranscriptionAbortController(sessionId, runId, null)
      console.log('[transcription][retry] transcript-received', {
        sessionId,
        transcriptLength: transcript.length,
        hasSummary: Boolean(String(summary || '').trim()),
      })
      const cleanedSummary = String(summary || '').trim()
      const structuredFromTranscriber = cleanedSummary ? mapReportMarkdownToStructuredSummary(cleanedSummary) : null
      if (structuredFromTranscriber && hasStructuredSummaryContent(structuredFromTranscriber)) {
        console.log('[STRUCTURED_SUMMARY_GENERATED]', {
          sessionId,
          summaryStructured: structuredFromTranscriber,
        })
        updateSession(sessionId, {
          transcript,
          summary: null,
          summaryStructured: structuredFromTranscriber,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
        await markPendingPreviewTranscriptionSucceeded(sessionId)
        await clearPendingPreviewAudioIfEligible(sessionId)
        clearGenerationTracking()
      } else {
        await generateSummaryFromTranscript(transcript, runId)
      }
    } catch (error) {
      if (!isGenerationRunActive(runId)) return
      if (isTranscriptionCancelledError(error)) {
        return
      }
      if (isInsufficientMinutesError(error)) {
        const requiredSeconds = Math.max(1, Math.ceil(currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? 1))
        const rawMessage = String(error instanceof Error ? error.message : error || '')
        const remainingSeconds = parseRemainingSecondsFromErrorMessage(rawMessage) ?? 0
        setRequiredTranscriptionSeconds(requiredSeconds)
        setRemainingTranscriptionSeconds(remainingSeconds)
        setIsNoMinutesModalVisible(true)
        restoreSessionAfterGenerationFailure()
        clearGenerationTracking()
        return
      }
      console.error('[SessieDetailScreen] Transcription retry failed:', error)
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: normalizeTranscriptionError(error),
      })
      clearGenerationTracking()
    }
  }

  async function cancelCurrentGeneration() {
    const cancelledRun = cancelTranscriptionRun(sessionId)
    generationRunIdRef.current += 1
    const operationId = cancelledRun.operationId
    if (operationId) {
      try {
        await cancelTranscriptionOperation({ operationId })
      } catch (error) {
        console.warn('[SessieDetailScreen] Failed to cancel transcription operation', { sessionId, operationId, error })
      }
    }

    const previousSnapshot = generationSnapshotRef.current
    if (previousSnapshot) {
      updateSession(sessionId, {
        transcript: previousSnapshot.transcript,
        summary: previousSnapshot.summary,
        summaryStructured: previousSnapshot.summaryStructured,
        transcriptionStatus: previousSnapshot.transcriptionStatus === 'error' ? 'idle' : previousSnapshot.transcriptionStatus,
        transcriptionError: null,
      })
    } else {
      updateSession(sessionId, {
        transcriptionStatus: hasTranscript ? 'done' : 'idle',
        transcriptionError: null,
      })
    }

    clearGenerationTracking()
  }

  async function handleCancelGeneration() {
    if (pendingPreviewShouldSaveAudio === false) {
      setIsCancelTranscriptionModalVisible(true)
      return
    }
    await cancelCurrentGeneration()
  }

  async function handleConfirmCancelTranscription() {
    setIsCancelTranscriptionModalVisible(false)
    const cancelledRun = cancelTranscriptionRun(sessionId)
    generationRunIdRef.current += 1
    const operationId = cancelledRun.operationId
    if (operationId) {
      try {
        await cancelTranscriptionOperation({ operationId })
      } catch (error) {
        console.warn('[SessieDetailScreen] Failed to cancel transcription operation', { sessionId, operationId, error })
      }
    }
    await clearPendingPreviewAudio(sessionId)
    clearQuickQuestionsChatForSession(sessionId)
    deleteSession(sessionId)
    onBack()
  }

  function normalizeAudioExtensionFromMimeType(mimeType: string): string {
    const normalized = String(mimeType || '').toLowerCase()
    if (normalized.includes('wav')) return 'wav'
    if (normalized.includes('ogg') || normalized.includes('opus')) return 'ogg'
    if (normalized.includes('webm')) return 'webm'
    if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3'
    if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a'
    return 'mp3'
  }

  function buildSavedAudioDownloadFileName(mimeType: string): string {
    const extension = normalizeAudioExtensionFromMimeType(mimeType)
    const safeTitle = String(editableSessionTitle || '')
      .trim()
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '')
    return `${safeTitle || 'sessie-audio'}.${extension}`
  }

  async function handleDownloadSavedAudio() {
    if (isDownloadingAudio) return
    setIsDownloadingAudio(true)
    try {
      const audioId = String(session?.audioBlobId || '').trim()
      let downloadableAudio: { audioBlob: Blob; mimeType: string } | null = null
      if (audioId) {
        try {
          downloadableAudio = await loadDecryptedSessionAudio(audioId)
        } catch (downloadError) {
          console.warn('[SessieDetailScreen] Saved audio download failed, trying pending preview fallback', { sessionId, error: downloadError })
        }
      }
      if (!downloadableAudio) {
        const pendingPreview = await getPendingPreviewAudioForTranscription(sessionId)
        if (pendingPreview) {
          downloadableAudio = { audioBlob: pendingPreview.blob, mimeType: pendingPreview.mimeType }
        }
      }
      if (!downloadableAudio) return
      if (typeof window === 'undefined') return
      const objectUrl = URL.createObjectURL(downloadableAudio.audioBlob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = buildSavedAudioDownloadFileName(downloadableAudio.mimeType)
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to download saved audio', { sessionId, error })
    } finally {
      setIsDownloadingAudio(false)
    }
  }

  async function handleDeleteSavedAudio() {
    const audioId = String(session?.audioBlobId || '').trim()
    if (!audioId) return
    if (isDeletingAudio) return
    if (effectiveTranscriptionStatus === 'transcribing' || effectiveTranscriptionStatus === 'generating') return
    setIsDeletingAudio(true)
    try {
      updateSession(sessionId, {
        audioBlobId: null,
        audioDurationSeconds: null,
      })
      await clearPendingPreviewAudio(sessionId)
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to remove saved audio', { sessionId, error })
    } finally {
      setIsDeletingAudio(false)
    }
  }

  return {
    generateSummaryFromTranscript,
    handleCancelGeneration,
    handleConfirmCancelTranscription,
    handleDeleteSavedAudio,
    handleDownloadSavedAudio,
    retryTranscription,
  }
}


