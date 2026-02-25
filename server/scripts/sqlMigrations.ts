import fs from "node:fs"
import path from "node:path"

const migrationFilePattern = /^\d+.*\.sql$/i

// Reads SQL migration files from the sql directory in deterministic order.
export function readSqlMigrationFiles(sqlDir: string): string[] {
  const files = fs
    .readdirSync(sqlDir)
    .filter((name) => migrationFilePattern.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(sqlDir, name))

  if (files.length === 0) {
    throw new Error(`No SQL migration files found in: ${sqlDir}`)
  }

  return files
}

