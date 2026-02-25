import { execute } from "../../db"
import type { Session } from "../types"

// Creates or upserts one coaching session row.
export async function createSession(userId: string, session: Session): Promise<void> {
  await execute(
    `
    insert into public.coachee_sessions (
      id, user_id, coachee_id, title, kind, audio_blob_id, audio_duration_seconds, upload_file_name, transcript, summary,
      report_date, wvp_week_number, report_first_sick_day, transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    on conflict (id) do update
      set coachee_id = excluded.coachee_id,
          title = excluded.title,
          kind = excluded.kind,
          audio_blob_id = excluded.audio_blob_id,
          audio_duration_seconds = excluded.audio_duration_seconds,
          upload_file_name = excluded.upload_file_name,
          transcript = excluded.transcript,
          summary = excluded.summary,
          report_date = excluded.report_date,
          wvp_week_number = excluded.wvp_week_number,
          report_first_sick_day = excluded.report_first_sick_day,
          transcription_status = excluded.transcription_status,
          transcription_error = excluded.transcription_error,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.coachee_sessions.user_id = excluded.user_id
        and excluded.updated_at_unix_ms >= public.coachee_sessions.updated_at_unix_ms
    `,
    [
      session.id,
      userId,
      session.coacheeId,
      session.title,
      session.kind,
      session.audioBlobId,
      session.audioDurationSeconds,
      session.uploadFileName,
      session.transcript,
      session.summary,
      session.reportDate,
      session.wvpWeekNumber,
      session.reportFirstSickDay,
      session.transcriptionStatus,
      session.transcriptionError,
      session.createdAtUnixMs,
      session.updatedAtUnixMs,
    ],
  )
}

// Updates the mutable session fields provided by the caller.
export async function updateSession(
  userId: string,
  params: {
    id: string
    coacheeId?: string | null
    title?: string | null
    createdAtUnixMs?: number
    audioBlobId?: string | null
    audioDurationSeconds?: number | null
    uploadFileName?: string | null
    transcript?: string | null
    summary?: string | null
    reportDate?: string | null
    wvpWeekNumber?: string | null
    reportFirstSickDay?: string | null
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

  if (params.coacheeId !== undefined) {
    updates.push(`coachee_id = $${index++}`)
    values.push(params.coacheeId)
  }

  if (typeof params.title === "string") {
    updates.push(`title = $${index++}`)
    values.push(params.title)
  }

  if (params.createdAtUnixMs !== undefined) {
    updates.push(`created_at_unix_ms = $${index++}`)
    values.push(params.createdAtUnixMs)
  }

  if (params.audioBlobId !== undefined) {
    updates.push(`audio_blob_id = $${index++}`)
    values.push(params.audioBlobId)
  }

  if (params.audioDurationSeconds !== undefined) {
    updates.push(`audio_duration_seconds = $${index++}`)
    values.push(params.audioDurationSeconds)
  }

  if (params.uploadFileName !== undefined) {
    updates.push(`upload_file_name = $${index++}`)
    values.push(params.uploadFileName)
  }

  if (params.transcript !== undefined) {
    updates.push(`transcript = $${index++}`)
    values.push(params.transcript)
  }

  if (params.summary !== undefined) {
    updates.push(`summary = $${index++}`)
    values.push(params.summary)
  }

  if (params.reportDate !== undefined) {
    updates.push(`report_date = $${index++}`)
    values.push(params.reportDate)
  }

  if (params.wvpWeekNumber !== undefined) {
    updates.push(`wvp_week_number = $${index++}`)
    values.push(params.wvpWeekNumber)
  }

  if (params.reportFirstSickDay !== undefined) {
    updates.push(`report_first_sick_day = $${index++}`)
    values.push(params.reportFirstSickDay)
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
    update public.coachee_sessions
    set ${updates.join(", ")}
    where user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

// Permanently deletes one session owned by the user.
export async function deleteSession(userId: string, id: string): Promise<void> {
  await execute(`delete from public.coachee_sessions where user_id = $1 and id = $2`, [userId, id])
}

