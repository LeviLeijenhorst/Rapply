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
        ('users','id'),
        ('users','entra_user_id'),
        ('users','email'),
        ('users','display_name'),
        ('users','role'),
        ('clients','id'),
        ('clients','name'),
        ('clients','client_details'),
        ('clients','employer_details'),
        ('clients','trajectory_start_date'),
        ('clients','trajectory_end_date'),
        ('clients','created_at_unix_ms'),
        ('clients','updated_at_unix_ms'),
        ('clients','is_archived'),
        ('inputs','id'),
        ('inputs','client_id'),
        ('inputs','title'),
        ('inputs','input_type'),
        ('inputs','source_upload_id'),
        ('inputs','source_file_name'),
        ('inputs','processing_status'),
        ('inputs','processing_error'),
        ('inputs','created_at_unix_ms'),
        ('inputs','updated_at_unix_ms'),
        ('input_transcripts','input_id'),
        ('input_transcripts','transcript_text'),
        ('input_summaries','input_id'),
        ('input_summaries','summary_text'),
        ('notes','id'),
        ('notes','input_id'),
        ('notes','title'),
        ('notes','text'),
        ('notes','created_at_unix_ms'),
        ('notes','updated_at_unix_ms'),
        ('reports','id'),
        ('reports','source_input_id'),
        ('reports','report_text'),
        ('reports','updated_at_unix_ms'),
        ('templates','id'),
        ('templates','name'),
        ('templates','sections_json'),
        ('templates','is_saved'),
        ('templates','created_at_unix_ms'),
        ('templates','updated_at_unix_ms'),
        ('organizations','name'),
        ('organizations','visit_street'),
        ('organizations','visit_house_number'),
        ('organizations','visit_city'),
        ('organizations','visit_postal_code'),
        ('organizations','postal_street'),
        ('organizations','postal_house_number'),
        ('organizations','postal_city'),
        ('organizations','postal_code'),
        ('organizations','contact_name'),
        ('organizations','contact_role'),
        ('organizations','contact_phone'),
        ('organizations','contact_email'),
        ('organizations','updated_at_unix_ms')
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

