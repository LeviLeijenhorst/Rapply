import crypto from "crypto"
import { execute, queryOne } from "./db"

// Intent: createAudioBlob
export async function createAudioBlob(params: { userId: string; mimeType: string; bytes: Buffer; createdAtUnixMs: number }): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  await execute(
    "insert into public.audio_uploads (id, owner_user_id, mime_type, bytes, created_at_unix_ms) values ($1, $2, $3, $4, $5)",
    [id, params.userId, params.mimeType, params.bytes, params.createdAtUnixMs],
  )
  return { id }
}

// Intent: readAudioBlob
export async function readAudioBlob(params: { userId: string; id: string }): Promise<{ mimeType: string; bytes: Buffer } | null> {
  const row = await queryOne<{ mime_type: string; bytes: Buffer }>(
    "select mime_type, bytes from public.audio_uploads where owner_user_id = $1 and id = $2",
    [params.userId, params.id],
  )
  if (!row) return null
  return { mimeType: String(row.mime_type || "application/octet-stream"), bytes: row.bytes }
}
