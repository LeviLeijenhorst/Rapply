import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { Pool } from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverDir = path.resolve(__dirname, "..")

dotenv.config({ override: false, path: path.join(serverDir, ".env") })

// Intent: requireString
function requireString(name: string): string {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return trimmed
}

// Intent: readSqlFile
function readSqlFile(filePath: string): string {
  const sql = fs.readFileSync(filePath, "utf8")
  const trimmed = sql.trim()
  if (!trimmed) {
    throw new Error(`SQL file is empty: ${filePath}`)
  }
  return sql
}

function readDatabaseHostOrEmpty(databaseUrl: string): string {
  try {
    return String(new URL(databaseUrl).hostname || "").trim().toLowerCase()
  } catch {
    return ""
  }
}

function isLocalDatabaseHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1"
}

// Recreates the full database schema from migration files in a deterministic order.
async function main() {
  const databaseUrl = requireString("DATABASE_URL")
  const databaseSsl = String(process.env.DATABASE_SSL || "").trim() === "1"
  const runtimeEnvironment = String(process.env.NODE_ENV || "").trim().toLowerCase()
  const allowDbReset = String(process.env.ALLOW_DB_RESET || "").trim() === "1"
  const allowProductionReset = String(process.env.ALLOW_PRODUCTION_DB_RESET || "").trim() === "YES_I_UNDERSTAND"
  const allowNonLocalReset = String(process.env.ALLOW_NON_LOCAL_DB_RESET || "").trim() === "YES_I_UNDERSTAND"
  const databaseHost = readDatabaseHostOrEmpty(databaseUrl)

  if (runtimeEnvironment === "production" && !allowProductionReset) {
    throw new Error("Refusing to run init-db in production. Set ALLOW_PRODUCTION_DB_RESET=YES_I_UNDERSTAND to override.")
  }
  if (!isLocalDatabaseHost(databaseHost) && !allowDbReset && !allowNonLocalReset) {
    throw new Error(
      `Refusing to reset non-local database host: ${databaseHost || "unknown"}. ` +
        "Set ALLOW_DB_RESET=1 to override.",
    )
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseSsl ? { rejectUnauthorized: false } : undefined,
  })

  const sqlDir = path.resolve(__dirname, "..", "sql")
  const sqlFilesInOrder = [
    "001_init.sql",
    "002_entra_external_id.sql",
    "002_remove_transcript.sql",
    "003_app_data.sql",
    "004_audio_blobs.sql",
    "006_templates.sql",
    "007_audio_duration_seconds.sql",
    "008_audio_streams.sql",
    "009_practice_settings.sql",
    "011_e2ee_v2.sql",
    "012_e2ee_custody_mode.sql",
    "013_notes_title.sql",
    "014_contact_and_allowlist.sql",
    "017_manual_pricing.sql",
  ].map((name) =>
    path.join(sqlDir, name),
  )

  try {
    await pool.query("select 1")
    await pool.query("drop schema if exists public cascade; create schema public;")
    for (const filePath of sqlFilesInOrder) {
      const sql = readSqlFile(filePath)
      await pool.query(sql)
    }
  } finally {
    await pool.end()
  }
}

main().catch((e) => {
  const message = String((e as any)?.message || e || "")
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
