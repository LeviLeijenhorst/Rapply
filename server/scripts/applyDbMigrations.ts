import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { Pool } from "pg"
import { readSqlMigrationFiles } from "./sqlMigrations"

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

// Applies pending SQL migration files without resetting existing data.
async function main() {
  const databaseUrl = requireString("DATABASE_URL")
  const databaseSsl = String(process.env.DATABASE_SSL || "").trim() === "1"
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseSsl ? { rejectUnauthorized: false } : undefined,
  })

  const sqlDir = path.resolve(serverDir, "sql")
  const sqlFiles = readSqlMigrationFiles(sqlDir)

  try {
    await pool.query("select 1")
    await pool.query(`
      create table if not exists public.schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `)

    for (const filePath of sqlFiles) {
      const filename = path.basename(filePath)
      const alreadyApplied = await pool.query<{ filename: string }>(
        "select filename from public.schema_migrations where filename = $1 limit 1",
        [filename],
      )
      if (alreadyApplied.rowCount) {
        process.stdout.write(`[db-migrations] skipped ${filename}\n`)
        continue
      }

      const sql = readSqlFile(filePath)
      const client = await pool.connect()
      try {
        await client.query("begin")
        await client.query(sql)
        await client.query("insert into public.schema_migrations (filename) values ($1)", [filename])
        await client.query("commit")
        process.stdout.write(`[db-migrations] applied ${filename}\n`)
      } catch (error) {
        await client.query("rollback")
        throw new Error(`Failed migration ${filename}: ${String((error as any)?.message || error)}`)
      } finally {
        client.release()
      }
    }

    process.stdout.write("[db-migrations] done\n")
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  const message = String((error as any)?.message || error || "")
  process.stderr.write(`${message}\n`)
  process.exit(1)
})

