import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { Pool } from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverDir = path.resolve(__dirname, "..")

dotenv.config({ override: false, path: path.join(serverDir, ".env") })

function requireString(name: string): string {
  const value = process.env[name]
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return trimmed
}

function readSqlFile(filePath: string): string {
  const sql = fs.readFileSync(filePath, "utf8")
  const trimmed = sql.trim()
  if (!trimmed) {
    throw new Error(`SQL file is empty: ${filePath}`)
  }
  return sql
}

async function main() {
  const databaseUrl = requireString("DATABASE_URL")
  const databaseSsl = String(process.env.DATABASE_SSL || "").trim() === "1"

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
    "005_e2ee.sql",
    "006_templates.sql",
    "007_audio_duration_seconds.sql",
    "008_audio_streams.sql",
    "009_practice_settings.sql",
    "010_e2ee_recovery_custody.sql",
  ].map((name) =>
    path.join(sqlDir, name),
  )

  try {
    await pool.query("select 1")
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
