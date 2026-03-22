import { execute, queryOne } from "../db"
import type { BatchTranscriptionProvider, TranscriptionOperationResponse, TranscriptionProviderResult } from "./operationTypes"

type AsyncTranscriptionOperationRow = {
  operation_id: string
  owner_user_id: string
  status: string
  mode: string
  upload_path: string | null
  input_id: string | null
  language_code: string | null
  mime_type: string | null
  provider: string | null
  transcript: string | null
  error_message: string | null
}

// Attaches input metadata to an async transcription operation.
export async function attachOperationInput(params: {
  operationId: string
  userId: string
  inputId: string | null
  languageCode: string
  mimeType: string
  uploadPath: string
  provider: BatchTranscriptionProvider
}): Promise<void> {
  await execute(
    `
    update public.async_transcription_operations
    set input_id = $3,
        language_code = $4,
        mime_type = $5,
        upload_path = $6,
        provider = $7
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, params.inputId, params.languageCode, params.mimeType, params.uploadPath, params.provider],
  )
}

// Marks an async transcription operation as submitted with the provider result.
export async function markOperationSubmitted(params: {
  operationId: string
  userId: string
  provider: BatchTranscriptionProvider
  result: TranscriptionProviderResult
}): Promise<void> {
  const transcript = params.result.status === "completed" ? params.result.transcript : null
  const status = params.result.status === "completed" ? "completed" : "submitted"
  await execute(
    `
    update public.async_transcription_operations
    set status = $3,
        provider = $4,
        transcript = $5
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, status, params.provider, transcript],
  )
}

// Marks an async transcription operation as failed.
export async function markOperationFailed(params: {
  operationId: string
  userId: string
  errorMessage: string
}): Promise<void> {
  await execute(
    `
    update public.async_transcription_operations
    set status = 'failed',
        error_message = $3
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, params.errorMessage],
  )
}

// Reads an async transcription operation by id.
export async function readOperationById(params: {
  operationId: string
  userId: string
}): Promise<AsyncTranscriptionOperationRow | null> {
  return queryOne<AsyncTranscriptionOperationRow>(
    `
    select operation_id, owner_user_id, status, mode, upload_path,
           input_id, language_code, mime_type, provider, transcript, error_message
    from public.async_transcription_operations
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId],
  )
}

// Builds the API response object from an async transcription operation row.
export function buildOperationResponse(row: AsyncTranscriptionOperationRow): TranscriptionOperationResponse {
  const status = row.status as TranscriptionOperationResponse["status"]
  return {
    operationId: row.operation_id,
    status,
    provider: (row.provider as BatchTranscriptionProvider | null) ?? null,
    transcript: row.transcript ?? null,
    errorMessage: row.error_message ?? null,
  }
}

// Marks the linked input as completed with a transcript.
export async function markInputCompleted(params: {
  inputId: string
  transcript: string
  languageCode: string
}): Promise<void> {
  await execute(
    `
    update public.inputs
    set processing_status = 'done',
        processing_error = null,
        updated_at_unix_ms = extract(epoch from now())::bigint * 1000
    where id = $1
    `,
    [params.inputId],
  )
  await execute(
    `
    insert into public.input_transcripts (input_id, transcript_text, language_code)
    values ($1, $2, $3)
    on conflict (input_id) do update
      set transcript_text = excluded.transcript_text,
          language_code = excluded.language_code
    `,
    [params.inputId, params.transcript, params.languageCode],
  )
}

// Marks the linked input as failed with an error message.
export async function markInputFailed(params: {
  inputId: string
  errorMessage: string
}): Promise<void> {
  await execute(
    `
    update public.inputs
    set processing_status = 'error',
        processing_error = $2,
        updated_at_unix_ms = extract(epoch from now())::bigint * 1000
    where id = $1
    `,
    [params.inputId, params.errorMessage],
  )
}
