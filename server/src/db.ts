import { Pool } from "pg"
import { env } from "./env"

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

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

