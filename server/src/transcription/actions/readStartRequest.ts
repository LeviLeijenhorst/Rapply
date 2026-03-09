import type { StartRequest } from "../routes/types"

export function readStartRequest(body: any): StartRequest | null {
  const operationId = typeof body?.operationId === "string" ? body.operationId.trim() : ""
  const uploadToken = typeof body?.uploadToken === "string" ? body.uploadToken.trim() : ""
  const keyBase64 = typeof body?.keyBase64 === "string" ? body.keyBase64.trim() : ""
  if (!operationId || !uploadToken || !keyBase64) return null
  return {
    operationId,
    uploadToken,
    keyBase64,
    languageCode: typeof body?.language_code === "string" ? body.language_code.trim() || "nl" : "nl",
    mimeType: typeof body?.mime_type === "string" ? body.mime_type.trim() || "audio/m4a" : "audio/m4a",
    includeSummary: body?.include_summary !== false,
  }
}
