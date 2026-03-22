import { fetchSecureApi } from '../../secureApi'
import type { TranscriptionOperationResponse } from '../operationTypes'

const TRANSCRIPTION_POLL_INTERVAL_MS = 2_000
const TRANSCRIPTION_POLL_TIMEOUT_MS = 30_000
const ABORTED_REQUEST_ERROR = 'Request aborted'

function isFinishedStatus(status: string): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
      reject(new Error(ABORTED_REQUEST_ERROR))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function pollTranscriptionOperation(params: {
  operationId: string
  signal?: AbortSignal
  onUpdate?: (operation: TranscriptionOperationResponse) => void
}): Promise<TranscriptionOperationResponse> {
  const operationId = String(params.operationId || '').trim()
  if (!operationId) {
    throw new Error('Missing operationId')
  }

  while (true) {
    const response = await fetchSecureApi(
      `/transcription/operations/${encodeURIComponent(operationId)}`,
      { method: 'GET' },
      { timeoutMs: TRANSCRIPTION_POLL_TIMEOUT_MS, signal: params.signal },
    )
    const operation = (await response.json()) as TranscriptionOperationResponse
    params.onUpdate?.(operation)
    if (isFinishedStatus(String(operation?.status || ''))) {
      return operation
    }

    await sleepWithAbort(TRANSCRIPTION_POLL_INTERVAL_MS, params.signal)
  }
}
