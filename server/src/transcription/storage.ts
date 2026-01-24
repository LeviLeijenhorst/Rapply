import { Readable } from "stream"
import { supabaseAdmin } from "../supabaseAdmin"

export async function fetchEncryptedUploadStream(params: { bucket: string; path: string }): Promise<NodeJS.ReadableStream> {
  const { bucket, path } = params
  const signed = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60)
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(signed.error?.message || "Failed to create signed URL")
  }

  const response = await fetch(signed.data.signedUrl)
  if (!response.ok || !response.body) {
    throw new Error(`Upload not found`)
  }

  return Readable.fromWeb(response.body as any) as any
}

