import crypto from "crypto"
import { execute, queryMany, queryOne } from "./db"

export type AudioStreamChunk = {
  index: number
  startMilliseconds: number
  durationMilliseconds: number
}

export type AudioStreamManifest = {
  id: string
  mimeType: string
  totalDurationMilliseconds: number
  chunkCount: number
  chunks: AudioStreamChunk[]
}

// Intent: createAudioStream
export async function createAudioStream(params: { userId: string; mimeType: string; createdAtUnixMilliseconds: number }): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  await execute(
    "insert into public.audio_streams (id, user_id, mime_type, created_at_unix_milliseconds) values ($1, $2, $3, $4)",
    [id, params.userId, params.mimeType, params.createdAtUnixMilliseconds],
  )
  return { id }
}

// Intent: updateAudioStreamDetails
export async function updateAudioStreamDetails(params: {
  userId: string
  id: string
  totalDurationMilliseconds: number
  chunkCount: number
}): Promise<void> {
  await execute(
    "update public.audio_streams set total_duration_milliseconds = $1, chunk_count = $2 where id = $3 and user_id = $4",
    [params.totalDurationMilliseconds, params.chunkCount, params.id, params.userId],
  )
}

// Intent: createAudioStreamChunk
export async function createAudioStreamChunk(params: {
  userId: string
  audioStreamId: string
  chunkIndex: number
  startMilliseconds: number
  durationMilliseconds: number
  bytes: Buffer
  createdAtUnixMilliseconds: number
}): Promise<void> {
  await execute(
    "insert into public.audio_stream_chunks (audio_stream_id, chunk_index, start_milliseconds, duration_milliseconds, bytes, created_at_unix_milliseconds) values ($1, $2, $3, $4, $5, $6)",
    [
      params.audioStreamId,
      params.chunkIndex,
      params.startMilliseconds,
      params.durationMilliseconds,
      params.bytes,
      params.createdAtUnixMilliseconds,
    ],
  )
}

// Intent: readAudioStreamManifest
export async function readAudioStreamManifest(params: { userId: string; id: string }): Promise<AudioStreamManifest | null> {
  const stream = await queryOne<{
    id: string
    mime_type: string
    total_duration_milliseconds: number | null
    chunk_count: number | null
  }>("select id, mime_type, total_duration_milliseconds, chunk_count from public.audio_streams where user_id = $1 and id = $2", [
    params.userId,
    params.id,
  ])
  if (!stream) return null

  const chunks = await queryMany<{
    chunk_index: number
    start_milliseconds: number
    duration_milliseconds: number
  }>("select chunk_index, start_milliseconds, duration_milliseconds from public.audio_stream_chunks where audio_stream_id = $1 order by chunk_index asc", [
    params.id,
  ])

  const totalDurationMilliseconds = Number(stream.total_duration_milliseconds || 0)
  const chunkCount = Number(stream.chunk_count || chunks.length || 0)

  return {
    id: stream.id,
    mimeType: String(stream.mime_type || "application/octet-stream"),
    totalDurationMilliseconds,
    chunkCount,
    chunks: chunks.map((chunk) => ({
      index: Number(chunk.chunk_index),
      startMilliseconds: Number(chunk.start_milliseconds),
      durationMilliseconds: Number(chunk.duration_milliseconds),
    })),
  }
}

// Intent: readAudioStreamChunk
export async function readAudioStreamChunk(params: { userId: string; id: string; chunkIndex: number }): Promise<{ bytes: Buffer } | null> {
  const row = await queryOne<{ bytes: Buffer }>(
    "select chunks.bytes from public.audio_stream_chunks as chunks join public.audio_streams as streams on streams.id = chunks.audio_stream_id where chunks.audio_stream_id = $1 and chunks.chunk_index = $2 and streams.user_id = $3",
    [params.id, params.chunkIndex, params.userId],
  )
  if (!row) return null
  return { bytes: row.bytes }
}
