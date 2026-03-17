import { fetchSecureApi } from '../secureApi'

export type MeetingRecordingStartResponse = {
  meetingRecordingId: string
  sessionId: string
  audioStreamId: string
  ingestToken: string
  ingestTokenExpiresAtMs: number
}

export type MeetingRecordingStopResponse = {
  ok: true
  alreadyStopped: boolean
}

export type MeetingRecordingCancelResponse = {
  ok: true
  alreadyCancelled: boolean
}

type MeetingRecordingApiErrorCode = 'permission_denied' | 'network_error' | 'invalid_token' | 'already_stopped' | 'not_found' | 'unknown'

export class MeetingRecordingApiError extends Error {
  code: MeetingRecordingApiErrorCode

  constructor(code: MeetingRecordingApiErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

function mapMeetingRecordingApiError(error: unknown): MeetingRecordingApiError {
  const message = error instanceof Error ? error.message : String(error || '')
  const normalized = message.toLowerCase()
  if (normalized.includes('api error: 401') && normalized.includes('invalid ingest token')) {
    return new MeetingRecordingApiError('invalid_token', 'De opname-token is ongeldig of verlopen.')
  }
  if (normalized.includes('api error: 401')) return new MeetingRecordingApiError('permission_denied', 'Je bent niet ingelogd of hebt geen toegang.')
  if (normalized.includes('api error: 404')) return new MeetingRecordingApiError('not_found', 'De opname is niet gevonden.')
  if (normalized.includes('api error: 409')) return new MeetingRecordingApiError('already_stopped', 'De opname was al gestopt.')
  if (normalized.includes('api error: 400') && normalized.includes('invalid ingest token')) return new MeetingRecordingApiError('invalid_token', 'De opname-token is ongeldig of verlopen.')
  if (normalized.includes('geen verbinding')) return new MeetingRecordingApiError('network_error', 'Geen verbinding. Probeer het later opnieuw.')
  if (normalized.includes('not authenticated')) return new MeetingRecordingApiError('permission_denied', 'Je bent niet ingelogd.')
  return new MeetingRecordingApiError('unknown', message || 'Onbekende fout bij video-opname.')
}

export async function startMeetingRecordingRemote(params: {
  sessionId?: string | null
  clientId?: string | null
  trajectoryId?: string | null
  title?: string | null
  languageCode: string
  mimeType: string
  sampleRateHz?: number | null
  channelCount?: number | null
  sourceApp?: string | null
  provider?: string | null
}): Promise<MeetingRecordingStartResponse> {
  try {
    const response = await fetchSecureApi('/meeting-recordings/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId ?? null,
        clientId: params.clientId ?? null,
        trajectoryId: params.trajectoryId ?? null,
        title: params.title ?? null,
        languageCode: params.languageCode,
        mimeType: params.mimeType,
        sampleRateHz: params.sampleRateHz ?? null,
        channelCount: params.channelCount ?? null,
        sourceApp: params.sourceApp ?? 'web',
        provider: params.provider ?? 'browser',
      }),
    })
    return response.json()
  } catch (error) {
    throw mapMeetingRecordingApiError(error)
  }
}

export async function appendMeetingRecordingChunkRemote(params: {
  meetingRecordingId: string
  ingestToken: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  chunkBytes: Uint8Array
}): Promise<{ ok: true }> {
  const body = (() => {
    const output = new Uint8Array(params.chunkBytes.byteLength)
    output.set(params.chunkBytes)
    return output.buffer
  })()
  const safeId = encodeURIComponent(params.meetingRecordingId)
  try {
    const response = await fetchSecureApi(`/meeting-recordings/${safeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-ingest-token': params.ingestToken,
        'x-chunk-index': String(params.chunkIndex),
        'x-start-milliseconds': String(params.startMilliseconds),
        'x-duration-milliseconds': String(params.durationMilliseconds),
      },
      body,
    })
    return response.json()
  } catch (error) {
    throw mapMeetingRecordingApiError(error)
  }
}

export async function stopMeetingRecordingRemote(params: {
  meetingRecordingId: string
  endedAtUnixMs: number
  reason?: string
}): Promise<MeetingRecordingStopResponse> {
  const safeId = encodeURIComponent(params.meetingRecordingId)
  try {
    const response = await fetchSecureApi(`/meeting-recordings/${safeId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endedAtUnixMs: params.endedAtUnixMs,
        reason: params.reason ?? 'user_stop',
      }),
    })
    return response.json()
  } catch (error) {
    throw mapMeetingRecordingApiError(error)
  }
}

export async function cancelMeetingRecordingRemote(params: { meetingRecordingId: string }): Promise<MeetingRecordingCancelResponse> {
  const safeId = encodeURIComponent(params.meetingRecordingId)
  try {
    const response = await fetchSecureApi(`/meeting-recordings/${safeId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    return response.json()
  } catch (error) {
    throw mapMeetingRecordingApiError(error)
  }
}
