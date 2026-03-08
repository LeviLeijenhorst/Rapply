import { execute, queryOne } from "../db"
import { env } from "../env"

export type TranscriptionMode = "azure-fast-batch" | "azure-realtime-live"
export type TranscriptionProviderRuntime = "azure" | "speechmatics"

const DEFAULT_MODE: TranscriptionMode = normalizeTranscriptionMode(env.defaultTranscriptionMode) || "azure-fast-batch"
const DEFAULT_PROVIDER: TranscriptionProviderRuntime =
  normalizeTranscriptionProvider(env.defaultTranscriptionProvider) || "azure"

let ensureTranscriptionRuntimeSettingsTablePromise: Promise<void> | null = null

function normalizeTranscriptionMode(value: unknown): TranscriptionMode | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "azure-fast-batch") return "azure-fast-batch"
  if (normalized === "azure-realtime-live") return "azure-realtime-live"
  return null
}

function normalizeTranscriptionProvider(value: unknown): TranscriptionProviderRuntime | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "azure") return "azure"
  if (normalized === "speechmatics") return "speechmatics"
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
          provider text not null default 'azure',
          updated_at timestamptz not null default now(),
          updated_by text
        );
        `,
        [],
      )
      await execute(
        `
        alter table if exists public.transcription_runtime_settings
          add column if not exists provider text not null default 'azure';
        `,
        [],
      )
      await execute(
        `
        insert into public.transcription_runtime_settings (singleton, mode, provider)
        values (true, $1, $2)
        on conflict (singleton) do nothing;
        `,
        [DEFAULT_MODE, DEFAULT_PROVIDER],
      )
      await execute(
        `
        update public.transcription_runtime_settings
        set provider = $1
        where singleton = true
          and (provider is null or btrim(provider) = '');
        `,
        [DEFAULT_PROVIDER],
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

export async function writeTranscriptionRuntimeSettings(params: {
  mode: TranscriptionMode
  provider: TranscriptionProviderRuntime
  updatedBy: string | null
}): Promise<void> {
  await ensureTranscriptionRuntimeSettingsTable()
  await execute(
    `
    insert into public.transcription_runtime_settings (singleton, mode, provider, updated_at, updated_by)
    values (true, $1, $2, now(), $3)
    on conflict (singleton) do update
      set mode = excluded.mode,
          provider = excluded.provider,
          updated_at = now(),
          updated_by = excluded.updated_by
    `,
    [params.mode, params.provider, params.updatedBy],
  )
}

export async function writeTranscriptionMode(params: {
  mode: TranscriptionMode
  updatedBy: string | null
}): Promise<void> {
  const settings = await readTranscriptionRuntimeSettings()
  await writeTranscriptionRuntimeSettings({
    mode: params.mode,
    provider: settings.provider,
    updatedBy: params.updatedBy,
  })
}

export async function readTranscriptionRuntimeSettings(): Promise<{
  mode: TranscriptionMode
  provider: TranscriptionProviderRuntime
}> {
  await ensureTranscriptionRuntimeSettingsTable()
  const row = await queryOne<{ mode: string; provider: string | null }>(
    `
    select mode, provider
    from public.transcription_runtime_settings
    where singleton = true
    limit 1
    `,
    [],
  )
  return {
    mode: normalizeTranscriptionMode(row?.mode) || DEFAULT_MODE,
    provider: normalizeTranscriptionProvider(row?.provider) || DEFAULT_PROVIDER,
  }
}

export async function readTranscriptionModeWithMetadata(): Promise<{
  mode: TranscriptionMode
  provider: TranscriptionProviderRuntime
  updatedAt: string | null
  updatedBy: string | null
}> {
  await ensureTranscriptionRuntimeSettingsTable()
  const row = await queryOne<{ mode: string; provider: string | null; updated_at: string | null; updated_by: string | null }>(
    `
    select mode, provider, updated_at, updated_by
    from public.transcription_runtime_settings
    where singleton = true
    limit 1
    `,
    [],
  )
  return {
    mode: normalizeTranscriptionMode(row?.mode) || DEFAULT_MODE,
    provider: normalizeTranscriptionProvider(row?.provider) || DEFAULT_PROVIDER,
    updatedAt: row?.updated_at || null,
    updatedBy: row?.updated_by || null,
  }
}

export function parseTranscriptionMode(value: unknown): TranscriptionMode | null {
  return normalizeTranscriptionMode(value)
}

export function parseTranscriptionProvider(value: unknown): TranscriptionProviderRuntime | null {
  return normalizeTranscriptionProvider(value)
}
