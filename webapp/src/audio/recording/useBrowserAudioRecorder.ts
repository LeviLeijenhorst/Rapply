import { useEffect, useMemo, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
type RecorderCaptureMode = 'microphone' | 'display-with-audio-fallback'
const recordingChunkDurationMilliseconds = 250
type ChunkHandler = (chunk: { blob: Blob; durationSeconds: number }) => void

function formatUnknownError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const normalizedName = error instanceof Error ? String(error.name || '').trim() : ''
  const normalizedMessage = message.trim().toLowerCase()
  if (
    normalizedName === 'NotAllowedError' ||
    normalizedName === 'PermissionDeniedError' ||
    normalizedMessage.includes('permission denied by user') ||
    normalizedMessage.includes('permission dismissed') ||
    normalizedMessage.includes('requested device not found') ||
    normalizedMessage.includes('notallowederror')
  ) {
    return 'Toestemming voor scherm- of audio-opname is geweigerd.'
  }
  if (normalizedName === 'AbortError' || normalizedMessage.includes('the request is not allowed')) {
    return 'Het starten van de opname is geannuleerd.'
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function isSafariBrowser() {
  if (typeof navigator === 'undefined') return false
  const agent = String(navigator.userAgent || '').toLowerCase()
  return agent.includes('safari') && !agent.includes('chrome') && !agent.includes('chromium') && !agent.includes('android')
}

function chooseMimeType(captureMode: RecorderCaptureMode) {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }
  if (isSafariBrowser() && captureMode === 'microphone') {
    return ''
  }
  const canPlayMimeType = (mimeType: string) => {
    if (typeof document === 'undefined') return true
    const audio = document.createElement('audio')
    const result = audio.canPlayType(mimeType)
    return result === 'probably' || result === 'maybe'
  }

  const candidates = captureMode === 'display-with-audio-fallback'
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4']

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate) && canPlayMimeType(candidate)) return candidate
  }
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return ''
}

function chooseFallbackRecordedMimeType() {
  if (isSafariBrowser()) return 'audio/mp4'
  return 'audio/webm'
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
  const [liveChunkLevel, setLiveChunkLevel] = useState(0)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const auxiliaryStreamsRef = useRef<MediaStream[]>([])
  const mixingAudioContextRef = useRef<AudioContext | null>(null)
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
  const recordingSequenceRef = useRef(0)
  const activeRecordingIdRef = useRef(0)
  const recordingStartedAtMillisecondsRef = useRef<number | null>(null)
  const requestDataTimerRef = useRef<number | null>(null)
  const activeCaptureModeRef = useRef<RecorderCaptureMode>('microphone')

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    return typeof MediaRecorder !== 'undefined' && hasMediaDevices
  }, [])

  const isDisplayCaptureSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function'
  }, [])

  useEffect(() => {
    onChunkRef.current = params?.onChunk ?? null
  }, [params?.onChunk])

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function stopRequestDataTimer() {
    if (requestDataTimerRef.current) {
      window.clearInterval(requestDataTimerRef.current)
      requestDataTimerRef.current = null
    }
  }

  function startRequestDataTimer() {
    stopRequestDataTimer()
    requestDataTimerRef.current = window.setInterval(() => {
      const recorder = mediaRecorderRef.current
      if (!recorder) return
      if (recorder.state !== 'recording') return
      try {
        recorder.requestData()
      } catch {}
    }, 1000)
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

  function cleanupAuxiliaryCaptureResources() {
    for (const stream of auxiliaryStreamsRef.current) {
      stopStreamTracks(stream)
    }
    auxiliaryStreamsRef.current = []
    const context = mixingAudioContextRef.current
    mixingAudioContextRef.current = null
    if (context) {
      context.close().catch(() => undefined)
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
    cleanupAuxiliaryCaptureResources()
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
    const totalChunkBytes = recordedChunksRef.current.reduce((sum, chunk) => sum + Number(chunk?.size || 0), 0)
    console.log('[useBrowserAudioRecorder] buildRecordedBlob', {
      recordingId: activeRecordingIdRef.current,
      chunkCount: recordedChunksRef.current.length,
      totalChunkBytes,
      elapsedSeconds,
      chosenMimeType: chooseMimeType(activeCaptureModeRef.current),
      lastMimeType: lastMimeTypeRef.current || '(empty)',
    })
    const firstChunkMimeType = recordedChunksRef.current.find((chunk) => typeof chunk.type === 'string' && chunk.type.trim().length > 0)?.type || ''
    const preferredMimeType = lastMimeTypeRef.current || firstChunkMimeType || chooseMimeType(activeCaptureModeRef.current) || ''
    const mimeType = preferredMimeType || chooseFallbackRecordedMimeType()
    const blob = new Blob(recordedChunksRef.current, { type: mimeType })
    if (blob.size <= 0) {
      console.error('[useBrowserAudioRecorder] empty blob after stop', {
        recordingId: activeRecordingIdRef.current,
        stopReason: stopReasonRef.current,
        chunkCount: recordedChunksRef.current.length,
        totalChunkBytes,
        elapsedSeconds,
      })
      setStatus('error')
      setErrorMessage('De opname kon niet worden opgeslagen. Probeer opnieuw.')
      return
    }
    setRecordedBlob(blob)
    setRecordedMimeType(mimeType)
    setRecordedChunks([...recordedChunksRef.current])
    setRecordedChunkDurationsSeconds([...recordedChunkDurationsSecondsRef.current])
    setStatus('ready')
  }

  async function beginRecording(shouldReset: boolean, captureMode: RecorderCaptureMode = 'microphone') {
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
      activeCaptureModeRef.current = captureMode
      recordingSequenceRef.current += 1
      activeRecordingIdRef.current = recordingSequenceRef.current
      const stream = await (async () => {
        if (captureMode === 'microphone') {
          return navigator.mediaDevices.getUserMedia({ audio: true })
        }
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Schermopname wordt niet ondersteund in deze browser.')
        }

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })
        let micStream: MediaStream | null = null
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
        } catch (error) {
          console.warn('[useBrowserAudioRecorder] Microphone fallback unavailable', error)
        }

        const displayAudioTracks = displayStream.getAudioTracks()
        const micAudioTracks = micStream?.getAudioTracks() ?? []
        if (displayAudioTracks.length === 0 && micAudioTracks.length === 0) {
          return displayStream
        }

        const AudioContextConstructor = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AudioContextConstructor) {
          if (displayAudioTracks.length > 0) return displayStream
          if (micStream) {
            for (const track of micAudioTracks) displayStream.addTrack(track)
          }
          return displayStream
        }

        const audioContext: AudioContext = new AudioContextConstructor()
        const destination = audioContext.createMediaStreamDestination()
        const connectTrackGroup = (tracks: MediaStreamTrack[]) => {
          if (tracks.length === 0) return
          const sourceStream = new MediaStream(tracks)
          const sourceNode = audioContext.createMediaStreamSource(sourceStream)
          sourceNode.connect(destination)
        }
        connectTrackGroup(displayAudioTracks)
        connectTrackGroup(micAudioTracks)
        audioContext.resume().catch(() => undefined)

        const mixedStream = new MediaStream()
        for (const videoTrack of displayStream.getVideoTracks()) {
          mixedStream.addTrack(videoTrack)
        }
        const mixedAudioTrack = destination.stream.getAudioTracks()[0]
        if (mixedAudioTrack) {
          mixedStream.addTrack(mixedAudioTrack)
        } else if (displayAudioTracks[0]) {
          mixedStream.addTrack(displayAudioTracks[0])
        } else if (micAudioTracks[0]) {
          mixedStream.addTrack(micAudioTracks[0])
        }

        auxiliaryStreamsRef.current = micStream ? [displayStream, micStream] : [displayStream]
        mixingAudioContextRef.current = audioContext
        return mixedStream
      })()
      mediaStreamRef.current = stream
      setMediaStream(stream)

      const chosenMimeType = chooseMimeType(captureMode)
      const recorder = chosenMimeType ? new MediaRecorder(stream, { mimeType: chosenMimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      lastMimeTypeRef.current = recorder.mimeType || chosenMimeType || ''
      console.log('[useBrowserAudioRecorder] MediaRecorder init', {
        requestedMimeType: chosenMimeType || '(default)',
        actualMimeType: recorder.mimeType || '(empty)',
      })

      recorder.ondataavailable = (event) => {
        const startedAtMilliseconds = recordingStartedAtMillisecondsRef.current
        const sinceStartMilliseconds = startedAtMilliseconds ? Math.round(performance.now() - startedAtMilliseconds) : null
        console.log('[useBrowserAudioRecorder] ondataavailable', {
          recordingId: activeRecordingIdRef.current,
          chunkBytes: Number(event.data?.size || 0),
          chunkType: event.data?.type || '(empty)',
          recorderState: recorder.state,
          sinceStartMilliseconds,
          stopReason: stopReasonRef.current,
        })
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
        const bytesPerSecond = Number(event.data.size || 0) / resolvedDurationSeconds
        const normalizedLevel = Math.min(1, Math.max(0, bytesPerSecond / 20_000))
        setLiveChunkLevel((previous) => previous * 0.6 + normalizedLevel * 0.4)
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
        stopRequestDataTimer()
        stopTracks()
      }

      recorder.onstart = () => {
        recordingStartedAtMillisecondsRef.current = performance.now()
        console.log('[useBrowserAudioRecorder] onstart', {
          recordingId: activeRecordingIdRef.current,
          mimeType: recorder.mimeType || chosenMimeType || '(empty)',
        })
        startTimeMillisecondsRef.current = performance.now()
        lastChunkTimestampMillisecondsRef.current = performance.now()
        lastChunkDurationSecondsRef.current = recordingChunkDurationMilliseconds / 1000
        setActiveMimeType(lastMimeTypeRef.current || chosenMimeType || null)
        startTimer()
        startRequestDataTimer()
        setStatus('recording')
      }

      recorder.onstop = () => {
        const startedAtMilliseconds = recordingStartedAtMillisecondsRef.current
        const stopElapsedMilliseconds = startedAtMilliseconds ? Math.round(performance.now() - startedAtMilliseconds) : null
        console.log('[useBrowserAudioRecorder] onstop', {
          recordingId: activeRecordingIdRef.current,
          stopReason: stopReasonRef.current,
          chunkCountBeforeFinalize: recordedChunksRef.current.length,
          chunkBytesBeforeFinalize: recordedChunksRef.current.reduce((sum, chunk) => sum + Number(chunk?.size || 0), 0),
          stopElapsedMilliseconds,
        })
        const stopReason = stopReasonRef.current
        stopReasonRef.current = 'none'
        recordingStartedAtMillisecondsRef.current = null
        setLiveChunkLevel(0)
        stopTimer()
        stopRequestDataTimer()
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
    await beginRecording(true, 'microphone')
  }

  async function startWithCaptureMode(captureMode: RecorderCaptureMode = 'microphone') {
    await beginRecording(true, captureMode)
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
    await beginRecording(false, activeCaptureModeRef.current)
  }

  function stop() {
    const recorder = mediaRecorderRef.current
    console.log('[useBrowserAudioRecorder] stop requested', {
      recordingId: activeRecordingIdRef.current,
      status,
      recorderState: recorder?.state || '(none)',
      currentChunkCount: recordedChunksRef.current.length,
      currentChunkBytes: recordedChunksRef.current.reduce((sum, chunk) => sum + Number(chunk?.size || 0), 0),
    })
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
    stopRequestDataTimer()
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
    recordingStartedAtMillisecondsRef.current = null
    stopReasonRef.current = 'none'
    lastMimeTypeRef.current = ''
    activeCaptureModeRef.current = 'microphone'
    setElapsedSeconds(0)
    setRecordedBlob(null)
    setRecordedMimeType(null)
    setLiveChunkLevel(0)
    setErrorMessage(null)
    setStatus('idle')
  }

  useEffect(() => {
    return () => {
      stopTimer()
      stopRequestDataTimer()
      stopTracks()
    }
  }, [])

  useEffect(() => {
    if (status === 'recording' || status === 'paused' || status === 'requesting' || status === 'stopping') return
    stopTracks()
  }, [status])

  return {
    isSupported,
    isDisplayCaptureSupported,
    status,
    errorMessage,
    elapsedSeconds,
    recordedBlob,
    recordedMimeType,
    activeMimeType,
    recordedChunks,
    recordedChunkDurationsSeconds,
    mediaStream,
    liveChunkLevel,
    start,
    startWithCaptureMode,
    stop,
    pause,
    resume,
    reset,
  }
}
