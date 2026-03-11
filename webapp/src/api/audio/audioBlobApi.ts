import { fetchSecureApi } from '../secureApi'

export async function createAudioBlobRemote(params: {
  audioBlob: Blob
  mimeType: string
  timeoutMs?: number
  signal?: AbortSignal
}): Promise<{ audioBlobId: string }> {
  const response = await fetchSecureApi(
    '/audio-blobs',
    {
      method: 'POST',
      headers: {
        'Content-Type': params.mimeType || 'application/octet-stream',
      },
      body: params.audioBlob,
      signal: params.signal,
    },
    { timeoutMs: params.timeoutMs, signal: params.signal },
  )

  return response.json()
}

export async function loadAudioBlobRemote(id: string): Promise<{ blob: Blob; mimeType: string } | null> {
  const safeId = encodeURIComponent(id)
  const response = await fetchSecureApi(`/audio-blobs/${safeId}`, { method: 'GET' })
  const mimeType = String(response.headers.get('Content-Type') || '').trim() || 'application/octet-stream'
  const blob = await response.blob()
  return { blob, mimeType }
}

export async function loadAudioBlobStreamRemote(id: string, signal?: AbortSignal): Promise<Response> {
  const safeId = encodeURIComponent(id)
  return fetchSecureApi(`/audio-blobs/${safeId}`, { method: 'GET', signal })
}

