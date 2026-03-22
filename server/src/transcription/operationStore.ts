import { assertUserCanAccessClient, isUserOrganizationAdmin } from "../access/clientAccess"
import { execute, queryOne } from "../db"
import {
  isFinishedOperationStatus,
  readOperationStatusLabel,
  type BatchTranscriptionProvider,
  type ProviderOperationStartResult,
  type TranscriptionOperationRecord,
  type TranscriptionOperationResponse,
  type TranscriptionOperationStatus,
} from "./operationTypes"

type SessionAccessRow = {
  client_id: string | null
  organization_id: string | null
  created_by_user_id: string | null
}

const asyncOperationTableName = "public.async_transcription_operations"
const legacyOperationTableName = "public.transcription_operations"

function normalizeOptionalText(value: unknown): string | null {
  const trimmed = String(value || "").trim()
  return trimmed || null
}

function normalizeOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeOperationStatus(value: unknown): TranscriptionOperationStatus {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "running") return "running"
  if (normalized === "completed") return "completed"
  if (normalized === "failed") return "failed"
  if (normalized === "cancelled") return "cancelled"
  return "queued"
}

function mapOperationRow(row: any): TranscriptionOperationRecord {
  return {
    operationId: String(row?.operation_id || ""),
    ownerUserId: String(row?.owner_user_id || ""),
    inputId: normalizeOptionalText(row?.input_id),
    status: String(row?.status || ""),
    mode: normalizeOptionalText(row?.mode),
    provider: normalizeOptionalText(row?.provider),
    uploadPath: normalizeOptionalText(row?.upload_path),
    languageCode: normalizeOptionalText(row?.language_code),
    mimeType: normalizeOptionalText(row?.mime_type),
    externalJobId: normalizeOptionalText(row?.external_job_id),
    externalStatusPath: normalizeOptionalText(row?.external_status_path),
    externalResultPath: normalizeOptionalText(row?.external_result_path),
    transcriptText: normalizeOptionalText(row?.transcript_text),
    providerError: normalizeOptionalText(row?.provider_error),
    errorMessage: normalizeOptionalText(row?.error_message),
    secondsCharged: normalizeOptionalNumber(row?.seconds_charged),
    remainingSeconds: normalizeOptionalNumber(row?.remaining_seconds_after),
    refundedAt: normalizeOptionalText(row?.refunded_at),
    createdAt: normalizeOptionalText(row?.created_at),
    chargedAt: normalizeOptionalText(row?.charged_at),
    startedAt: normalizeOptionalText(row?.started_at),
    completedAt: normalizeOptionalText(row?.completed_at),
    failedAt: normalizeOptionalText(row?.failed_at),
    cancelledAt: normalizeOptionalText(row?.cancelled_at),
    lastPolledAt: normalizeOptionalText(row?.last_polled_at),
  }
}

function readOperationErrorMessage(operation: TranscriptionOperationRecord): string {
  return String(operation.providerError || operation.errorMessage || "").trim()
}

async function readSessionAccessRow(sessionId: string): Promise<SessionAccessRow | null> {
  return await queryOne<SessionAccessRow>(
    `
    select client_id, organization_id, created_by_user_id
    from public.inputs
    where id = $1
    limit 1
    `,
    [sessionId],
  )
}

export async function assertUserCanAccessInput(userId: string, inputId: string): Promise<void> {
  const accessRow = await readSessionAccessRow(inputId)
  if (!accessRow) {
    const error: any = new Error("Input not found")
    error.status = 404
    throw error as Error
  }
  if (accessRow.client_id) {
    await assertUserCanAccessClient(userId, accessRow.client_id)
    return
  }
  if (accessRow.created_by_user_id === userId) return
  if (accessRow.organization_id && (await isUserOrganizationAdmin(userId, accessRow.organization_id))) return

  const error: any = new Error("Forbidden")
  error.status = 403
  throw error as Error
}

export async function readOperationById(params: { operationId: string; userId: string }): Promise<TranscriptionOperationRecord | null> {
  const row = await queryOne<any>(
    `
    select *
    from ${asyncOperationTableName}
    where operation_id = $1
      and owner_user_id = $2
    limit 1
    `,
    [params.operationId, params.userId],
  )

  return row ? mapOperationRow(row) : null
}

export async function attachOperationInput(params: {
  operationId: string
  userId: string
  inputId: string | null
  languageCode: string
  mimeType: string
  uploadPath: string
  provider: BatchTranscriptionProvider
}): Promise<void> {
  if (params.inputId) {
    await assertUserCanAccessInput(params.userId, params.inputId)
    await markInputTranscribing({ inputId: params.inputId })
  }

  await execute(
    `
    update ${asyncOperationTableName}
    set input_id = $3,
        language_code = $4,
        mime_type = $5,
        upload_path = $6,
        provider = $7,
        mode = 'batch',
        status = 'queued',
        provider_error = null,
        error_message = null,
        cancelled_at = null
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, params.inputId, params.languageCode, params.mimeType, params.uploadPath, params.provider],
  )
}

export async function markOperationSubmitted(params: {
  operationId: string
  userId: string
  provider: BatchTranscriptionProvider
  result: ProviderOperationStartResult
}): Promise<void> {
  if (params.result.status === "completed") {
    await execute(
      `
      update ${asyncOperationTableName}
      set provider = $3,
          status = 'completed',
          transcript_text = $4,
          provider_error = null,
          error_message = null,
          started_at = coalesce(started_at, now()),
          completed_at = now(),
          failed_at = null,
          cancelled_at = null
      where operation_id = $1
        and owner_user_id = $2
      `,
      [params.operationId, params.userId, params.provider, params.result.transcript],
    )
    return
  }

  await execute(
    `
    update ${asyncOperationTableName}
    set provider = $3,
        status = $4,
        external_job_id = $5,
        external_status_path = $6,
        external_result_path = $7,
        provider_error = null,
        error_message = null,
        transcript_text = null,
        started_at = coalesce(started_at, now()),
        completed_at = null,
        failed_at = null,
        cancelled_at = null
    where operation_id = $1
      and owner_user_id = $2
    `,
    [
      params.operationId,
      params.userId,
      params.provider,
      params.result.status,
      params.result.externalJobId,
      params.result.externalStatusPath,
      params.result.externalResultPath,
    ],
  )
}

export async function markOperationRunning(params: { operationId: string; userId: string }): Promise<void> {
  await execute(
    `
    update ${asyncOperationTableName}
    set status = 'running',
        started_at = coalesce(started_at, now()),
        last_polled_at = now()
    where operation_id = $1
      and owner_user_id = $2
      and status not in ('completed', 'failed', 'cancelled')
    `,
    [params.operationId, params.userId],
  )
}

export async function markOperationCompleted(params: { operationId: string; userId: string; transcript: string }): Promise<void> {
  await execute(
    `
    update ${asyncOperationTableName}
    set status = 'completed',
        transcript_text = $3,
        provider_error = null,
        error_message = null,
        completed_at = now(),
        failed_at = null,
        cancelled_at = null,
        last_polled_at = now()
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, params.transcript],
  )
}

export async function markOperationFailed(params: { operationId: string; userId: string; errorMessage: string }): Promise<void> {
  await execute(
    `
    update ${asyncOperationTableName}
    set status = 'failed',
        provider_error = $3,
        error_message = $3,
        failed_at = now(),
        completed_at = null,
        cancelled_at = null,
        last_polled_at = now()
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, params.errorMessage],
  )
}

export async function markOperationCancelled(params: { operationId: string; userId: string }): Promise<void> {
  await execute(
    `
    update ${asyncOperationTableName}
    set status = 'cancelled',
        cancelled_at = now(),
        completed_at = null,
        failed_at = null,
        last_polled_at = now()
    where operation_id = $1
      and owner_user_id = $2
      and status not in ('completed', 'failed', 'cancelled')
    `,
    [params.operationId, params.userId],
  )
}

export async function markInputTranscribing(params: { inputId: string }): Promise<void> {
  await execute(
    `
    update public.inputs
    set processing_status = 'transcribing',
        processing_error = null,
        updated_at_unix_ms = $2
    where id = $1
    `,
    [params.inputId, Date.now()],
  )
}

export async function markInputCompleted(params: { inputId: string; transcript: string; languageCode: string | null }): Promise<void> {
  const now = Date.now()

  await execute(
    `
    insert into public.input_transcripts (input_id, transcript_text, language_code, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4, $4)
    on conflict (input_id) do update
      set transcript_text = excluded.transcript_text,
          language_code = excluded.language_code,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [params.inputId, params.transcript, params.languageCode, now],
  )

  await execute(
    `
    update public.inputs
    set processing_status = 'done',
        processing_error = null,
        updated_at_unix_ms = $2
    where id = $1
    `,
    [params.inputId, now],
  )
}

export async function markInputFailed(params: { inputId: string; errorMessage: string }): Promise<void> {
  await execute(
    `
    update public.inputs
    set processing_status = 'error',
        processing_error = $2,
        updated_at_unix_ms = $3
    where id = $1
    `,
    [params.inputId, params.errorMessage, Date.now()],
  )
}

export async function markInputCancelled(params: { inputId: string }): Promise<void> {
  await execute(
    `
    update public.inputs
    set processing_status = 'idle',
        processing_error = null,
        updated_at_unix_ms = $2
    where id = $1
    `,
    [params.inputId, Date.now()],
  )
}

export function buildOperationResponse(operation: TranscriptionOperationRecord): TranscriptionOperationResponse {
  const status = normalizeOperationStatus(operation.status)
  const transcript = String(operation.transcriptText || "").trim()
  return {
    operationId: operation.operationId,
    status,
    provider: (normalizeOptionalText(operation.provider) as BatchTranscriptionProvider | null) ?? null,
    mode: operation.mode === "batch" || operation.mode === "realtime" ? operation.mode : null,
    transcript,
    text: transcript,
    errorMessage: readOperationErrorMessage(operation),
    statusLabel: readOperationStatusLabel(status),
    canRetry: status === "failed" && !!operation.uploadPath,
    secondsCharged: operation.secondsCharged,
    remainingSeconds: operation.remainingSeconds,
  }
}

export async function markLegacyOperationCompleted(params: { operationId: string; userId: string; transcript: string }): Promise<void> {
  await execute(
    `
    update ${legacyOperationTableName}
    set status = 'completed',
        error_message = null,
        completed_at = now(),
        failed_at = null
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId],
  )
}

export async function markLegacyOperationFailed(params: { operationId: string; userId: string; errorMessage: string }): Promise<void> {
  await execute(
    `
    update ${legacyOperationTableName}
    set status = 'failed',
        error_message = $3,
        failed_at = now(),
        completed_at = null
    where operation_id = $1
      and owner_user_id = $2
    `,
    [params.operationId, params.userId, params.errorMessage],
  )
}
