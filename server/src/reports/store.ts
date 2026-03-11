import { execute, queryMany, queryOne } from "../db"
import type { Report } from "../types/Report"

type ReportRow = {
  id: string
  client_id: string | null
  source_input_id: string | null
  title: string
  report_type: string
  state: "incomplete" | "needs_review" | "complete"
  report_text: string
  report_date: string | null
  first_sick_day: string | null
  wvp_week_number: string | null
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

// Maps a database row to the report shape used by the server.
function mapReportRowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    clientId: row.client_id,
    trajectoryId: null,
    sourceSessionId: row.source_input_id,
    title: row.title,
    reportType: row.report_type,
    state: row.state,
    reportText: row.report_text,
    reportDate: row.report_date,
    firstSickDay: row.first_sick_day,
    wvpWeekNumber: row.wvp_week_number,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

// Lists the current user's reports in most-recently-updated order.
export async function listReports(userId: string): Promise<Report[]> {
  const rows = await queryMany<ReportRow>(
    `
    select id, client_id, source_input_id, title, report_type, state, report_text, report_date, first_sick_day, wvp_week_number, created_at_unix_ms, updated_at_unix_ms
    from public.reports
    where owner_user_id = $1
    order by updated_at_unix_ms desc
    `,
    [userId],
  )

  return rows.map(mapReportRowToReport)
}

// Inserts or updates a report owned by the current user.
export async function saveReport(userId: string, report: Report): Promise<void> {
  let sourceInputId: string | null = report.sourceSessionId
  let clientId: string | null = report.clientId
  if (sourceInputId) {
    const input = await queryOne<{ id: string; client_id: string | null }>(
      `
      select id, client_id
      from public.inputs
      where id = $1 and owner_user_id = $2
      limit 1
      `,
      [sourceInputId, userId],
    )
    if (!input?.id) {
      sourceInputId = null
    } else if (!clientId && input.client_id) {
      clientId = input.client_id
    }
  }

  await execute(
    `
    insert into public.reports (
      id, owner_user_id, client_id, source_input_id, title, report_type, state, report_text,
      report_date, first_sick_day, wvp_week_number, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    on conflict (id) do update
      set client_id = excluded.client_id,
          source_input_id = excluded.source_input_id,
          title = excluded.title,
          report_type = excluded.report_type,
          state = excluded.state,
          report_text = excluded.report_text,
          report_date = excluded.report_date,
          first_sick_day = excluded.first_sick_day,
          wvp_week_number = excluded.wvp_week_number,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      report.id,
      userId,
      clientId,
      sourceInputId,
      report.title,
      report.reportType,
      report.state,
      report.reportText,
      report.reportDate,
      report.firstSickDay,
      report.wvpWeekNumber,
      report.createdAtUnixMs,
      report.updatedAtUnixMs,
    ],
  )
}
