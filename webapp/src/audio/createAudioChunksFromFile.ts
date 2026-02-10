type AudioChunk = {
  blob: Blob
  durationSeconds: number
}

type Result = {
  chunks: AudioChunk[]
  mimeType: string
  totalDurationSeconds: number
}

function chooseRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return ''
}

export async function createAudioChunksFromFile(params: {
  file: File
  chunkDurationSeconds: number
}): Promise<Result> {
  const audioUrl = URL.createObjectURL(params.file)
  const audio = document.createElement('audio')
  audio.src = audioUrl
  audio.preload = 'auto'
  audio.muted = true

  const audioContext = new AudioContext()
  const source = audioContext.createMediaElementSource(audio)
  const destination = audioContext.createMediaStreamDestination()
  source.connect(destination)

  const recorderMimeType = chooseRecorderMimeType()
  const recorder = recorderMimeType ? new MediaRecorder(destination.stream, { mimeType: recorderMimeType }) : new MediaRecorder(destination.stream)

  const chunks: AudioChunk[] = []
  let lastTimeSeconds = 0

  const stopPromise = new Promise<void>((resolve, reject) => {
    recorder.onerror = (event) => {
      const anyEvent = event as any
      const message = anyEvent?.error?.message || 'Recording error'
      reject(new Error(message))
    }
    recorder.onstop = () => resolve()
  })

  recorder.ondataavailable = (event) => {
    if (!event.data || event.data.size <= 0) return
    const currentTimeSeconds = audio.currentTime || 0
    const durationSeconds = Math.max(0, currentTimeSeconds - lastTimeSeconds) || params.chunkDurationSeconds
    lastTimeSeconds = currentTimeSeconds
    chunks.push({ blob: event.data, durationSeconds })
  }

  await audioContext.resume()
  recorder.start(params.chunkDurationSeconds * 1000)
  try {
    await audio.play()
  } catch (error) {
    console.error('[createAudioChunksFromFile] Failed to play audio', error)
  }

  await new Promise<void>((resolve) => {
    audio.onended = () => resolve()
    audio.onerror = () => resolve()
  })

  if (recorder.state !== 'inactive') {
    recorder.stop()
  }

  await stopPromise

  const totalDurationSeconds = audio.duration && Number.isFinite(audio.duration) ? audio.duration : Math.max(0, lastTimeSeconds)

  source.disconnect()
  destination.disconnect()
  audio.removeAttribute('src')
  URL.revokeObjectURL(audioUrl)
  await audioContext.close()

  const mimeType = recorder.mimeType || 'audio/webm'
  return { chunks, mimeType, totalDurationSeconds }
}
