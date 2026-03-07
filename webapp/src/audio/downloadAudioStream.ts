import { loadAudioChunkByIndex, loadLocalAudioStreamManifest } from './audioChunkStore'
import { loadAudioStreamChunkRemote, loadAudioStreamManifestRemote } from '../services/audioStreams'

const DOWNLOAD_MANIFEST_TIMEOUT_MS = 20_000
const DOWNLOAD_CHUNK_TIMEOUT_MS = 20_000
const DOWNLOAD_TOTAL_TIMEOUT_MS = 5 * 60_000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  }) as Promise<T>
}

function toBlobPart(bytes: Uint8Array): ArrayBuffer {
  const output = new Uint8Array(bytes.byteLength)
  output.set(bytes)
  return output.buffer
}

export async function downloadAudioStream(params: {
  audioStreamId: string
  decryptChunk: (encryptedChunk: Uint8Array) => Promise<Uint8Array>
}): Promise<{ audioBlob: Blob; mimeType: string }> {
  return withTimeout(
    (async () => {
      const localManifest = await withTimeout(
        loadLocalAudioStreamManifest(params.audioStreamId),
        DOWNLOAD_MANIFEST_TIMEOUT_MS,
        'Lokaal audiomanifest laden duurde te lang.',
      )
      const manifest =
        localManifest ??
        (await withTimeout(
          loadAudioStreamManifestRemote(params.audioStreamId),
          DOWNLOAD_MANIFEST_TIMEOUT_MS,
          'Audiomanifest ophalen duurde te lang.',
        ))

      const chunks = manifest.chunks.slice().sort((left, right) => left.index - right.index)
      const parts: BlobPart[] = []
      for (const chunk of chunks) {
        const localChunk = await withTimeout(
          loadAudioChunkByIndex(params.audioStreamId, chunk.index),
          DOWNLOAD_CHUNK_TIMEOUT_MS,
          `Lokale audiochunk ${chunk.index} laden duurde te lang.`,
        )

        const encryptedChunk = localChunk
          ? localChunk.encryptedBytes
          : await withTimeout(
              loadAudioStreamChunkRemote({ audioStreamId: params.audioStreamId, chunkIndex: chunk.index }),
              DOWNLOAD_CHUNK_TIMEOUT_MS,
              `Audiochunk ${chunk.index} ophalen duurde te lang.`,
            )

        const decryptedChunk = await withTimeout(
          params.decryptChunk(encryptedChunk),
          DOWNLOAD_CHUNK_TIMEOUT_MS,
          `Audiochunk ${chunk.index} decrypten duurde te lang.`,
        )

        parts.push(toBlobPart(decryptedChunk))
      }

      return { audioBlob: new Blob(parts, { type: manifest.mimeType }), mimeType: manifest.mimeType }
    })(),
    DOWNLOAD_TOTAL_TIMEOUT_MS,
    'Audio laden duurde te lang. Probeer het opnieuw.',
  )
}
