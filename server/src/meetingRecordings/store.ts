import crypto from "crypto"
import { execute, queryOne } from "../db"

export type MeetingRecordingStatus =
  | "starting"
  | "recording"
  | "stopping"
  | "finalizing"
  | "completed"
  | "interrupted"
  | "failed"
  | "cancelled"

type MeetingRecordingRow = {
  id: string
  session_id: string
  audio_stream_id: string
  status: MeetingRecordingStatus
  language_code: string
  mime_type: string
  sample_rate_hz: number | null
  channel_count: number | null
  source_app: string | null
  provider: string | null
  started_at_unix_ms: number
  last_chunk_at_unix_ms: number | null
  ended_at_unix_ms: number | null
  expected_next_sequence: number
  received_chunk_count: number
  received_bytes: number
  received_duration_ms: number
  partial_transcript_text: string | null
  final_transcript_text: string | null
  stop_reason: string | null
  error_message: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

export type MeetingRecording = {
  id: string
  sessionId: string
  audioStreamId: string
  status: MeetingRecordingStatus
  languageCode: string
  mimeType: string
  sampleRateHz: number | null
  channelCount: number | null
  sourceApp: string | null
  provider: string | null
  startedAtUnixMs: number
  lastChunkAtUnixMs: number | null
  endedAtUnixMs: number | null
  expectedNextSequence: number
  receivedChunkCount: number
  receivedBytes: number
  receivedDurationMs: number
  partialTranscriptText: string | null
  finalTranscriptText: string | null
  stopReason: string | null
  errorMessage: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

function mapMeetingRecordingRow(row: MeetingRecordingRow): MeetingRecording {
  return {
    id: row.id,
    sessionId: row.session_id,
    audioStreamId: row.audio_stream_id,
    status: row.status,
    languageCode: row.language_code,
    mimeType: row.mime_type,
    sampleRateHz: row.sample_rate_hz !== null ? Number(row.sample_rate_hz) : null,
    channelCount: row.channel_count !== null ? Number(row.channel_count) : null,
    sourceApp: row.source_app,
    provider: row.provider,
    startedAtUnixMs: Number(row.started_at_unix_ms),
    lastChunkAtUnixMs: row.last_chunk_at_unix_ms !== null ? Number(row.last_chunk_at_unix_ms) : null,
    endedAtUnixMs: row.ended_at_unix_ms !== null ? Number(row.ended_at_unix_ms) : null,
    expectedNextSequence: Number(row.expected_next_sequence),
    receivedChunkCount: Number(row.received_chunk_count),
    receivedBytes: Number(row.received_bytes),
    receivedDurationMs: Number(row.received_duration_ms),
    partialTranscriptText: row.partial_transcript_text,
    finalTranscriptText: row.final_transcript_text,
    stopReason: row.stop_reason,
    errorMessage: row.error_message,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

export async function createMeetingRecording(params: {
  userId: string
  sessionId: string
  audioStreamId: string
  languageCode: string
  mimeType: string
  sampleRateHz: number | null
  channelCount: number | null
  sourceApp: string | null
  provider: string | null
  startedAtUnixMs: number
  createdAtUnixMs: number
  updatedAtUnixMs: number
}): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  await execute(
    `
    insert into public.meeting_recordings (
      id, owner_user_id, session_id, audio_stream_id, status, language_code, mime_type, sample_rate_hz, channel_count,
      source_app, provider, started_at_unix_ms, expected_next_sequence, received_chunk_count, received_bytes, received_duration_ms,
      created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, 'recording', $5, $6, $7, $8, $9, $10, $11, 0, 0, 0, 0, $12, $13)
    `,
    [
      id,
      params.userId,
      params.sessionId,
      params.audioStreamId,
      params.languageCode,
      params.mimeType,
      params.sampleRateHz,
      params.channelCount,
      params.sourceApp,
      params.provider,
      params.startedAtUnixMs,
      params.createdAtUnixMs,
      params.updatedAtUnixMs,
    ],
  )
  return { id }
}

export async function readMeetingRecordingById(params: { userId: string; id: string }): Promise<MeetingRecording | null> {
  const row = await queryOne<MeetingRecordingRow>(
    `
    select
      id, session_id, audio_stream_id, status, language_code, mime_type, sample_rate_hz, channel_count, source_app, provider,
      started_at_unix_ms, last_chunk_at_unix_ms, ended_at_unix_ms, expected_next_sequence, received_chunk_count, received_bytes,
      received_duration_ms, partial_transcript_text, final_transcript_text, stop_reason, error_message, created_at_unix_ms, updated_at_unix_ms
    from public.meeting_recordings
    where owner_user_id = $1 and id = $2
    `,
    [params.userId, params.id],
  )
  if (!row) return null
  return mapMeetingRecordingRow(row)
}

export async function updateMeetingRecording(params: {
  userId: string
  id: string
  status?: MeetingRecordingStatus
  endedAtUnixMs?: number | null
  stopReason?: string | null
  errorMessage?: string | null
  updatedAtUnixMs: number
}): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (params.status !== undefined) {
    updates.push(`status = $${index++}`)
    values.push(params.status)
  }

  if (params.endedAtUnixMs !== undefined) {
    updates.push(`ended_at_unix_ms = $${index++}`)
    values.push(params.endedAtUnixMs)
  }

  if (params.stopReason !== undefined) {
    updates.push(`stop_reason = $${index++}`)
    values.push(params.stopReason)
  }

  if (params.errorMessage !== undefined) {
    updates.push(`error_message = $${index++}`)
    values.push(params.errorMessage)
  }

  values.push(params.userId)
  values.push(params.id)

  await execute(
    `
    update public.meeting_recordings
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function createMeetingRecordingToken(params: {
  userId: string
  meetingRecordingId: string
  expiresAtIso: string
}): Promise<{ token: string }> {
  const token = crypto.randomBytes(32).toString("base64url")
  await execute(
    `
    insert into public.meeting_recording_tokens (token, owner_user_id, meeting_recording_id, expires_at, used_at)
    values ($1, $2, $3, $4, null)
    `,
    [token, params.userId, params.meetingRecordingId, params.expiresAtIso],
  )
  return { token }
}

export async function consumeMeetingRecordingToken(params: {
  userId: string
  token: string
  meetingRecordingId: string
}): Promise<boolean> {
  const row = await queryOne<{ token: string }>(
    `
    update public.meeting_recording_tokens
    set used_at = now()
    where token = $1
      and owner_user_id = $2
      and meeting_recording_id = $3
      and used_at is null
      and expires_at > now()
    returning token
    `,
    [params.token, params.userId, params.meetingRecordingId],
  )
  return !!row?.token
}

export async function isMeetingRecordingTokenValid(params: {
  userId: string
  token: string
  meetingRecordingId: string
}): Promise<boolean> {
  const row = await queryOne<{ token: string }>(
    `
    select token
    from public.meeting_recording_tokens
    where token = $1
      and owner_user_id = $2
      and meeting_recording_id = $3
      and used_at is null
      and expires_at > now()
    `,
    [params.token, params.userId, params.meetingRecordingId],
  )
  return !!row?.token
}
