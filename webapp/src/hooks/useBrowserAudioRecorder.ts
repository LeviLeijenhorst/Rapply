import { useEffect, useMemo, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'

function formatUnknownError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function chooseMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return ''
}

export function useBrowserAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedMimeType, setRecordedMimeType] = useState<string | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<number | null>(null)
  const startTimeMsRef = useRef<number | null>(null)
  const elapsedBeforePauseMsRef = useRef<number>(0)
  const lastMimeTypeRef = useRef<string>('audio/webm')
  const stopReasonRef = useRef<'none' | 'pause' | 'stop'>('none')
  const ignoreNextStopRef = useRef(false)

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    return typeof MediaRecorder !== 'undefined' && hasMediaDevices
  }, [])

  const chosenMimeType = useMemo(() => chooseMimeType(), [])

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function startTimer() {
    stopTimer()
    timerRef.current = window.setInterval(() => {
      const startTimeMs = startTimeMsRef.current
      if (!startTimeMs) return
      const elapsedMs = elapsedBeforePauseMsRef.current + (performance.now() - startTimeMs)
      setElapsedSeconds(Math.floor(elapsedMs / 1000))
    }, 250)
  }

  function stopStreamTracks(stream: MediaStream | null) {
    if (!stream) return
    const tracks = stream.getTracks()
    for (const track of tracks) {
      track.enabled = false
      track.stop()
    }
  }

  function stopTracks() {
    const stream = mediaStreamRef.current
    stopStreamTracks(stream)
    const recorderStream = mediaRecorderRef.current?.stream ?? null
    if (recorderStream && recorderStream !== stream) {
      stopStreamTracks(recorderStream)
    }
    mediaStreamRef.current = null
    setMediaStream(null)
  }

  function logCaptureDevices() {
    if (typeof navigator === 'undefined') return
    if (!navigator.mediaDevices?.enumerateDevices) return
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const captureDevices = devices.filter((device) => device.kind === 'audioinput')
        console.log('[useBrowserAudioRecorder] Audio input devices', captureDevices.map((device) => ({ deviceId: device.deviceId, label: device.label })))
      })
      .catch(() => undefined)
  }

  function resetRecordedState() {
    setErrorMessage(null)
    setRecordedBlob(null)
    setRecordedMimeType(null)
    setElapsedSeconds(0)
    elapsedBeforePauseMsRef.current = 0
    startTimeMsRef.current = null
    chunksRef.current = []
    lastMimeTypeRef.current = 'audio/webm'
  }

  function clearRecordedOutput() {
    setErrorMessage(null)
    setRecordedBlob(null)
    setRecordedMimeType(null)
  }

  function buildRecordedBlob() {
    const mimeType = lastMimeTypeRef.current || chosenMimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    setRecordedBlob(blob)
    setRecordedMimeType(mimeType)
    setStatus('ready')
  }

  async function beginRecording(shouldReset: boolean) {
    if (typeof window === 'undefined') return
    if (!isSupported) {
      setStatus('error')
      setErrorMessage('Audio recording is not supported in this browser.')
      return
    }
    if (!window.isSecureContext) {
      setStatus('error')
      setErrorMessage('Microphone access requires HTTPS (or localhost).')
      return
    }

    if (shouldReset) {
      resetRecordedState()
    } else {
      clearRecordedOutput()
    }

    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      setMediaStream(stream)

      const recorder = chosenMimeType ? new MediaRecorder(stream, { mimeType: chosenMimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      lastMimeTypeRef.current = recorder.mimeType || chosenMimeType || 'audio/webm'

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event) => {
        const anyEvent = event as any
        const message = anyEvent?.error ? formatUnknownError(anyEvent.error) : 'Recording error'
        console.error('[useBrowserAudioRecorder] MediaRecorder error', anyEvent?.error ?? event)
        setStatus('error')
        setErrorMessage(message)
        stopTimer()
        stopTracks()
      }

      recorder.onstart = () => {
        startTimeMsRef.current = performance.now()
        startTimer()
        setStatus('recording')
      }

      recorder.onstop = () => {
        console.log('[useBrowserAudioRecorder] Recorder stopped')
        const stopReason = stopReasonRef.current
        stopReasonRef.current = 'none'
        stopTimer()
        stopTracks()
        mediaRecorderRef.current = null
        logCaptureDevices()

        if (ignoreNextStopRef.current) {
          ignoreNextStopRef.current = false
          setStatus('idle')
          return
        }

        if (stopReason === 'pause') {
          setStatus('paused')
          return
        }

        buildRecordedBlob()
      }

      recorder.start()
    } catch (error) {
      console.error('[useBrowserAudioRecorder] Failed to start', error)
      setStatus('error')
      setErrorMessage(formatUnknownError(error))
      stopTimer()
      stopTracks()
    }
  }

  async function start() {
    await beginRecording(true)
  }

  function pause() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    if (recorder.state !== 'recording') return
    const startTimeMs = startTimeMsRef.current
    if (startTimeMs) {
      elapsedBeforePauseMsRef.current = elapsedBeforePauseMsRef.current + (performance.now() - startTimeMs)
      startTimeMsRef.current = null
    }
    stopTimer()
    setStatus('paused')
    stopReasonRef.current = 'pause'
    recorder.stop()
  }

  async function resume() {
    if (status !== 'paused') return
    await beginRecording(false)
  }

  function stop() {
    const recorder = mediaRecorderRef.current
    if (!recorder) {
      if (status !== 'paused') return
      setStatus('stopping')
      buildRecordedBlob()
      stopTracks()
      logCaptureDevices()
      return
    }
    if (recorder.state === 'inactive') {
      stopTracks()
      logCaptureDevices()
      return
    }
    setStatus('stopping')
    stopReasonRef.current = 'stop'
    recorder.stop()
  }

  function reset() {
    stopTimer()
    stopTracks()
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      ignoreNextStopRef.current = true
      try {
        recorder.stop()
      } catch {}
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    startTimeMsRef.current = null
    elapsedBeforePauseMsRef.current = 0
    stopReasonRef.current = 'none'
    lastMimeTypeRef.current = 'audio/webm'
    setElapsedSeconds(0)
    setRecordedBlob(null)
    setRecordedMimeType(null)
    setErrorMessage(null)
    setStatus('idle')
  }

  useEffect(() => {
    return () => {
      stopTimer()
      stopTracks()
    }
  }, [])

  useEffect(() => {
    if (status === 'recording' || status === 'paused' || status === 'requesting' || status === 'stopping') return
    stopTracks()
  }, [status])

  return {
    isSupported,
    status,
    errorMessage,
    elapsedSeconds,
    recordedBlob,
    recordedMimeType,
    mediaStream,
    start,
    stop,
    pause,
    resume,
    reset,
  }
}

