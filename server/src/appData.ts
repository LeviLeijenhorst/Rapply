import { execute, queryMany } from "./db"

export type Coachee = {
  id: string
  name: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  isArchived: boolean
}

export type SessionKind = "recording" | "upload" | "written" | "notes"

export type Session = {
  id: string
  coacheeId: string | null
  title: string
  kind: SessionKind
  audioBlobId: string | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
  transcriptionStatus: "idle" | "transcribing" | "generating" | "done" | "error"
  transcriptionError: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type Note = {
  id: string
  sessionId: string
  text: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
}

export type WrittenReport = {
  sessionId: string
  text: string
  updatedAtUnixMs: number
}

export type AppData = {
  coachees: Coachee[]
  sessions: Session[]
  notes: Note[]
  writtenReports: WrittenReport[]
}

export async function readAppData(userId: string): Promise<AppData> {
  const coachees = await queryMany<{
    id: string
    name: string
    created_at_unix_ms: number
    updated_at_unix_ms: number
    is_archived: boolean
  }>(
    `
    select id, name, created_at_unix_ms, updated_at_unix_ms, is_archived
    from public.coachees
    where user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const sessions = await queryMany<{
    id: string
    coachee_id: string | null
    title: string
    kind: SessionKind
    audio_blob_id: string | null
    upload_file_name: string | null
    transcript: string | null
    summary: string | null
    transcription_status: Session["transcriptionStatus"]
    transcription_error: string | null
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, coachee_id, title, kind, audio_blob_id, upload_file_name, transcript, summary, transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    from public.coachee_sessions
    where user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const notes = await queryMany<{
    id: string
    session_id: string
    text: string
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, session_id, text, created_at_unix_ms, updated_at_unix_ms
    from public.session_notes
    where user_id = $1
    order by updated_at_unix_ms desc
    `,
    [userId],
  )

  const writtenReports = await queryMany<{
    session_id: string
    text: string
    updated_at_unix_ms: number
  }>(
    `
    select session_id, text, updated_at_unix_ms
    from public.session_written_reports
    where user_id = $1
    `,
    [userId],
  )

  return {
    coachees: coachees.map((row) => ({
      id: row.id,
      name: row.name,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
      isArchived: row.is_archived,
    })),
    sessions: sessions.map((row) => ({
      id: row.id,
      coacheeId: row.coachee_id,
      title: row.title,
      kind: row.kind,
      audioBlobId: row.audio_blob_id,
      uploadFileName: row.upload_file_name,
      transcript: row.transcript,
      summary: row.summary,
      transcriptionStatus: row.transcription_status,
      transcriptionError: row.transcription_error,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    notes: notes.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      text: row.text,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    writtenReports: writtenReports.map((row) => ({
      sessionId: row.session_id,
      text: row.text,
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
  }
}

export async function createCoachee(userId: string, coachee: Coachee): Promise<void> {
  await execute(
    `
    insert into public.coachees (id, user_id, name, created_at_unix_ms, updated_at_unix_ms, is_archived)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (id) do update
      set name = excluded.name,
          updated_at_unix_ms = excluded.updated_at_unix_ms,
          is_archived = excluded.is_archived
    `,
    [coachee.id, userId, coachee.name, coachee.createdAtUnixMs, coachee.updatedAtUnixMs, coachee.isArchived],
  )
}

export async function updateCoachee(userId: string, params: { id: string; name?: string | null; isArchived?: boolean; updatedAtUnixMs: number }): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(params.updatedAtUnixMs)

  if (typeof params.name === "string") {
    updates.push(`name = $${index++}`)
    values.push(params.name)
  }

  if (typeof params.isArchived === "boolean") {
    updates.push(`is_archived = $${index++}`)
    values.push(params.isArchived)
  }

  values.push(userId)
  values.push(params.id)

  await execute(
    `
    update public.coachees
    set ${updates.join(", ")}
    where user_id = $${index++} and id = $${index}
    `,
    values,
  )
}

export async function deleteCoachee(userId: string, id: string): Promise<void> {
  await execute(`delete from public.coachees where user_id = $1 and id = $2`, [userId, id])
}

export async function createSession(userId: string, session: Session): Promise<void> {
  await execute(
    `
    insert into public.coachee_sessions (
      id, user_id, coachee_id, title, kind, audio_blob_id, upload_file_name, transcript, summary,
      transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    on conflict (id) do update
      set coachee_id = excluded.coachee_id,
          title = excluded.title,
          kind = excluded.kind,
          audio_blob_id = excluded.audio_blob_id,
          upload_file_name = excluded.upload_file_name,
          transcript = excluded.transcript,
          summary = excluded.summary,
          transcription_status = excluded.transcription_status,
          transcription_error = excluded.transcription_error,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      session.id,
      userId,
      session.coacheeId,
      session.title,
      session.kind,
      session.audioBlobId,
      session.uploadFileName,
      session.transcript,
      session.summary,
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
    coacheeId?: string | null
    title?: string | null
    transcript?: string | null
    summary?: string | null
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

  if (params.transcript !== undefined) {
    updates.push(`transcript = $${index++}`)
    values.push(params.transcript)
  }

  if (params.summary !== undefined) {
    updates.push(`summary = $${index++}`)
    values.push(params.summary)
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

export async function deleteSession(userId: string, id: string): Promise<void> {
  await execute(`delete from public.coachee_sessions where user_id = $1 and id = $2`, [userId, id])
}

export async function createNote(userId: string, note: Note): Promise<void> {
  await execute(
    `
    insert into public.session_notes (id, user_id, session_id, text, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (id) do update
      set text = excluded.text,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [note.id, userId, note.sessionId, note.text, note.createdAtUnixMs, note.updatedAtUnixMs],
  )
}

export async function updateNote(userId: string, params: { id: string; text: string; updatedAtUnixMs: number }): Promise<void> {
  await execute(
    `
    update public.session_notes
    set text = $1, updated_at_unix_ms = $2
    where user_id = $3 and id = $4
    `,
    [params.text, params.updatedAtUnixMs, userId, params.id],
  )
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await execute(`delete from public.session_notes where user_id = $1 and id = $2`, [userId, id])
}

export async function setWrittenReport(userId: string, report: WrittenReport): Promise<void> {
  await execute(
    `
    insert into public.session_written_reports (session_id, user_id, text, updated_at_unix_ms)
    values ($1, $2, $3, $4)
    on conflict (session_id) do update
      set text = excluded.text,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [report.sessionId, userId, report.text, report.updatedAtUnixMs],
  )
}
