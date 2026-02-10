import { fetchSecureApi } from './secureApi'

type AudioStreamManifestChunk = {
  index: number
  startMilliseconds: number
  durationMilliseconds: number
}

export type AudioStreamManifest = {
  audioStreamId: string
  mimeType: string
  totalDurationMilliseconds: number
  chunkCount: number
  chunks: AudioStreamManifestChunk[]
}

export async function createAudioStreamRemote(params: { mimeType: string }): Promise<{ audioStreamId: string }> {
  const response = await fetchSecureApi('/audio-streams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mimeType: params.mimeType }),
  })
  return response.json()
}

export async function updateAudioStreamRemote(params: {
  audioStreamId: string
  totalDurationMilliseconds: number
  chunkCount: number
}): Promise<{ ok: true }> {
  const safeId = encodeURIComponent(params.audioStreamId)
  const response = await fetchSecureApi(`/audio-streams/${safeId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      totalDurationMilliseconds: params.totalDurationMilliseconds,
      chunkCount: params.chunkCount,
    }),
  })
  return response.json()
}

export async function appendAudioStreamChunkRemote(params: {
  audioStreamId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  encryptedChunk: Uint8Array
}): Promise<{ ok: true }> {
  const safeId = encodeURIComponent(params.audioStreamId)
  const response = await fetchSecureApi(`/audio-streams/${safeId}/chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-chunk-index': String(params.chunkIndex),
      'x-start-milliseconds': String(params.startMilliseconds),
      'x-duration-milliseconds': String(params.durationMilliseconds),
    },
    body: params.encryptedChunk,
  })
  return response.json()
}

export async function loadAudioStreamManifestRemote(audioStreamId: string): Promise<AudioStreamManifest> {
  const safeId = encodeURIComponent(audioStreamId)
  const response = await fetchSecureApi(`/audio-streams/${safeId}/manifest`, { method: 'GET' })
  return response.json()
}

export async function loadAudioStreamChunkRemote(params: { audioStreamId: string; chunkIndex: number; signal?: AbortSignal }): Promise<Uint8Array> {
  const safeId = encodeURIComponent(params.audioStreamId)
  const safeIndex = encodeURIComponent(String(params.chunkIndex))
  const response = await fetchSecureApi(`/audio-streams/${safeId}/chunks/${safeIndex}`, { method: 'GET', signal: params.signal })
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}
