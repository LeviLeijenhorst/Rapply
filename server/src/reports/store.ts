import { assertUserCanAccessClient } from "../access/clientAccess"
import { execute, queryMany, queryOne } from "../db"
import type { Report } from "../types/Report"

type ReportRow = {
  id: string
  client_id: string | null
  trajectory_id: string | null
  source_input_id: string | null
  created_by_user_id: string | null
  primary_author_user_id: string | null
  title: string
  report_type: string
  state: "incomplete" | "needs_review" | "complete"
  report_text: string
  report_structured_json: unknown | null
  report_date: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

type ReportCoachRow = {
  report_id: string
  user_id: string
  display_name: string | null
  email: string | null
}

function mapReportRowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: row.trajectory_id,
    sourceSessionId: row.source_input_id,
    createdByUserId: row.created_by_user_id,
    primaryAuthorUserId: row.primary_author_user_id,
    title: row.title,
    reportType: row.report_type,
    state: row.state,
    reportText: row.report_text,
    reportStructuredJson: row.report_structured_json && typeof row.report_structured_json === "object" ? (row.report_structured_json as Report["reportStructuredJson"]) : null,
    reportDate: row.report_date,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

async function readReportCoaches(reportIds: string[]): Promise<Map<string, Report["reportCoaches"]>> {
  if (reportIds.length === 0) return new Map()
  const rows = await queryMany<ReportCoachRow>(
    `
    select
      rc.report_id,
      rc.user_id,
      u.display_name,
      u.email
    from public.report_coaches rc
    join public.users u on u.id = rc.user_id
    where rc.report_id = any($1::text[])
    order by rc.created_at_unix_ms asc
    `,
    [reportIds],
  )
  const map = new Map<string, Report["reportCoaches"]>()
  for (const row of rows) {
    const next = map.get(row.report_id) || []
    next.push({
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
    })
    map.set(row.report_id, next)
  }
  return map
}

async function readReportClientId(reportId: string): Promise<string | null> {
  const row = await queryOne<{ client_id: string | null }>(
    `
    select client_id
    from public.reports
    where id = $1
    limit 1
    `,
    [reportId],
  )
  return row?.client_id ?? null
}

async function readDefaultCoachUserIdsForClient(clientId: string): Promise<string[]> {
  const rows = await queryMany<{ user_id: string }>(
    `
    select user_id
    from public.client_assignments
    where client_id = $1
    order by created_at_unix_ms asc
    `,
    [clientId],
  )
  return rows.map((row) => row.user_id)
}

async function replaceReportCoaches(reportId: string, userIds: string[], createdAtUnixMs: number): Promise<void> {
  await execute(`delete from public.report_coaches where report_id = $1`, [reportId])
  for (const userId of userIds) {
    await execute(
      `
      insert into public.report_coaches (report_id, user_id, created_at_unix_ms)
      values ($1, $2, $3)
      on conflict (report_id, user_id) do nothing
      `,
      [reportId, userId, createdAtUnixMs],
    )
  }
}

export async function listReports(userId: string): Promise<Report[]> {
  const rows = await queryMany<ReportRow>(
    `
    select
      r.id,
      r.client_id,
      r.trajectory_id,
      r.source_input_id,
      r.created_by_user_id,
      r.primary_author_user_id,
      r.title,
      r.report_type,
      r.state,
      r.report_text,
      r.report_structured_json,
      r.report_date,
      r.created_at_unix_ms,
      r.updated_at_unix_ms
    from public.reports r
    join public.clients c on c.id = r.client_id
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
    order by r.updated_at_unix_ms desc
    `,
    [userId],
  )
  const reports = rows.map(mapReportRowToReport)
  const coachMap = await readReportCoaches(reports.map((report) => report.id))
  return reports.map((report) => {
    const reportCoaches = coachMap.get(report.id) || []
    return {
      ...report,
      reportCoaches,
      reportCoachUserIds: reportCoaches.map((coach) => coach.userId),
    }
  })
}

export async function saveReport(userId: string, report: Report): Promise<void> {
  let sourceInputId: string | null = report.sourceSessionId
  let clientId: string | null = report.clientId
  if (sourceInputId) {
    const input = await queryOne<{ id: string; client_id: string | null }>(
      `
      select id, client_id
      from public.inputs
      where id = $1
      limit 1
      `,
      [sourceInputId],
    )
    if (!input?.id) {
      sourceInputId = null
    } else if (!clientId && input.client_id) {
      clientId = input.client_id
    }
  }
  if (!clientId) {
    const error: any = new Error("Report must include clientId")
    error.status = 400
    throw error as Error
  }
  await assertUserCanAccessClient(userId, clientId)

  const existing = await queryOne<{ id: string }>(`select id from public.reports where id = $1 limit 1`, [report.id])
  await execute(
    `
    insert into public.reports (
      id, client_id, trajectory_id, source_input_id, created_by_user_id, primary_author_user_id, title, report_type, state, report_text, report_structured_json,
      report_date, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14)
    on conflict (id) do update
      set client_id = excluded.client_id,
          trajectory_id = excluded.trajectory_id,
          source_input_id = excluded.source_input_id,
          primary_author_user_id = excluded.primary_author_user_id,
          title = excluded.title,
          report_type = excluded.report_type,
          state = excluded.state,
          report_text = excluded.report_text,
          report_structured_json = excluded.report_structured_json,
          report_date = excluded.report_date,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      report.id,
      clientId,
      report.trajectoryId,
      sourceInputId,
      existing?.id ? report.createdByUserId ?? userId : userId,
      report.primaryAuthorUserId ?? userId,
      report.title,
      report.reportType,
      report.state,
      report.reportText,
      report.reportStructuredJson ? JSON.stringify(report.reportStructuredJson) : null,
      report.reportDate,
      report.createdAtUnixMs,
      report.updatedAtUnixMs,
    ],
  )

  const reportCoachUserIds =
    report.reportCoachUserIds && report.reportCoachUserIds.length > 0
      ? report.reportCoachUserIds
      : existing?.id
        ? undefined
        : await readDefaultCoachUserIdsForClient(clientId)
  if (reportCoachUserIds) {
    await replaceReportCoaches(report.id, reportCoachUserIds, report.updatedAtUnixMs || Date.now())
  }
}

export async function readLatestReportIdByInput(userId: string, inputId: string): Promise<string | null> {
  const row = await queryOne<{ id: string; client_id: string }>(
    `
    select r.id, r.client_id
    from public.reports r
    where r.source_input_id = $1
    order by r.updated_at_unix_ms desc
    limit 1
    `,
    [inputId],
  )
  if (!row?.id) return null
  await assertUserCanAccessClient(userId, row.client_id)
  return row.id
}

export async function updateReportCoaches(userId: string, params: { reportId: string; coachUserIds: string[]; updatedAtUnixMs: number }): Promise<void> {
  const clientId = await readReportClientId(params.reportId)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)
  await replaceReportCoaches(params.reportId, params.coachUserIds, params.updatedAtUnixMs)
}

export async function deleteReport(userId: string, reportId: string): Promise<void> {
  const clientId = await readReportClientId(reportId)
  if (!clientId) return
  await assertUserCanAccessClient(userId, clientId)
  await execute(`delete from public.report_coaches where report_id = $1`, [reportId])
  await execute(`delete from public.reports where id = $1`, [reportId])
}
