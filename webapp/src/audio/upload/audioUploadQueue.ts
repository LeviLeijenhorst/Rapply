import { appendAudioStreamChunkRemote, updateAudioStreamRemote } from '../../api/audioStreams'
import {
  loadPendingAudioChunks,
  loadRecordingsNeedingFinalize,
  markAudioChunkUploaded,
  markRecordingUploadCompleted,
  saveAudioChunkAndUpdateRecording,
  saveAudioChunks,
  saveAudioRecording,
  saveAudioRecordingIfMissing,
} from './audioChunkStore'

type AudioChunkInput = {
  audioStreamId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  encryptedBytes: Uint8Array
}

let isQueueRunning = false
let queueTimerId: number | null = null
let isProcessing = false

async function processUploadQueue() {
  if (isProcessing) return
  isProcessing = true
  try {
    const pendingChunks = await loadPendingAudioChunks(3)
    if (pendingChunks.length) {
      console.log('[audioUploadQueue] Pending chunks', {
        count: pendingChunks.length,
        sample: pendingChunks.map((chunk) => ({ audioStreamId: chunk.audioStreamId, chunkIndex: chunk.chunkIndex })),
      })
    }
    for (const chunk of pendingChunks) {
      await appendAudioStreamChunkRemote({
        audioStreamId: chunk.audioStreamId,
        chunkIndex: chunk.chunkIndex,
        startMilliseconds: chunk.startMilliseconds,
        durationMilliseconds: chunk.durationMilliseconds,
        encryptedChunk: chunk.encryptedBytes,
      })
      await markAudioChunkUploaded(chunk.audioStreamId, chunk.chunkIndex)
      console.log('[audioUploadQueue] Chunk uploaded', { audioStreamId: chunk.audioStreamId, chunkIndex: chunk.chunkIndex })
    }

    const recordings = await loadRecordingsNeedingFinalize()
    for (const recording of recordings) {
      console.log('[audioUploadQueue] Finalizing recording', {
        audioStreamId: recording.audioStreamId,
        chunkCount: recording.chunkCount,
        totalDurationMilliseconds: recording.totalDurationMilliseconds,
      })
      await updateAudioStreamRemote({
        audioStreamId: recording.audioStreamId,
        totalDurationMilliseconds: recording.totalDurationMilliseconds,
        chunkCount: recording.chunkCount,
      })
      await markRecordingUploadCompleted(recording.audioStreamId)
      console.log('[audioUploadQueue] Recording finalized', { audioStreamId: recording.audioStreamId })
    }
  } catch (error) {
    console.error('[audioUploadQueue] Upload failed', error)
  } finally {
    isProcessing = false
  }
}

export function startAudioUploadQueue() {
  if (isQueueRunning) return
  isQueueRunning = true
  queueTimerId = window.setInterval(() => {
    void processUploadQueue()
  }, 2000)
  void processUploadQueue()
}

export function stopAudioUploadQueue() {
  if (queueTimerId) {
    window.clearInterval(queueTimerId)
    queueTimerId = null
  }
  isQueueRunning = false
}

export async function initializeAudioStreamUpload(params: { audioStreamId: string; mimeType: string }) {
  await saveAudioRecordingIfMissing({
    audioStreamId: params.audioStreamId,
    mimeType: params.mimeType,
    totalDurationMilliseconds: 0,
    chunkCount: 0,
    uploadedChunkCount: 0,
    uploadCompleted: false,
    createdAtUnixMs: Date.now(),
  })
  await processUploadQueue()
}

export async function enqueueAudioChunkUpload(params: {
  audioStreamId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  encryptedBytes: Uint8Array
}) {
  await saveAudioChunkAndUpdateRecording({
    audioStreamId: params.audioStreamId,
    chunkIndex: params.chunkIndex,
    startMilliseconds: params.startMilliseconds,
    durationMilliseconds: params.durationMilliseconds,
    encryptedBytes: params.encryptedBytes,
  })
  await processUploadQueue()
}

export async function storeAudioStreamForUpload(params: {
  audioStreamId: string
  mimeType: string
  totalDurationMilliseconds: number
  chunks: AudioChunkInput[]
}) {
  await saveAudioRecording({
    audioStreamId: params.audioStreamId,
    mimeType: params.mimeType,
    totalDurationMilliseconds: params.totalDurationMilliseconds,
    chunkCount: params.chunks.length,
    uploadedChunkCount: 0,
    uploadCompleted: false,
    createdAtUnixMs: Date.now(),
  })
  await saveAudioChunks(
    params.chunks.map((chunk) => ({
      id: `${chunk.audioStreamId}:${chunk.chunkIndex}`,
      audioStreamId: chunk.audioStreamId,
      chunkIndex: chunk.chunkIndex,
      startMilliseconds: chunk.startMilliseconds,
      durationMilliseconds: chunk.durationMilliseconds,
      encryptedBytes: chunk.encryptedBytes,
      uploaded: false,
    })),
  )
  await processUploadQueue()
}
