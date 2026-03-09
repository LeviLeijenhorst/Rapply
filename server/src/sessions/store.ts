import { execute, queryMany } from "../db"
import type { Session, SessionInputType } from "../types/Session"

type SessionRow = {
  id: string
  client_id: string | null
  trajectory_id: string | null
  title: string
  input_type: SessionInputType
  audio_upload_id: string | null
  audio_duration_seconds: number | null
  upload_file_name: string | null
  transcript_text: string | null
  summary_text: string | null
  summary_structured_json: unknown | null
  transcription_status: "idle" | "transcribing" | "generating" | "done" | "error"
  transcription_error: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapSummaryStructured(value: unknown): Session["summaryStructured"] {
  if (!value || typeof value !== "object") return null
  return {
    doelstelling: String((value as any).doelstelling || ""),
    belastbaarheid: String((value as any).belastbaarheid || ""),
    belemmeringen: String((value as any).belemmeringen || ""),
    voortgang: String((value as any).voortgang || ""),
    arbeidsmarktorientatie: String((value as any).arbeidsmarktorientatie || ""),
  }
}

function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: row.trajectory_id,
    title: row.title,
    inputType: row.input_type,
    audioUploadId: row.audio_upload_id,
    audioDurationSeconds: row.audio_duration_seconds !== null ? Number(row.audio_duration_seconds) : null,
    uploadFileName: row.upload_file_name,
    transcriptText: row.transcript_text,
    summaryText: row.summary_text,
    summaryStructured: mapSummaryStructured(row.summary_structured_json),
    transcriptionStatus: row.transcription_status,
    transcriptionError: row.transcription_error,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

export async function listSessions(userId: string): Promise<Session[]> {
  const rows = await queryMany<SessionRow>(
    `
    select id, client_id, trajectory_id, title, input_type, audio_upload_id, audio_duration_seconds, upload_file_name, transcript_text, summary_text, summary_structured_json, transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    from public.sessions
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapSessionRow)
}

export async function createSession(userId: string, session: Session): Promise<void> {
  await execute(
    `
    insert into public.sessions (
      id, owner_user_id, client_id, trajectory_id, title, input_type, audio_upload_id, audio_duration_seconds, upload_file_name, transcript_text, summary_text, summary_structured_json,
      transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15, $16)
    on conflict (id) do update
      set client_id = excluded.client_id,
          trajectory_id = excluded.trajectory_id,
          title = excluded.title,
          input_type = excluded.input_type,
          audio_upload_id = excluded.audio_upload_id,
          audio_duration_seconds = excluded.audio_duration_seconds,
          upload_file_name = excluded.upload_file_name,
          transcript_text = excluded.transcript_text,
          summary_text = excluded.summary_text,
          summary_structured_json = excluded.summary_structured_json,
          transcription_status = excluded.transcription_status,
          transcription_error = excluded.transcription_error,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.sessions.owner_user_id = excluded.owner_user_id
        and excluded.updated_at_unix_ms >= public.sessions.updated_at_unix_ms
    `,
    [
      session.id,
      userId,
      session.clientId,
      session.trajectoryId,
      session.title,
      session.inputType,
      session.audioUploadId,
      session.audioDurationSeconds,
      session.uploadFileName,
      session.transcriptText,
      session.summaryText,
      session.summaryStructured ? JSON.stringify(session.summaryStructured) : null,
      session.transcriptionStatus,
      session.transcriptionError,
      session.createdAtUnixMs,
      session.updatedAtUnixMs,
    ],
  )
}

export async function updateSession(
  userId: string,
  params: {
    id: string
    clientId?: string | null
    trajectoryId?: string | null
    title?: string | null
    inputType?: Session["inputType"]
    createdAtUnixMs?: number
    audioUploadId?: string | null
    audioDurationSeconds?: number | null
    uploadFileName?: string | null
    transcriptText?: string | null
    summaryText?: string | null
    summaryStructured?: Session["summaryStructured"]
    transcriptionStatus?: Session["transcriptionStatus"]
    transcriptionError?: string | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (params.clientId !== undefined) {
    updates.push(`client_id = $${index++}`)
    values.push(params.clientId)
  }

  if (params.trajectoryId !== undefined) {
    updates.push(`trajectory_id = $${index++}`)
    values.push(params.trajectoryId)
  }

  if (typeof params.title === "string") {
    updates.push(`title = $${index++}`)
    values.push(params.title)
  }

  if (params.inputType !== undefined) {
    updates.push(`input_type = $${index++}`)
    values.push(params.inputType)
  }

  if (params.createdAtUnixMs !== undefined) {
    updates.push(`created_at_unix_ms = $${index++}`)
    values.push(params.createdAtUnixMs)
  }

  if (params.audioUploadId !== undefined) {
    updates.push(`audio_upload_id = $${index++}`)
    values.push(params.audioUploadId)
  }

  if (params.audioDurationSeconds !== undefined) {
    updates.push(`audio_duration_seconds = $${index++}`)
    values.push(params.audioDurationSeconds)
  }

  if (params.uploadFileName !== undefined) {
    updates.push(`upload_file_name = $${index++}`)
    values.push(params.uploadFileName)
  }

  if (params.transcriptText !== undefined) {
    updates.push(`transcript_text = $${index++}`)
    values.push(params.transcriptText)
  }

  if (params.summaryText !== undefined) {
    updates.push(`summary_text = $${index++}`)
    values.push(params.summaryText)
  }

  if (params.summaryStructured !== undefined) {
    updates.push(`summary_structured_json = $${index++}::jsonb`)
    values.push(params.summaryStructured ? JSON.stringify(params.summaryStructured) : null)
  }

  if (params.transcriptionStatus !== undefined) {
    updates.push(`transcription_status = $${index++}`)
    values.push(params.transcriptionStatus)
  }

  if (params.transcriptionError !== undefined) {
    updates.push(`transcription_error = $${index++}`)
    values.push(params.transcriptionError)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.sessions
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteSession(userId: string, id: string): Promise<void> {
  await execute(`delete from public.sessions where owner_user_id = $1 and id = $2`, [userId, id])
}
