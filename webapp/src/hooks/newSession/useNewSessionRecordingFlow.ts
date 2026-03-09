import { useCallback, useEffect, type MutableRefObject } from 'react'

import {
  startRealtimeTranscription,
  type RealtimeTranscriberSession,
} from '../../ai/transcription/realtime/startRealtimeTranscription'
import type { NewSessionStep } from '../../screens/record/newInputModalTypes'
import {
  createOperationId,
  maxDuration,
  maxRecordingSeconds,
  readAudioDurationSeconds,
} from '../../screens/record/newInputModalUtils'

type RecorderState = {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
  elapsedSeconds: number
  recordedBlob: Blob | null
  recordedMimeType: string | null
  recordedChunkDurationsSeconds: number[]
  start: () => void
  stop: () => void
  reset: () => void
}

type Params = {
  hasAutoStartedRecordingRef: MutableRefObject<boolean>
  hasAutoSubmittedRecordingRef: MutableRefObject<boolean>
  isRealtimeModeActive: boolean
  isRealtimeTranscriberStarting: boolean
  liveTranscriberRef: MutableRefObject<RealtimeTranscriberSession | null>
  realtimeOperationIdRef: MutableRefObject<string | null>
  recorder: RecorderState
  setAudioDurationSeconds: (value: number | null | ((previous: number | null) => number | null)) => void
  setAudioForTranscription: (value: { blob: Blob; mimeType: string } | null) => void
  setAudioPreviewUrl: (value: string | null) => void
  setIsRealtimeTranscriberStarting: (value: boolean) => void
  setLiveTranscriptError: (value: string | null) => void
  setLiveTranscriptText: (value: string | ((previous: string) => string)) => void
  setStep: (step: NewSessionStep) => void
  step: NewSessionStep
  visible: boolean
}

export function useNewSessionRecordingFlow({
  hasAutoStartedRecordingRef,
  hasAutoSubmittedRecordingRef,
  isRealtimeModeActive,
  isRealtimeTranscriberStarting,
  liveTranscriberRef,
  realtimeOperationIdRef,
  recorder,
  setAudioDurationSeconds,
  setAudioForTranscription,
  setAudioPreviewUrl,
  setIsRealtimeTranscriberStarting,
  setLiveTranscriptError,
  setLiveTranscriptText,
  setStep,
  step,
  visible,
}: Params) {
  const stopLiveTranscriber = useCallback(async () => {
    const activeTranscriber = liveTranscriberRef.current
    if (!activeTranscriber) return
    liveTranscriberRef.current = null
    setIsRealtimeTranscriberStarting(false)
    await activeTranscriber.stop().catch(() => undefined)
  }, [liveTranscriberRef, setIsRealtimeTranscriberStarting])

  useEffect(() => {
    return () => {
      void stopLiveTranscriber()
    }
  }, [stopLiveTranscriber])

  useEffect(() => {
    if (step !== 'recording') {
      hasAutoStartedRecordingRef.current = false
      hasAutoSubmittedRecordingRef.current = false
    }
  }, [hasAutoStartedRecordingRef, hasAutoSubmittedRecordingRef, step])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (hasAutoStartedRecordingRef.current) return
    if (recorder.status !== 'idle') return
    if (isRealtimeModeActive) {
      realtimeOperationIdRef.current = createOperationId()
      setLiveTranscriptText('')
      setLiveTranscriptError(null)
    }
    hasAutoStartedRecordingRef.current = true
    recorder.start()
  }, [
    hasAutoStartedRecordingRef,
    isRealtimeModeActive,
    realtimeOperationIdRef,
    recorder,
    setLiveTranscriptError,
    setLiveTranscriptText,
    step,
    visible,
  ])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (recorder.status !== 'recording' && recorder.status !== 'paused') return
    if (recorder.elapsedSeconds < maxRecordingSeconds) return
    recorder.stop()
  }, [recorder, step, visible])

  useEffect(() => {
    const shouldRunRealtime =
      visible &&
      step === 'recording' &&
      recorder.status === 'recording' &&
      isRealtimeModeActive

    if (!shouldRunRealtime) {
      void stopLiveTranscriber()
      return
    }
    if (liveTranscriberRef.current || isRealtimeTranscriberStarting) return

    let cancelled = false
    setIsRealtimeTranscriberStarting(true)
    setLiveTranscriptError(null)

    void startRealtimeTranscription({
      languageCode: 'nl',
      onFinalSegment: (segment) => {
        if (cancelled) return
        const line = `${segment.speaker}: ${segment.text}`.trim()
        if (!line) return
        setLiveTranscriptText((previous) => (previous ? `${previous}\n${line}` : line))
      },
      onError: (message) => {
        if (cancelled) return
        setLiveTranscriptError(message)
      },
    })
      .then((session) => {
        if (cancelled) {
          void session.stop()
          return
        }
        liveTranscriberRef.current = session
      })
      .catch((error) => {
        if (cancelled) return
        setLiveTranscriptError(error instanceof Error ? error.message : String(error || 'Realtime transcriptie is mislukt.'))
      })
      .finally(() => {
        if (!cancelled) {
          setIsRealtimeTranscriberStarting(false)
        }
      })

    return () => {
      cancelled = true
      void stopLiveTranscriber()
    }
  }, [
    isRealtimeModeActive,
    isRealtimeTranscriberStarting,
    liveTranscriberRef,
    recorder.status,
    setIsRealtimeTranscriberStarting,
    setLiveTranscriptError,
    setLiveTranscriptText,
    step,
    stopLiveTranscriber,
    visible,
  ])

  useEffect(() => {
    if (step !== 'recording') return
    if (recorder.status !== 'ready') return
    if (!recorder.recordedBlob || !recorder.recordedMimeType) return

    const blob = recorder.recordedBlob as Blob
    const mimeType = recorder.recordedMimeType as string
    const chunkDurationSeconds = recorder.recordedChunkDurationsSeconds.reduce(
      (sum, value) => sum + (Number.isFinite(value) ? Math.max(0, Number(value)) : 0),
      0,
    )
    const fallbackDurationSeconds = maxDuration([chunkDurationSeconds, recorder.elapsedSeconds])
    setAudioForTranscription({ blob, mimeType })
    setAudioDurationSeconds(fallbackDurationSeconds)
    setAudioPreviewUrl(URL.createObjectURL(blob))
    void readAudioDurationSeconds(blob)
      .then((detectedDurationSeconds) => {
        if (!Number.isFinite(detectedDurationSeconds) || detectedDurationSeconds === null || detectedDurationSeconds <= 0) return
        setAudioDurationSeconds((previousDurationSeconds) => maxDuration([previousDurationSeconds, detectedDurationSeconds]))
      })
      .catch(() => undefined)
    hasAutoSubmittedRecordingRef.current = false
    setStep('recorded')
  }, [
    hasAutoSubmittedRecordingRef,
    recorder,
    setAudioDurationSeconds,
    setAudioForTranscription,
    setAudioPreviewUrl,
    setStep,
    step,
  ])

  const retryRecordingAfterError = useCallback(() => {
    recorder.reset()
    if (isRealtimeModeActive) {
      realtimeOperationIdRef.current = createOperationId()
      setLiveTranscriptText('')
      setLiveTranscriptError(null)
    }
    hasAutoStartedRecordingRef.current = true
    hasAutoSubmittedRecordingRef.current = false
    recorder.start()
  }, [
    hasAutoStartedRecordingRef,
    hasAutoSubmittedRecordingRef,
    isRealtimeModeActive,
    realtimeOperationIdRef,
    recorder,
    setLiveTranscriptError,
    setLiveTranscriptText,
  ])

  return {
    retryRecordingAfterError,
    stopLiveTranscriber,
  }
}





