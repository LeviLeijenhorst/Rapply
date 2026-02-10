import { loadAudioChunkByIndex, loadLocalAudioStreamManifest } from './audioChunkStore'
import { loadAudioStreamChunkRemote, loadAudioStreamManifestRemote } from '../services/audioStreams'

export async function downloadAudioStream(params: {
  audioStreamId: string
  decryptChunk: (encryptedChunk: Uint8Array) => Promise<Uint8Array>
}): Promise<{ audioBlob: Blob; mimeType: string }> {
  const localManifest = await loadLocalAudioStreamManifest(params.audioStreamId)
  const manifest = localManifest ?? (await loadAudioStreamManifestRemote(params.audioStreamId))
  const chunks = manifest.chunks.slice().sort((left, right) => left.index - right.index)
  const parts: Uint8Array[] = []
  for (const chunk of chunks) {
    const localChunk = await loadAudioChunkByIndex(params.audioStreamId, chunk.index)
    const encryptedChunk = localChunk
      ? localChunk.encryptedBytes
      : await loadAudioStreamChunkRemote({ audioStreamId: params.audioStreamId, chunkIndex: chunk.index })
    const decryptedChunk = await params.decryptChunk(encryptedChunk)
    parts.push(decryptedChunk)
  }
  return { audioBlob: new Blob(parts, { type: manifest.mimeType }), mimeType: manifest.mimeType }
}
