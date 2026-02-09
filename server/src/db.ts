import { Pool } from "pg"
import { env } from "./env"

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

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

export async function testDatabaseConnection(): Promise<void> {
  await pool.query("select 1")
}

export async function queryOne<T>(text: string, values: unknown[]): Promise<T | null> {
  const result = await pool.query(text, values)
  if (!result.rows?.length) return null
  return result.rows[0] as T
}

export async function queryMany<T>(text: string, values: unknown[]): Promise<T[]> {
  const result = await pool.query(text, values)
  return (result.rows || []) as T[]
}

export async function execute(text: string, values: unknown[]): Promise<void> {
  await pool.query(text, values)
}

