import crypto from "crypto"
import { createAudioStream } from "../audio/audioStreams"
import { queryOne } from "../db"
import type { Session } from "../types/Session"
import { createSession, updateSession } from "../sessions/store"
import { createMeetingRecording, createMeetingRecordingToken } from "./store"

const MEETING_RECORDING_TOKEN_TTL_SECONDS = 60 * 10

type CreateMeetingRecordingParams = {
  userId: string
  sessionId: string | null
  clientId: string | null
  trajectoryId: string | null
  title: string | null
  languageCode: string
  mimeType: string
  sampleRateHz: number | null
  channelCount: number | null
  sourceApp: string | null
  provider: string | null
}

function buildDefaultSession(nowUnixMs: number, params: CreateMeetingRecordingParams): Session {
  return {
    id: crypto.randomUUID(),
    clientId: params.clientId,
    trajectoryId: params.trajectoryId,
    title: params.title || "Recording session",
    inputType: "recording",
    audioUploadId: null,
    audioDurationSeconds: null,
    uploadFileName: null,
    transcriptText: null,
    summaryText: null,
    summaryStructured: null,
    transcriptionStatus: "transcribing",
    transcriptionError: null,
    createdAtUnixMs: nowUnixMs,
    updatedAtUnixMs: nowUnixMs,
  }
}

async function validateSessionOwnership(params: { userId: string; sessionId: string }): Promise<void> {
  const row = await queryOne<{ id: string }>(
    `
    select id
    from public.sessions
    where owner_user_id = $1 and id = $2
    `,
    [params.userId, params.sessionId],
  )
  if (!row?.id) {
    throw new Error("Session not found")
  }
}

export async function startMeetingRecording(params: CreateMeetingRecordingParams): Promise<{
  meetingRecordingId: string
  sessionId: string
  audioStreamId: string
  ingestToken: string
  ingestTokenExpiresAtMs: number
}> {
  const nowUnixMs = Date.now()
  let sessionId = params.sessionId

  if (sessionId) {
    await validateSessionOwnership({ userId: params.userId, sessionId })
    await updateSession(params.userId, {
      id: sessionId,
      inputType: "recording",
      transcriptionStatus: "transcribing",
      transcriptionError: null,
      updatedAtUnixMs: nowUnixMs,
    })
  } else {
    const session = buildDefaultSession(nowUnixMs, params)
    await createSession(params.userId, session)
    sessionId = session.id
  }

  const audioStream = await createAudioStream({
    userId: params.userId,
    mimeType: params.mimeType,
    createdAtUnixMilliseconds: nowUnixMs,
  })

  const meetingRecording = await createMeetingRecording({
    userId: params.userId,
    sessionId,
    audioStreamId: audioStream.id,
    languageCode: params.languageCode,
    mimeType: params.mimeType,
    sampleRateHz: params.sampleRateHz,
    channelCount: params.channelCount,
    sourceApp: params.sourceApp,
    provider: params.provider,
    startedAtUnixMs: nowUnixMs,
    createdAtUnixMs: nowUnixMs,
    updatedAtUnixMs: nowUnixMs,
  })

  const ingestTokenExpiresAtMs = nowUnixMs + MEETING_RECORDING_TOKEN_TTL_SECONDS * 1000
  const ingestToken = await createMeetingRecordingToken({
    userId: params.userId,
    meetingRecordingId: meetingRecording.id,
    expiresAtIso: new Date(ingestTokenExpiresAtMs).toISOString(),
  })

  return {
    meetingRecordingId: meetingRecording.id,
    sessionId,
    audioStreamId: audioStream.id,
    ingestToken: ingestToken.token,
    ingestTokenExpiresAtMs,
  }
}
