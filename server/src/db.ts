import { Pool } from "pg"
import { env } from "./env"

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

type MissingSchemaColumn = {
  tableName: string
  columnName: string
}

type RequiredSchemaCheckStatus = {
  checkedAtUnixMs: number | null
  missingRequiredColumns: string[]
}

const requiredSchemaCheckStatus: RequiredSchemaCheckStatus = {
  checkedAtUnixMs: null,
  missingRequiredColumns: [],
}

// Intent: getDatabaseConnectionInfo
export function getDatabaseConnectionInfo(): { host: string; port: string; database: string; ssl: "on" | "off"; safeUrl: string } {
  const ssl = env.databaseSsl ? "on" : "off"
  try {
    const parsed = new URL(env.databaseUrl)
    const host = parsed.hostname || ""
    const port = parsed.port || "5432"
    const database = String(parsed.pathname || "").replace(/^\//, "")
    const safeUrl = new URL(parsed.toString())
    if (safeUrl.username) safeUrl.username = "redacted"
    if (safeUrl.password) safeUrl.password = "redacted"
    return { host, port, database, ssl, safeUrl: safeUrl.toString() }
  } catch {
    return { host: "", port: "", database: "", ssl, safeUrl: "invalid" }
  }
}

// Intent: testDatabaseConnection
export async function testDatabaseConnection(): Promise<void> {
  await pool.query("select 1")
}

// Intent: runRequiredSchemaCheck
export async function runRequiredSchemaCheck(): Promise<{ missing: MissingSchemaColumn[] }> {
  const result = await pool.query<{ table_name: string; column_name: string }>(`
    with expected(table_name, column_name) as (
      values
        ('clients','id'),
        ('clients','name'),
        ('clients','client_details'),
        ('clients','employer_details'),
        ('clients','first_sick_day'),
        ('clients','created_at_unix_ms'),
        ('clients','updated_at_unix_ms'),
        ('clients','is_archived'),
        ('sessions','id'),
        ('sessions','client_id'),
        ('sessions','title'),
        ('sessions','input_type'),
        ('sessions','audio_upload_id'),
        ('sessions','audio_duration_seconds'),
        ('sessions','upload_file_name'),
        ('sessions','transcript_text'),
        ('sessions','summary_text'),
        ('sessions','transcription_status'),
        ('sessions','transcription_error'),
        ('sessions','created_at_unix_ms'),
        ('sessions','updated_at_unix_ms'),
        ('session_notes','id'),
        ('session_notes','session_id'),
        ('session_notes','title'),
        ('session_notes','text'),
        ('session_notes','created_at_unix_ms'),
        ('session_notes','updated_at_unix_ms'),
        ('reports','id'),
        ('reports','report_text'),
        ('reports','updated_at_unix_ms'),
        ('templates','id'),
        ('templates','name'),
        ('templates','sections_json'),
        ('templates','is_saved'),
        ('templates','created_at_unix_ms'),
        ('templates','updated_at_unix_ms'),
        ('practice_settings','practice_name'),
        ('practice_settings','website'),
        ('practice_settings','visit_address'),
        ('practice_settings','postal_address'),
        ('practice_settings','postal_code_city'),
        ('practice_settings','contact_name'),
        ('practice_settings','contact_role'),
        ('practice_settings','contact_phone'),
        ('practice_settings','contact_email'),
        ('practice_settings','tint_color'),
        ('practice_settings','logo_data_url'),
        ('practice_settings','updated_at_unix_ms')
    )
    select e.table_name, e.column_name
    from expected e
    left join information_schema.columns c
      on c.table_schema = 'public'
     and c.table_name = e.table_name
     and c.column_name = e.column_name
    where c.column_name is null
    order by e.table_name, e.column_name
  `)

  const missing = (result.rows || []).map((row) => ({
    tableName: String(row.table_name || ""),
    columnName: String(row.column_name || ""),
  }))

  requiredSchemaCheckStatus.checkedAtUnixMs = Date.now()
  requiredSchemaCheckStatus.missingRequiredColumns = missing.map((item) => `${item.tableName}.${item.columnName}`)
  return { missing }
}

// Intent: getRequiredSchemaCheckStatus
export function getRequiredSchemaCheckStatus(): RequiredSchemaCheckStatus {
  return {
    checkedAtUnixMs: requiredSchemaCheckStatus.checkedAtUnixMs,
    missingRequiredColumns: [...requiredSchemaCheckStatus.missingRequiredColumns],
  }
}

// Intent: queryOne
export async function queryOne<T>(text: string, values: unknown[]): Promise<T | null> {
  const result = await pool.query(text, values)
  if (!result.rows?.length) return null
  return result.rows[0] as T
}

// Intent: queryMany
export async function queryMany<T>(text: string, values: unknown[]): Promise<T[]> {
  const result = await pool.query(text, values)
  return (result.rows || []) as T[]
}

// Intent: execute
export async function execute(text: string, values: unknown[]): Promise<void> {
  await pool.query(text, values)
}

