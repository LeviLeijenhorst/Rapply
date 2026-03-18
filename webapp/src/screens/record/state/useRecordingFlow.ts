import { useCallback, useEffect, type MutableRefObject } from 'react'

import {
  startRealtimeTranscription,
  type RealtimeTranscriberInput,
} from '../../../api/transcription/realtime/transcribeAudioRealtime'
import type { NewInputStep } from '../types'
import {
  createOperationId,
  maxDuration,
  maxRecordingSeconds,
  readAudioDurationSeconds,
} from '../utils'

type RecorderState = {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
  elapsedSeconds: number
  recordedBlob: Blob | null
  recordedMimeType: string | null
  recordedChunkDurationsSeconds: number[]
  mediaStream: MediaStream | null
  start: () => void
  startWithCaptureMode?: (captureMode: 'microphone' | 'display-with-audio-fallback') => void
  stop: () => void
  reset: () => void
}

type Params = {
  hasAutoStartedRecordingRef: MutableRefObject<boolean>
  hasAutoSubmittedRecordingRef: MutableRefObject<boolean>
  isRealtimeModeActive: boolean
  isRealtimeTranscriberStarting: boolean
  liveTranscriberRef: MutableRefObject<RealtimeTranscriberInput | null>
  realtimeOperationIdRef: MutableRefObject<string | null>
  recorder: RecorderState
  setAudioDurationSeconds: (value: number | null | ((previous: number | null) => number | null)) => void
  setAudioForTranscription: (value: { blob: Blob; mimeType: string } | null) => void
  setAudioPreviewUrl: (value: string | null) => void
  setIsRealtimeTranscriberStarting: (value: boolean) => void
  setLiveTranscriptError: (value: string | null) => void
  setLiveTranscriptText: (value: string | ((previous: string) => string)) => void
  setStep: (step: NewInputStep) => void
  onRecordingReady?: (payload: { blob: Blob; mimeType: string; durationSeconds: number }) => void
  includeSpeakerLabelsInRealtimeTranscript?: boolean
  useDisplayCapture?: boolean
  disableAutoStart?: boolean
  step: NewInputStep
  visible: boolean
}

export function useRecordingFlow({
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
  onRecordingReady,
  includeSpeakerLabelsInRealtimeTranscript = true,
  useDisplayCapture = false,
  disableAutoStart = false,
  step,
  visible,
}: Params) {
  const isRecordingLikeStep = step === 'recording' || step === 'recording_finishing' || step === 'recording_canceling'
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
    if (!isRecordingLikeStep) {
      hasAutoStartedRecordingRef.current = false
      hasAutoSubmittedRecordingRef.current = false
    }
  }, [hasAutoStartedRecordingRef, hasAutoSubmittedRecordingRef, isRecordingLikeStep])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (disableAutoStart) return
    if (hasAutoStartedRecordingRef.current) return
    if (recorder.status !== 'idle') return
    if (isRealtimeModeActive) {
      realtimeOperationIdRef.current = createOperationId()
      setLiveTranscriptText('')
      setLiveTranscriptError(null)
    }
    hasAutoStartedRecordingRef.current = true
    if (useDisplayCapture && recorder.startWithCaptureMode) {
      recorder.startWithCaptureMode('display-with-audio-fallback')
      return
    }
    recorder.start()
  }, [
    disableAutoStart,
    hasAutoStartedRecordingRef,
    isRealtimeModeActive,
    realtimeOperationIdRef,
    recorder,
    setLiveTranscriptError,
    setLiveTranscriptText,
    step,
    useDisplayCapture,
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
    const shouldKeepRealtimeAlive =
      visible &&
      isRecordingLikeStep &&
      (recorder.status === 'recording' ||
        recorder.status === 'paused' ||
        recorder.status === 'stopping' ||
        recorder.status === 'requesting') &&
      isRealtimeModeActive

    if (!shouldKeepRealtimeAlive) {
      void stopLiveTranscriber()
      return
    }
    if (recorder.status !== 'recording') return
    if (liveTranscriberRef.current || isRealtimeTranscriberStarting) return

    let cancelled = false
    setIsRealtimeTranscriberStarting(true)
    setLiveTranscriptError(null)

    void startRealtimeTranscription({
      languageCode: 'nl',
      mediaStream: recorder.mediaStream,
      onFinalSegment: (segment) => {
        if (cancelled) return
        const line = (includeSpeakerLabelsInRealtimeTranscript ? `${segment.speaker}: ${segment.text}` : segment.text).trim()
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
    isRecordingLikeStep,
    liveTranscriberRef,
    recorder.status,
    recorder.mediaStream,
    setIsRealtimeTranscriberStarting,
    setLiveTranscriptError,
    setLiveTranscriptText,
    includeSpeakerLabelsInRealtimeTranscript,
    step,
    stopLiveTranscriber,
    visible,
  ])

  useEffect(() => {
    if (!isRecordingLikeStep) return
    if (recorder.status !== 'ready') return
    if (!recorder.recordedBlob || !recorder.recordedMimeType) return
    if (hasAutoSubmittedRecordingRef.current) return
    hasAutoSubmittedRecordingRef.current = true

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
    if (onRecordingReady) {
      onRecordingReady({
        blob,
        mimeType,
        durationSeconds: fallbackDurationSeconds,
      })
      return
    }
    setStep('recorded')
  }, [
    hasAutoSubmittedRecordingRef,
    isRecordingLikeStep,
    onRecordingReady,
    recorder,
    setAudioDurationSeconds,
    setAudioForTranscription,
    setAudioPreviewUrl,
    setStep,
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
    if (useDisplayCapture && recorder.startWithCaptureMode) {
      recorder.startWithCaptureMode('display-with-audio-fallback')
      return
    }
    recorder.start()
  }, [
    hasAutoStartedRecordingRef,
    hasAutoSubmittedRecordingRef,
    isRealtimeModeActive,
    realtimeOperationIdRef,
    recorder,
    setLiveTranscriptError,
    setLiveTranscriptText,
    useDisplayCapture,
  ])

  return {
    retryRecordingAfterError,
    stopLiveTranscriber,
  }
}







