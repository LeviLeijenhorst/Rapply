import { execute } from "../../db"
import type { Report } from "../types"

// Creates or updates one report row.
export async function upsertReport(userId: string, report: Report): Promise<void> {
  await execute(
    `
    insert into public.reports (
      id, owner_user_id, client_id, trajectory_id, source_session_id, title, report_type, state, report_text,
      report_date, first_sick_day, wvp_week_number, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    on conflict (id) do update
      set client_id = excluded.client_id,
          trajectory_id = excluded.trajectory_id,
          source_session_id = excluded.source_session_id,
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
      report.clientId,
      report.trajectoryId,
      report.sourceSessionId,
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

