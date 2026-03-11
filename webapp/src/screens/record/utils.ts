import { buildUntitledSessionTitle, type UntitledSessionKind } from '../../utils/text/buildUntitledTitle'

export type OptionKey = 'gesprek' | 'gespreksverslag' | 'upload' | 'schrijven' | 'intake'

export const maxRecordingSeconds = 1 * 60 * 60 + 54 * 60 + 59
export const recordingWarningLeadSeconds = 5 * 60
export const recordingWarningStartSeconds = maxRecordingSeconds - recordingWarningLeadSeconds
export const maxTranscriptionDurationSeconds = 115 * 60

type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

const knownAudioMimeByExtension: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  webm: 'audio/webm',
  flac: 'audio/flac',
}

export function formatTimeLabel(totalSeconds: number): string {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(normalizedSeconds / 3600)
  const minutes = Math.floor((normalizedSeconds % 3600) / 60)
  const seconds = normalizedSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getUntitledSessionKindForOption(option: OptionKey | null): UntitledSessionKind {
  if (option === 'gesprek' || option === 'upload') return 'gesprek'
  return 'verslag'
}

export function buildDefaultSessionTitle(option: OptionKey | null): string {
  if (option === 'intake') return 'Intake'
  return buildUntitledSessionTitle(getUntitledSessionKindForOption(option))
}

export function normalizeDraftOption(option: string | null | undefined): OptionKey {
  if (option === 'gesprek') return 'gesprek'
  if (option === 'upload') return 'upload'
  if (option === 'schrijven') return 'gespreksverslag'
  if (option === 'gespreksverslag') return 'gespreksverslag'
  if (option === 'spraakGespreksverslag' || option === 'spraakAnderVerslag' || option === 'verslag') return 'gespreksverslag'
  return 'gesprek'
}

export function getFileExtension(fileName: string): string {
  const trimmed = String(fileName || '').trim().toLowerCase()
  const dotIndex = trimmed.lastIndexOf('.')
  if (dotIndex < 0 || dotIndex === trimmed.length - 1) return ''
  return trimmed.slice(dotIndex + 1)
}

export function getAudioMimeTypeFromFile(file: File): string {
  if (file.type && file.type.toLowerCase().startsWith('audio/')) {
    return file.type
  }
  const extension = getFileExtension(file.name)
  return knownAudioMimeByExtension[extension] ?? 'audio/mpeg'
}

export async function readAudioDurationSeconds(blob: Blob): Promise<number | null> {
  if (typeof window === 'undefined') return null
  const audio = document.createElement('audio')
  const objectUrl = URL.createObjectURL(blob)
  audio.preload = 'metadata'
  audio.src = objectUrl

  try {
    const duration = await new Promise<number | null>((resolve) => {
      let isResolved = false
      const timeoutId = window.setTimeout(() => {
        if (isResolved) return
        isResolved = true
        resolve(null)
      }, 6000)

      const cleanup = () => {
        window.clearTimeout(timeoutId)
        audio.removeAttribute('src')
      }

      audio.onloadedmetadata = () => {
        if (isResolved) return
        isResolved = true
        const nextDuration = Number.isFinite(audio.duration) ? Math.max(0, Math.round(audio.duration)) : null
        cleanup()
        resolve(nextDuration)
      }

      audio.onerror = () => {
        if (isResolved) return
        isResolved = true
        cleanup()
        resolve(null)
      }
    })
    return duration
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function normalizePositiveDuration(value: unknown): number | null {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null
  return numericValue
}

export function maxDuration(candidates: Array<number | null | undefined>): number {
  return candidates.reduce<number>((best, candidate) => {
    const nextValue = normalizePositiveDuration(candidate)
    if (nextValue === null) return best
    return Math.max(best, nextValue)
  }, 0)
}

export function readRemainingTranscriptionSeconds(status: BillingStatus | null): number {
  if (!status) return 0
  const includedRemainingSeconds = Math.max(0, Math.floor(status.includedSeconds - status.cycleUsedSeconds))
  const nonExpiringRemainingSeconds = Math.max(0, Math.floor(status.nonExpiringTotalSeconds - status.nonExpiringUsedSeconds))
  return includedRemainingSeconds + nonExpiringRemainingSeconds
}

export function normalizeFileExtensionFromMimeType(mimeType: string): string {
  const normalized = String(mimeType || '').toLowerCase()
  if (normalized.includes('wav')) return 'wav'
  if (normalized.includes('ogg') || normalized.includes('opus')) return 'ogg'
  if (normalized.includes('webm')) return 'webm'
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3'
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a'
  return 'mp3'
}

export const formatDurationLabel = formatTimeLabel

export function formatMinutesLabel(totalSeconds: number): string {
  const minutes = Math.ceil(Math.max(0, Number(totalSeconds) || 0) / 60)
  if (minutes <= 0) return 'minder dan 1 minuut'
  if (minutes === 1) return '1 minuut'
  return `${minutes} minuten`
}

export function createOperationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `op_${Date.now()}_${Math.floor(Math.random() * 1_000_000_000)}`
}

export function isAudioFile(file: File | null): boolean {
  if (!file) return false
  if (file.type && file.type.toLowerCase().startsWith('audio/')) return true
  const extension = getFileExtension(file.name)
  return Boolean(knownAudioMimeByExtension[extension])
}
