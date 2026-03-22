import crypto from "crypto"
import { queryOne, withTransaction } from "../db"
import { transcriptionUploadExpirationSeconds } from "./uploadExpiration"

// Creates a one-time upload token for one transcription operation.
// The operation row and the token row are created atomically so that a token
// creation failure can never leave an orphaned operation behind.
export async function createUploadToken(params: { userId: string; operationId: string; uploadPath: string }): Promise<{ uploadToken: string; expiresAtMs: number }> {
  const { userId, operationId, uploadPath } = params

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = cryptoRandomToken()
    const expiresAt = new Date(Date.now() + transcriptionUploadExpirationSeconds * 1000).toISOString()

    try {
      await withTransaction(async (tx) => {
        await tx.execute(
          `
          insert into public.async_transcription_operations (operation_id, owner_user_id, status, mode, upload_path)
          values ($1, $2, 'queued', 'batch', $3)
          on conflict (operation_id) do update
            set owner_user_id = excluded.owner_user_id,
                mode = excluded.mode,
                upload_path = excluded.upload_path
          `,
          [operationId, userId, uploadPath],
        )
        await tx.execute(
          `
          insert into public.async_transcription_upload_tokens (token, owner_user_id, operation_id, upload_blob_name, expires_at, used_at)
          values ($1, $2, $3, $4, $5, null)
          `,
          [token, userId, operationId, uploadPath, expiresAt],
        )
      })
      return { uploadToken: token, expiresAtMs: Date.parse(expiresAt) }
    } catch (error: any) {
      const message = String(error?.message || "")
      if (!message.toLowerCase().includes("duplicate")) {
        throw error
      }
    }
  }

  throw new Error("Failed to create upload token")
}

// Generates a URL-safe upload token value.
function cryptoRandomToken(): string {
  const base64 = crypto.randomBytes(32).toString("base64")
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

// Consumes a one-time upload token and returns its blob path.
export async function consumeUploadToken(params: { userId: string; uploadToken: string; operationId: string }): Promise<{ uploadPath: string }> {
  const { userId, uploadToken, operationId } = params
  const row = await queryOne<{ upload_blob_name: string }>(
    `
    update public.async_transcription_upload_tokens
    set used_at = now()
    where token = $1
      and owner_user_id = $2
      and operation_id = $3
      and used_at is null
      and expires_at > now()
    returning upload_blob_name
    `,
    [uploadToken, userId, operationId],
  )

  if (!row?.upload_blob_name) {
    throw new Error("Invalid upload token")
  }

  return { uploadPath: String(row.upload_blob_name) }
}
