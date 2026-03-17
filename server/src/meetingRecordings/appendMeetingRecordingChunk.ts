import { createAudioStreamChunk } from "../audio/audioStreams"
import { execute } from "../db"
import { readMeetingRecordingById } from "./store"

export async function appendMeetingRecordingChunk(params: {
  userId: string
  meetingRecordingId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  bytes: Buffer
}): Promise<{ ok: true }> {
  const recording = await readMeetingRecordingById({ userId: params.userId, id: params.meetingRecordingId })
  if (!recording) {
    throw new Error("Meeting recording not found")
  }

  if (recording.status !== "recording" && recording.status !== "stopping") {
    throw new Error("Meeting recording already stopped")
  }

  await createAudioStreamChunk({
    userId: params.userId,
    audioStreamId: recording.audioStreamId,
    chunkIndex: params.chunkIndex,
    startMilliseconds: params.startMilliseconds,
    durationMilliseconds: params.durationMilliseconds,
    bytes: params.bytes,
    createdAtUnixMilliseconds: Date.now(),
  })

  await execute(
    `
    update public.meeting_recordings
    set
      last_chunk_at_unix_ms = $1,
      expected_next_sequence = greatest(expected_next_sequence, $2),
      received_chunk_count = received_chunk_count + 1,
      received_bytes = received_bytes + $3,
      received_duration_ms = received_duration_ms + $4,
      updated_at_unix_ms = $5
    where owner_user_id = $6 and id = $7
    `,
    [
      Date.now(),
      params.chunkIndex + 1,
      params.bytes.length,
      params.durationMilliseconds,
      Date.now(),
      params.userId,
      params.meetingRecordingId,
    ],
  )

  return { ok: true }
}
