import { assertUserCanAccessClient, isUserOrganizationAdmin, requireUserDefaultOrganizationId } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Session, SessionInputType } from "../types/Session"

type SessionRow = {
  id: string
  client_id: string | null
  trajectory_id: string | null
  title: string
  input_type: string
  source_text: string | null
  source_upload_id: string | null
  source_file_name: string | null
  source_mime_type: string | null
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
  if (value === "spoken_recap_recording") return "spoken_recap"
  if (value === "uploaded_document") return "uploaded_document"
  if (value === "intake") return "intake"
  return "recording"
}

function mapApiInputTypeToDbInputType(value: SessionInputType): string {
  if (value === "uploaded_audio") return "uploaded_audio"
  if (value === "written_recap") return "written_recap"
  if (value === "spoken_recap") return "spoken_recap_recording"
  if (value === "uploaded_document") return "uploaded_document"
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
    trajectoryId: row.trajectory_id,
    title: row.title,
    inputType: mapDbInputTypeToApiInputType(row.input_type),
    sourceText: row.source_text,
    sourceMimeType: row.source_mime_type,
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

async function readSessionAccessRow(sessionId: string): Promise<{
  client_id: string | null
  organization_id: string | null
  created_by_user_id: string | null
} | null> {
  return await queryOne<{
    client_id: string | null
    organization_id: string | null
    created_by_user_id: string | null
  }>(
    `
    select client_id, organization_id, created_by_user_id
    from public.inputs
    where id = $1
    limit 1
    `,
    [sessionId],
  )
}

export async function listSessions(userId: string): Promise<Session[]> {
  const rows = await queryMany<SessionRow>(
    `
    select
      i.id,
      i.client_id,
      i.trajectory_id,
      i.title,
      i.input_type,
      i.source_text,
      i.source_upload_id,
      i.source_file_name,
      i.source_mime_type,
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
    left join public.organization_users ou
      on ou.organization_id = i.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = i.client_id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
       or (i.client_id is null and ou.user_id is not null)
       or i.created_by_user_id = $1
    order by i.created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapSessionRow)
}

export async function createSession(userId: string, session: Session): Promise<void> {
  if (session.clientId) {
    await assertUserCanAccessClient(userId, session.clientId)
  }
  const fallbackOrganizationId = await requireUserDefaultOrganizationId(userId)
  const sourceUploadId = await resolveValidSourceUploadId({ userId, sourceUploadId: session.audioUploadId })

  await execute(
    `
    insert into public.inputs (
      id, client_id, organization_id, trajectory_id, created_by_user_id, input_type, title, source_text, source_upload_id, source_file_name, source_mime_type, processing_status, processing_error, created_at_unix_ms, updated_at_unix_ms
    )
    values (
      $1,
      $2,
      coalesce((select organization_id from public.clients where id = $2), $3),
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15
    )
    on conflict (id) do update
      set client_id = excluded.client_id,
          organization_id = excluded.organization_id,
          created_by_user_id = coalesce(public.inputs.created_by_user_id, excluded.created_by_user_id),
          trajectory_id = excluded.trajectory_id,
          input_type = excluded.input_type,
          title = excluded.title,
          source_text = excluded.source_text,
          source_upload_id = excluded.source_upload_id,
          source_file_name = excluded.source_file_name,
          source_mime_type = excluded.source_mime_type,
          processing_status = excluded.processing_status,
          processing_error = excluded.processing_error,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where excluded.updated_at_unix_ms >= public.inputs.updated_at_unix_ms
    `,
    [
      session.id,
      session.clientId,
      fallbackOrganizationId,
      session.trajectoryId,
      userId,
      mapApiInputTypeToDbInputType(session.inputType),
      session.title,
      session.sourceText,
      sourceUploadId,
      session.uploadFileName,
      session.sourceMimeType,
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
    sourceText?: string | null
    sourceMimeType?: string | null
    transcriptText?: string | null
    summaryText?: string | null
    summaryStructured?: Session["summaryStructured"]
    transcriptionStatus?: Session["transcriptionStatus"]
    transcriptionError?: string | null
    updatedAtUnixMs: number
  },
): Promise<void> {
  const accessRow = await readSessionAccessRow(params.id)
  if (!accessRow) return
  if (accessRow.client_id) {
    await assertUserCanAccessClient(userId, accessRow.client_id)
  } else if (accessRow.created_by_user_id !== userId) {
    if (!accessRow.organization_id || !(await isUserOrganizationAdmin(userId, accessRow.organization_id))) {
      const error: any = new Error("Forbidden")
      error.status = 403
      throw error as Error
    }
  }
  if (params.clientId) {
    await assertUserCanAccessClient(userId, params.clientId)
  }

  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (params.clientId !== undefined) {
    const clientIdParamIndex = index
    updates.push(`client_id = $${index++}`)
    values.push(params.clientId)
    const fallbackOrganizationId = await requireUserDefaultOrganizationId(userId)
    updates.push(`organization_id = coalesce((select organization_id from public.clients where id = $${clientIdParamIndex}), $${index++})`)
    values.push(fallbackOrganizationId)
  }
  if (typeof params.title === "string") {
    updates.push(`title = $${index++}`)
    values.push(params.title)
  }
  if (params.trajectoryId !== undefined) {
    updates.push(`trajectory_id = $${index++}`)
    values.push(params.trajectoryId)
  }
  if (params.inputType !== undefined) {
    updates.push(`input_type = $${index++}`)
    values.push(mapApiInputTypeToDbInputType(params.inputType))
  }
  if (params.sourceText !== undefined) {
    updates.push(`source_text = $${index++}`)
    values.push(params.sourceText)
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
  if (params.sourceMimeType !== undefined) {
    updates.push(`source_mime_type = $${index++}`)
    values.push(params.sourceMimeType)
  }
  if (params.transcriptionStatus !== undefined) {
    updates.push(`processing_status = $${index++}`)
    values.push(mapApiStatusToProcessingStatus(params.transcriptionStatus))
  }
  if (params.transcriptionError !== undefined) {
    updates.push(`processing_error = $${index++}`)
    values.push(params.transcriptionError)
  }

  values.push(params.id)
  await execute(
    `
    update public.inputs
    set ${updates.join(", ")}
    where id = $${index}
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
  const accessRow = await readSessionAccessRow(id)
  if (!accessRow) return
  if (accessRow.client_id) {
    await assertUserCanAccessClient(userId, accessRow.client_id)
  } else if (accessRow.created_by_user_id !== userId) {
    if (!accessRow.organization_id || !(await isUserOrganizationAdmin(userId, accessRow.organization_id))) {
      const error: any = new Error("Forbidden")
      error.status = 403
      throw error as Error
    }
  }
  await execute(`delete from public.inputs where id = $1`, [id])
}

