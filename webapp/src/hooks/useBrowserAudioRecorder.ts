import { useEffect, useMemo, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
const recordingChunkDurationMilliseconds = 250
type ChunkHandler = (chunk: { blob: Blob; durationSeconds: number }) => void

function formatUnknownError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function readTotalChunkBytes(chunks: Blob[]): number {
  let totalBytes = 0
  for (const chunk of chunks) {
    totalBytes += Number(chunk?.size || 0)
  }
  return totalBytes
}

function chooseMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }
  const canPlayMimeType = (mimeType: string) => {
    if (typeof document === 'undefined') return true
    const audio = document.createElement('audio')
    const result = audio.canPlayType(mimeType)
    return result === 'probably' || result === 'maybe'
  }

  const candidates = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate) && canPlayMimeType(candidate)) return candidate
  }
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return ''
}

export function useBrowserAudioRecorder(params?: { onChunk?: (chunk: { blob: Blob; durationSeconds: number }) => void }) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedMimeType, setRecordedMimeType] = useState<string | null>(null)
  const [activeMimeType, setActiveMimeType] = useState<string | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordedChunkDurationsSeconds, setRecordedChunkDurationsSeconds] = useState<number[]>([])
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordedChunkDurationsSecondsRef = useRef<number[]>([])
  const timerRef = useRef<number | null>(null)
  const startTimeMillisecondsRef = useRef<number | null>(null)
  const elapsedBeforePauseMillisecondsRef = useRef<number>(0)
  const lastChunkTimestampMillisecondsRef = useRef<number | null>(null)
  const lastChunkDurationSecondsRef = useRef<number>(recordingChunkDurationMilliseconds / 1000)
  const lastMimeTypeRef = useRef<string>('')
  const stopReasonRef = useRef<'none' | 'pause' | 'stop'>('none')
  const ignoreNextStopRef = useRef(false)
  const onChunkRef = useRef<ChunkHandler | null>(null)

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    return typeof MediaRecorder !== 'undefined' && hasMediaDevices
  }, [])

  const chosenMimeType = useMemo(() => chooseMimeType(), [])

  useEffect(() => {
    onChunkRef.current = params?.onChunk ?? null
  }, [params?.onChunk])

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function startTimer() {
    stopTimer()
    timerRef.current = window.setInterval(() => {
      const startTimeMilliseconds = startTimeMillisecondsRef.current
      if (!startTimeMilliseconds) return
      const elapsedMilliseconds = elapsedBeforePauseMillisecondsRef.current + (performance.now() - startTimeMilliseconds)
      setElapsedSeconds(Math.floor(elapsedMilliseconds / 1000))
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
    setActiveMimeType(null)
    setRecordedChunks([])
    setRecordedChunkDurationsSeconds([])
    setElapsedSeconds(0)
    elapsedBeforePauseMillisecondsRef.current = 0
    startTimeMillisecondsRef.current = null
    lastChunkTimestampMillisecondsRef.current = null
    recordedChunksRef.current = []
    recordedChunkDurationsSecondsRef.current = []
    lastMimeTypeRef.current = ''
  }

  function clearRecordedOutput() {
    setErrorMessage(null)
    setRecordedBlob(null)
    setRecordedMimeType(null)
    setActiveMimeType(null)
    setRecordedChunks([])
    setRecordedChunkDurationsSeconds([])
  }

  function buildRecordedBlob() {
    const totalChunkBytes = readTotalChunkBytes(recordedChunksRef.current)
    if (totalChunkBytes <= 0) {
      setRecordedBlob(null)
      setRecordedMimeType(null)
      setRecordedChunks([])
      setRecordedChunkDurationsSeconds([])
      setStatus('error')
      setErrorMessage('Er is geen audio opgenomen. Neem opnieuw op en wacht minimaal 1 seconde voor je stopt.')
      return
    }
    const firstChunkMimeType = recordedChunksRef.current.find((chunk) => typeof chunk.type === 'string' && chunk.type.trim().length > 0)?.type || ''
    const mimeType = lastMimeTypeRef.current || firstChunkMimeType || chosenMimeType || 'audio/mp4'
    const blob = new Blob(recordedChunksRef.current, { type: mimeType })
    setRecordedBlob(blob)
    setRecordedMimeType(mimeType)
    setRecordedChunks([...recordedChunksRef.current])
    setRecordedChunkDurationsSeconds([...recordedChunkDurationsSecondsRef.current])
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
      lastMimeTypeRef.current = recorder.mimeType || chosenMimeType || ''
      console.log('[useBrowserAudioRecorder] MediaRecorder init', {
        requestedMimeType: chosenMimeType || '(default)',
        actualMimeType: recorder.mimeType || '(empty)',
      })

      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size <= 0) return
        if (event.data.type && event.data.type.trim().length > 0) {
          lastMimeTypeRef.current = event.data.type
          setActiveMimeType(event.data.type)
        }
        recordedChunksRef.current.push(event.data)
        const nowMilliseconds = performance.now()
        const lastTimestampMilliseconds = lastChunkTimestampMillisecondsRef.current ?? nowMilliseconds
        const elapsedSeconds = (nowMilliseconds - lastTimestampMilliseconds) / 1000
        const resolvedDurationSeconds = Math.max(0.1, elapsedSeconds)
        lastChunkTimestampMillisecondsRef.current = nowMilliseconds
        recordedChunkDurationsSecondsRef.current.push(resolvedDurationSeconds)
        if (onChunkRef.current) {
          Promise.resolve(onChunkRef.current({ blob: event.data, durationSeconds: resolvedDurationSeconds })).catch((error) => {
            console.error('[useBrowserAudioRecorder] Failed to handle chunk', error)
          })
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
        startTimeMillisecondsRef.current = performance.now()
        lastChunkTimestampMillisecondsRef.current = performance.now()
        lastChunkDurationSecondsRef.current = recordingChunkDurationMilliseconds / 1000
        setActiveMimeType(lastMimeTypeRef.current || chosenMimeType || null)
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

        // Allow any trailing dataavailable callback to flush before composing the final blob.
        window.setTimeout(() => {
          buildRecordedBlob()
        }, recordingChunkDurationMilliseconds)
      }

      // Avoid timeslice chunk fragmentation because some containers (notably mp4)
      // are not safely reconstructable via simple blob concatenation.
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
    const startTimeMilliseconds = startTimeMillisecondsRef.current
    if (startTimeMilliseconds) {
      elapsedBeforePauseMillisecondsRef.current = elapsedBeforePauseMillisecondsRef.current + (performance.now() - startTimeMilliseconds)
      startTimeMillisecondsRef.current = null
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
    try {
      recorder.requestData()
    } catch {}
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
    recordedChunksRef.current = []
    recordedChunkDurationsSecondsRef.current = []
    startTimeMillisecondsRef.current = null
    elapsedBeforePauseMillisecondsRef.current = 0
    lastChunkTimestampMillisecondsRef.current = null
    stopReasonRef.current = 'none'
    lastMimeTypeRef.current = ''
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
    activeMimeType,
    recordedChunks,
    recordedChunkDurationsSeconds,
    mediaStream,
    start,
    stop,
    pause,
    resume,
    reset,
  }
}
