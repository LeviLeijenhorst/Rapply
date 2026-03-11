import { formatDurationLabel, normalizeFileExtensionFromMimeType, readAudioDurationSeconds } from '../utils'

export function buildAudioDownloadFileName(params: {
  kind: 'recording' | 'upload'
  mimeType: string
  title: string
}): string {
  const extension = normalizeFileExtensionFromMimeType(params.mimeType)
  const safeTitle = String(params.title || '')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
  const baseName = safeTitle || (params.kind === 'recording' ? 'opname' : 'upload')
  return `${baseName}.${extension}`
}

export function buildUploadDurationWarning(durationSeconds: number, maxTranscriptionDurationSeconds: number): string {
  return `Dit bestand duurt ${formatDurationLabel(durationSeconds)}. De maximale duur voor transcriptie is ${formatDurationLabel(maxTranscriptionDurationSeconds)}.`
}

export async function validateUploadFileDuration(params: {
  file: File
  maxTranscriptionDurationSeconds: number
}): Promise<{ durationSeconds: number | null; warning: string | null }> {
  const durationSeconds = await readAudioDurationSeconds(params.file)
  if (!Number.isFinite(durationSeconds) || durationSeconds === null) {
    return { durationSeconds: null, warning: null }
  }
  if (durationSeconds > params.maxTranscriptionDurationSeconds) {
    return {
      durationSeconds,
      warning: buildUploadDurationWarning(durationSeconds, params.maxTranscriptionDurationSeconds),
    }
  }
  return { durationSeconds, warning: null }
}

export function resolveDefaultTrajectoryIdForClient(params: {
  clientId: string | null | undefined
  initialTrajectoryId: string | null | undefined
  trajectoriesByClientId: Map<string, Array<{ id: string }>>
}): string | null {
  if (!params.clientId) return null
  const trajectories = params.trajectoriesByClientId.get(params.clientId) ?? []
  if (trajectories.length === 0) return null
  const matchingInitial = params.initialTrajectoryId
    ? trajectories.find((trajectory) => trajectory.id === params.initialTrajectoryId)
    : null
  return matchingInitial?.id ?? trajectories[0].id
}

export function getDropdownMaxHeight(params: {
  defaultDropdownMaxHeight: number
  dropdownSafeBottom: number
  windowHeight: number
  target?: { measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null
  onResolved: (height: number) => void
}) {
  if (typeof window === 'undefined') {
    params.onResolved(params.defaultDropdownMaxHeight)
    return
  }
  if (!params.target?.measureInWindow) {
    params.onResolved(params.defaultDropdownMaxHeight)
    return
  }

  params.target.measureInWindow((_x: number, y: number, _width: number, height: number) => {
    const availableHeight = params.windowHeight - (y + height) - params.dropdownSafeBottom
    params.onResolved(Math.max(120, availableHeight))
  })
}

