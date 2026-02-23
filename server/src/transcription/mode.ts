import { execute, queryOne } from "../db"
import { env } from "../env"

export type TranscriptionMode = "azure-fast-batch" | "azure-realtime-live"

const DEFAULT_MODE: TranscriptionMode = normalizeTranscriptionMode(env.defaultTranscriptionMode) || "azure-fast-batch"

let ensureTranscriptionRuntimeSettingsTablePromise: Promise<void> | null = null

function normalizeTranscriptionMode(value: unknown): TranscriptionMode | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "azure-fast-batch") return "azure-fast-batch"
  if (normalized === "azure-realtime-live") return "azure-realtime-live"
  return null
}

export async function ensureTranscriptionRuntimeSettingsTable(): Promise<void> {
  if (!ensureTranscriptionRuntimeSettingsTablePromise) {
    ensureTranscriptionRuntimeSettingsTablePromise = (async () => {
      await execute(
        `
        create table if not exists public.transcription_runtime_settings (
          singleton boolean primary key default true,
          mode text not null,
          updated_at timestamptz not null default now(),
          updated_by text
        );
        `,
        [],
      )
      await execute(
        `
        insert into public.transcription_runtime_settings (singleton, mode)
        values (true, $1)
        on conflict (singleton) do nothing;
        `,
        [DEFAULT_MODE],
      )
    })().catch((error) => {
      ensureTranscriptionRuntimeSettingsTablePromise = null
      throw error
    })
  }

  await ensureTranscriptionRuntimeSettingsTablePromise
}

export async function readTranscriptionMode(): Promise<TranscriptionMode> {
  await ensureTranscriptionRuntimeSettingsTable()
  const row = await queryOne<{ mode: string }>(
    `
    select mode
    from public.transcription_runtime_settings
    where singleton = true
    limit 1
    `,
    [],
  )
  return normalizeTranscriptionMode(row?.mode) || DEFAULT_MODE
}

export async function writeTranscriptionMode(params: { mode: TranscriptionMode; updatedBy: string | null }): Promise<void> {
  await ensureTranscriptionRuntimeSettingsTable()
  await execute(
    `
    insert into public.transcription_runtime_settings (singleton, mode, updated_at, updated_by)
    values (true, $1, now(), $2)
    on conflict (singleton) do update
      set mode = excluded.mode,
          updated_at = now(),
          updated_by = excluded.updated_by
    `,
    [params.mode, params.updatedBy],
  )
}

export async function readTranscriptionModeWithMetadata(): Promise<{ mode: TranscriptionMode; updatedAt: string | null; updatedBy: string | null }> {
  await ensureTranscriptionRuntimeSettingsTable()
  const row = await queryOne<{ mode: string; updated_at: string | null; updated_by: string | null }>(
    `
    select mode, updated_at, updated_by
    from public.transcription_runtime_settings
    where singleton = true
    limit 1
    `,
    [],
  )
  return {
    mode: normalizeTranscriptionMode(row?.mode) || DEFAULT_MODE,
    updatedAt: row?.updated_at || null,
    updatedBy: row?.updated_by || null,
  }
}

export function parseTranscriptionMode(value: unknown): TranscriptionMode | null {
  return normalizeTranscriptionMode(value)
}
