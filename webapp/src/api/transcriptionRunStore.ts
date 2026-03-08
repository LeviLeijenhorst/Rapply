type RunState = {
  runId: number
  transcriptionAbortController: AbortController | null
  summaryAbortController: AbortController | null
  operationId: string | null
}

const runStateBySessionId = new Map<string, RunState>()

function getRunState(sessionId: string): RunState | null {
  return runStateBySessionId.get(sessionId) ?? null
}

export function startTranscriptionRun(sessionId: string): number {
  const current = getRunState(sessionId)
  const runId = (current?.runId ?? 0) + 1
  runStateBySessionId.set(sessionId, {
    runId,
    transcriptionAbortController: null,
    summaryAbortController: null,
    operationId: null,
  })
  return runId
}

export function isTranscriptionRunActive(sessionId: string, runId: number): boolean {
  const current = getRunState(sessionId)
  return !!current && current.runId === runId
}

export function setTranscriptionAbortController(sessionId: string, runId: number, controller: AbortController | null): void {
  const current = getRunState(sessionId)
  if (!current || current.runId !== runId) return
  current.transcriptionAbortController = controller
}

export function setSummaryAbortController(sessionId: string, runId: number, controller: AbortController | null): void {
  const current = getRunState(sessionId)
  if (!current || current.runId !== runId) return
  current.summaryAbortController = controller
}

export function setTranscriptionOperationId(sessionId: string, runId: number, operationId: string | null): void {
  const current = getRunState(sessionId)
  if (!current || current.runId !== runId) return
  current.operationId = operationId ? String(operationId).trim() : null
}

export function finishTranscriptionRun(sessionId: string, runId: number): void {
  const current = getRunState(sessionId)
  if (!current || current.runId !== runId) return
  runStateBySessionId.delete(sessionId)
}

export function cancelTranscriptionRun(sessionId: string): { operationId: string | null } {
  const current = getRunState(sessionId)
  if (!current) return { operationId: null }

  current.transcriptionAbortController?.abort()
  current.summaryAbortController?.abort()
  const operationId = current.operationId
  runStateBySessionId.delete(sessionId)
  return { operationId }
}

export function getActiveTranscriptionRun(sessionId: string): { runId: number; operationId: string | null } | null {
  const current = getRunState(sessionId)
  if (!current) return null
  return {
    runId: current.runId,
    operationId: current.operationId,
  }
}

