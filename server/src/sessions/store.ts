import { execute, queryMany, queryOne } from "../db"
import type { Session, SessionInputType } from "../types/Session"

type SessionRow = {
  id: string
  client_id: string | null
  title: string
  input_type: string
  source_upload_id: string | null
  source_file_name: string | null
  transcript_text: string | null
  summary_text: string | null
  summary_structured_json: unknown | null
  processing_status: "idle" | "transcribing" | "summarizing" | "done" | "error"
  processing_error: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

function mapSummaryStructured(value: unknown): Session["summaryStructured"] {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>
  const read = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = String(payload[key] || "").trim()
      if (candidate) return candidate
    }
    return ""
  }
  return {
    doelstelling: read("doelstelling", "kernpunten"),
    belastbaarheid: read("belastbaarheid", "situatie"),
    belemmeringen: read("belemmeringen", "aandachtspunten"),
    voortgang: read("voortgang", "afspraken"),
    arbeidsmarktorientatie: read("arbeidsmarktorientatie", "arbeidsorientatie", "vervolg"),
  }
}

function mapDbInputTypeToApiInputType(value: string): SessionInputType {
  if (value === "uploaded_audio") return "uploaded_audio"
  if (value === "written_recap") return "written_recap"
  if (value === "spoken_recap_recording") return "intake"
  return "recording"
}

function mapApiInputTypeToDbInputType(value: SessionInputType): string {
  if (value === "uploaded_audio") return "uploaded_audio"
  if (value === "written_recap") return "written_recap"
  if (value === "intake") return "spoken_recap_recording"
  return "full_audio_recording"
}

function mapProcessingStatusToApiStatus(value: SessionRow["processing_status"]): Session["transcriptionStatus"] {
  if (value === "idle" || value === "transcribing") return value
  if (value === "summarizing") return "generating"
  if (value === "done") return "done"
  return "error"
}

function mapApiStatusToProcessingStatus(value: Session["transcriptionStatus"]): SessionRow["processing_status"] {
  if (value === "idle" || value === "transcribing") return value
  if (value === "generating") return "summarizing"
  if (value === "done") return "done"
  return "error"
}

function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: null,
    title: row.title,
    inputType: mapDbInputTypeToApiInputType(row.input_type),
    audioUploadId: row.source_upload_id,
    audioDurationSeconds: null,
    uploadFileName: row.source_file_name,
    transcriptText: row.transcript_text,
    summaryText: row.summary_text,
    summaryStructured: mapSummaryStructured(row.summary_structured_json),
    transcriptionStatus: mapProcessingStatusToApiStatus(row.processing_status),
    transcriptionError: row.processing_error,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

async function resolveValidSourceUploadId(params: { userId: string; sourceUploadId: string | null | undefined }): Promise<string | null> {
  const candidate = typeof params.sourceUploadId === "string" ? params.sourceUploadId.trim() : ""
  if (!candidate) return null
  const row = await queryOne<{ id: string }>(
    `
    select id
    from public.audio_uploads
    where id = $1 and owner_user_id = $2
    limit 1
    `,
    [candidate, params.userId],
  )
  return row?.id ?? null
}

export async function listSessions(userId: string): Promise<Session[]> {
  const rows = await queryMany<SessionRow>(
    `
    select
      i.id,
      i.client_id,
      i.title,
      i.input_type,
      i.source_upload_id,
      i.source_file_name,
      t.transcript_text,
      s.summary_text,
      s.summary_structured_json,
      i.processing_status,
      i.processing_error,
      i.created_at_unix_ms,
      i.updated_at_unix_ms
    from public.inputs i
    left join public.input_transcripts t on t.input_id = i.id
    left join public.input_summaries s on s.input_id = i.id
    where i.owner_user_id = $1
    order by i.created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapSessionRow)
}

export async function createSession(userId: string, session: Session): Promise<void> {
  const sourceUploadId = await resolveValidSourceUploadId({ userId, sourceUploadId: session.audioUploadId })

  await execute(
    `
    insert into public.inputs (
      id, client_id, owner_user_id, input_type, title, source_upload_id, source_file_name, processing_status, processing_error, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    on conflict (id) do update
      set client_id = excluded.client_id,
          title = excluded.title,
          input_type = excluded.input_type,
          source_upload_id = excluded.source_upload_id,
          source_file_name = excluded.source_file_name,
          processing_status = excluded.processing_status,
          processing_error = excluded.processing_error,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.inputs.owner_user_id = excluded.owner_user_id
        and excluded.updated_at_unix_ms >= public.inputs.updated_at_unix_ms
    `,
    [
      session.id,
      session.clientId,
      userId,
      mapApiInputTypeToDbInputType(session.inputType),
      session.title,
      sourceUploadId,
      session.uploadFileName,
      mapApiStatusToProcessingStatus(session.transcriptionStatus),
      session.transcriptionError,
      session.createdAtUnixMs,
      session.updatedAtUnixMs,
    ],
  )

  if (session.transcriptText !== null) {
    await execute(
      `
      insert into public.input_transcripts (input_id, transcript_text, created_at_unix_ms, updated_at_unix_ms)
      values ($1, $2, $3, $4)
      on conflict (input_id) do update
        set transcript_text = excluded.transcript_text,
            updated_at_unix_ms = excluded.updated_at_unix_ms
      `,
      [session.id, session.transcriptText ?? "", session.createdAtUnixMs, session.updatedAtUnixMs],
    )
  }

  if (session.summaryText !== null || session.summaryStructured !== null) {
    await execute(
      `
      insert into public.input_summaries (input_id, summary_text, summary_structured_json, created_at_unix_ms, updated_at_unix_ms)
      values ($1, $2, $3::jsonb, $4, $5)
      on conflict (input_id) do update
        set summary_text = excluded.summary_text,
            summary_structured_json = excluded.summary_structured_json,
            updated_at_unix_ms = excluded.updated_at_unix_ms
      `,
      [
        session.id,
        session.summaryText ?? "",
        session.summaryStructured ? JSON.stringify(session.summaryStructured) : null,
        session.createdAtUnixMs,
        session.updatedAtUnixMs,
      ],
    )
  }
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
  if (typeof params.title === "string") {
    updates.push(`title = $${index++}`)
    values.push(params.title)
  }
  if (params.inputType !== undefined) {
    updates.push(`input_type = $${index++}`)
    values.push(mapApiInputTypeToDbInputType(params.inputType))
  }
  if (params.audioUploadId !== undefined) {
    const resolvedSourceUploadId = await resolveValidSourceUploadId({ userId, sourceUploadId: params.audioUploadId })
    updates.push(`source_upload_id = $${index++}`)
    values.push(resolvedSourceUploadId)
  }
  if (params.uploadFileName !== undefined) {
    updates.push(`source_file_name = $${index++}`)
    values.push(params.uploadFileName)
  }
  if (params.transcriptionStatus !== undefined) {
    updates.push(`processing_status = $${index++}`)
    values.push(mapApiStatusToProcessingStatus(params.transcriptionStatus))
  }
  if (params.transcriptionError !== undefined) {
    updates.push(`processing_error = $${index++}`)
    values.push(params.transcriptionError)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.inputs
    set ${updates.join(", ")}
    where owner_user_id = $${index++} and id = $${index}
    `,
    values,
  )

  if (params.transcriptText !== undefined) {
    await execute(
      `
      insert into public.input_transcripts (input_id, transcript_text, created_at_unix_ms, updated_at_unix_ms)
      values ($1, $2, $3, $3)
      on conflict (input_id) do update
        set transcript_text = excluded.transcript_text,
            updated_at_unix_ms = excluded.updated_at_unix_ms
      `,
      [params.id, params.transcriptText ?? "", params.updatedAtUnixMs],
    )
  }

  if (params.summaryText !== undefined || params.summaryStructured !== undefined) {
    await execute(
      `
      insert into public.input_summaries (input_id, summary_text, summary_structured_json, created_at_unix_ms, updated_at_unix_ms)
      values ($1, $2, $3::jsonb, $4, $4)
      on conflict (input_id) do update
        set summary_text = coalesce(excluded.summary_text, public.input_summaries.summary_text),
            summary_structured_json = excluded.summary_structured_json,
            updated_at_unix_ms = excluded.updated_at_unix_ms
      `,
      [params.id, params.summaryText ?? "", params.summaryStructured ? JSON.stringify(params.summaryStructured) : null, params.updatedAtUnixMs],
    )
  }
}

export async function deleteSession(userId: string, id: string): Promise<void> {
  await execute(`delete from public.inputs where owner_user_id = $1 and id = $2`, [userId, id])
}
