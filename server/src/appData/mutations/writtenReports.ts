import { execute } from "../../db"
import type { WrittenReport } from "../types"

// Creates or updates the written report for one session.
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

