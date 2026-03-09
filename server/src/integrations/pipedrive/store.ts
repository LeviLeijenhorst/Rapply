import crypto from "crypto"
import { execute, queryMany, queryOne } from "../../db"

export type PipedriveImportStatus = "queued" | "fetching" | "mapping" | "applying" | "completed" | "failed" | "cancelled"

export type PipedriveConnection = {
  id: string
  userId: string
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  tokenExpiresAtIso: string | null
  status: "active" | "revoked"
}

export type PipedriveImportJob = {
  id: string
  userId: string
  connectionId: string
  status: PipedriveImportStatus
  entityTypes: string[]
  mappingVersion: string
  options: Record<string, unknown> | null
  progress: Record<string, unknown> | null
  warnings: string[]
  errorMessage: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
  completedAtUnixMs: number | null
}

function toJson(value: unknown): string {
  return JSON.stringify(value ?? null)
}

export async function createIntegrationOauthState(params: {
  userId: string
  state: string
  codeVerifier: string
  redirectUri: string
  expiresAtIso: string
}): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  await execute(
    `
    insert into public.integration_oauth_states (id, owner_user_id, provider, state, code_verifier, redirect_uri, expires_at, consumed_at)
    values ($1, $2, 'pipedrive', $3, $4, $5, $6, null)
    `,
    [id, params.userId, params.state, params.codeVerifier, params.redirectUri, params.expiresAtIso],
  )
  return { id }
}

export async function consumeIntegrationOauthState(params: {
  state: string
}): Promise<{ userId: string; codeVerifier: string; redirectUri: string } | null> {
  const row = await queryOne<{ owner_user_id: string; code_verifier: string; redirect_uri: string }>(
    `
    update public.integration_oauth_states
    set consumed_at = now()
    where provider = 'pipedrive'
      and state = $1
      and consumed_at is null
      and expires_at > now()
    returning owner_user_id, code_verifier, redirect_uri
    `,
    [params.state],
  )
  if (!row) return null
  return {
    userId: String(row.owner_user_id),
    codeVerifier: String(row.code_verifier),
    redirectUri: String(row.redirect_uri),
  }
}

export async function upsertPipedriveConnection(params: {
  userId: string
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  tokenScope: string | null
  tokenType: string | null
  tokenExpiresAtIso: string | null
  accountLabel: string | null
}): Promise<{ connectionId: string }> {
  const existing = await queryOne<{ id: string }>(
    `
    select id
    from public.integration_connections
    where owner_user_id = $1 and provider = 'pipedrive'
    limit 1
    `,
    [params.userId],
  )

  const nowUnixMs = Date.now()
  const id = existing?.id || crypto.randomUUID()
  await execute(
    `
    insert into public.integration_connections (
      id, owner_user_id, provider, account_label, access_token_encrypted, refresh_token_encrypted, token_scope, token_type, token_expires_at, status, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, 'pipedrive', $3, $4, $5, $6, $7, $8, 'active', $9, $9)
    on conflict (id) do update
      set account_label = excluded.account_label,
          access_token_encrypted = excluded.access_token_encrypted,
          refresh_token_encrypted = excluded.refresh_token_encrypted,
          token_scope = excluded.token_scope,
          token_type = excluded.token_type,
          token_expires_at = excluded.token_expires_at,
          status = excluded.status,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      id,
      params.userId,
      params.accountLabel,
      params.accessTokenEncrypted,
      params.refreshTokenEncrypted,
      params.tokenScope,
      params.tokenType,
      params.tokenExpiresAtIso,
      nowUnixMs,
    ],
  )

  return { connectionId: id }
}

export async function readPipedriveConnection(params: { userId: string; connectionId: string }): Promise<PipedriveConnection | null> {
  const row = await queryOne<{
    id: string
    owner_user_id: string
    access_token_encrypted: string
    refresh_token_encrypted: string
    token_expires_at: string | null
    status: "active" | "revoked"
  }>(
    `
    select id, owner_user_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, status
    from public.integration_connections
    where owner_user_id = $1 and id = $2 and provider = 'pipedrive'
    `,
    [params.userId, params.connectionId],
  )
  if (!row) return null
  return {
    id: row.id,
    userId: row.owner_user_id,
    accessTokenEncrypted: row.access_token_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted,
    tokenExpiresAtIso: row.token_expires_at,
    status: row.status,
  }
}

export async function updatePipedriveConnectionTokens(params: {
  userId: string
  connectionId: string
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  tokenScope: string | null
  tokenType: string | null
  tokenExpiresAtIso: string | null
}): Promise<void> {
  await execute(
    `
    update public.integration_connections
    set access_token_encrypted = $1,
        refresh_token_encrypted = $2,
        token_scope = $3,
        token_type = $4,
        token_expires_at = $5,
        status = 'active',
        updated_at_unix_ms = $6
    where owner_user_id = $7 and id = $8 and provider = 'pipedrive'
    `,
    [
      params.accessTokenEncrypted,
      params.refreshTokenEncrypted,
      params.tokenScope,
      params.tokenType,
      params.tokenExpiresAtIso,
      Date.now(),
      params.userId,
      params.connectionId,
    ],
  )
}

export async function createPipedriveImportJob(params: {
  userId: string
  connectionId: string
  entityTypes: string[]
  mappingVersion: string
  options: Record<string, unknown> | null
}): Promise<{ jobId: string }> {
  const id = crypto.randomUUID()
  const nowUnixMs = Date.now()
  await execute(
    `
    insert into public.pipedrive_import_jobs (
      id, owner_user_id, connection_id, status, entity_types_json, mapping_version, options_json, progress_json, warnings_json, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, 'queued', $4::jsonb, $5, $6::jsonb, '{}'::jsonb, '[]'::jsonb, $7, $7)
    `,
    [id, params.userId, params.connectionId, toJson(params.entityTypes), params.mappingVersion, toJson(params.options), nowUnixMs],
  )
  return { jobId: id }
}

function mapImportJob(row: any): PipedriveImportJob {
  return {
    id: String(row.id),
    userId: String(row.owner_user_id),
    connectionId: String(row.connection_id),
    status: row.status as PipedriveImportStatus,
    entityTypes: Array.isArray(row.entity_types_json) ? row.entity_types_json.map((item: unknown) => String(item)) : [],
    mappingVersion: String(row.mapping_version || ""),
    options: row.options_json && typeof row.options_json === "object" ? (row.options_json as Record<string, unknown>) : null,
    progress: row.progress_json && typeof row.progress_json === "object" ? (row.progress_json as Record<string, unknown>) : null,
    warnings: Array.isArray(row.warnings_json) ? row.warnings_json.map((item: unknown) => String(item)) : [],
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAtUnixMs: Number(row.created_at_unix_ms || 0),
    updatedAtUnixMs: Number(row.updated_at_unix_ms || 0),
    completedAtUnixMs: row.completed_at_unix_ms !== null ? Number(row.completed_at_unix_ms) : null,
  }
}

export async function readPipedriveImportJob(params: { userId: string; jobId: string }): Promise<PipedriveImportJob | null> {
  const row = await queryOne<any>(
    `
    select *
    from public.pipedrive_import_jobs
    where owner_user_id = $1 and id = $2
    `,
    [params.userId, params.jobId],
  )
  if (!row) return null
  return mapImportJob(row)
}

export async function claimNextQueuedPipedriveImportJob(): Promise<PipedriveImportJob | null> {
  const row = await queryOne<any>(
    `
    with next_job as (
      select id
      from public.pipedrive_import_jobs
      where status = 'queued'
      order by created_at_unix_ms asc
      for update skip locked
      limit 1
    )
    update public.pipedrive_import_jobs as jobs
    set status = 'fetching',
        updated_at_unix_ms = $1
    from next_job
    where jobs.id = next_job.id
    returning jobs.*
    `,
    [Date.now()],
  )
  if (!row) return null
  return mapImportJob(row)
}

export async function updatePipedriveImportJob(params: {
  jobId: string
  status?: PipedriveImportStatus
  progress?: Record<string, unknown>
  warnings?: string[]
  errorMessage?: string | null
  completedAtUnixMs?: number | null
}): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  let index = 1

  updates.push(`updated_at_unix_ms = $${index++}`)
  values.push(Date.now())

  if (params.status !== undefined) {
    updates.push(`status = $${index++}`)
    values.push(params.status)
  }
  if (params.progress !== undefined) {
    updates.push(`progress_json = $${index++}::jsonb`)
    values.push(toJson(params.progress))
  }
  if (params.warnings !== undefined) {
    updates.push(`warnings_json = $${index++}::jsonb`)
    values.push(toJson(params.warnings))
  }
  if (params.errorMessage !== undefined) {
    updates.push(`error_message = $${index++}`)
    values.push(params.errorMessage)
  }
  if (params.completedAtUnixMs !== undefined) {
    updates.push(`completed_at_unix_ms = $${index++}`)
    values.push(params.completedAtUnixMs)
  }

  values.push(params.jobId)
  await execute(
    `
    update public.pipedrive_import_jobs
    set ${updates.join(", ")}
    where id = $${index}
    `,
    values,
  )
}

export async function upsertPipedriveRawEntity(params: {
  jobId: string
  userId: string
  entityType: string
  externalId: string
  payload: unknown
}): Promise<void> {
  const id = crypto.randomUUID()
  const payloadJson = toJson(params.payload)
  const payloadHash = crypto.createHash("sha256").update(payloadJson).digest("hex")
  await execute(
    `
    insert into public.pipedrive_raw_entities (
      id, job_id, owner_user_id, entity_type, external_id, payload_json, payload_hash, fetched_at_unix_ms, mapping_status
    )
    values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, 'pending')
    on conflict (job_id, entity_type, external_id) do update
      set payload_json = excluded.payload_json,
          payload_hash = excluded.payload_hash,
          fetched_at_unix_ms = excluded.fetched_at_unix_ms
    `,
    [id, params.jobId, params.userId, params.entityType, params.externalId, payloadJson, payloadHash, Date.now()],
  )
}

export async function listPipedriveRawEntities(params: {
  jobId: string
  entityType: string
}): Promise<Array<{ externalId: string; payload: Record<string, unknown> }>> {
  const rows = await queryMany<{ external_id: string; payload_json: Record<string, unknown> }>(
    `
    select external_id, payload_json
    from public.pipedrive_raw_entities
    where job_id = $1 and entity_type = $2
    order by fetched_at_unix_ms asc
    `,
    [params.jobId, params.entityType],
  )
  return rows.map((row) => ({
    externalId: String(row.external_id),
    payload: row.payload_json || {},
  }))
}

export async function readExternalSourceLink(params: {
  userId: string
  provider: "pipedrive"
  externalType: string
  externalId: string
}): Promise<{ internalId: string } | null> {
  const row = await queryOne<{ internal_id: string }>(
    `
    select internal_id
    from public.external_source_links
    where owner_user_id = $1 and provider = $2 and external_type = $3 and external_id = $4
    `,
    [params.userId, params.provider, params.externalType, params.externalId],
  )
  if (!row) return null
  return { internalId: String(row.internal_id) }
}

export async function upsertExternalSourceLink(params: {
  userId: string
  provider: "pipedrive"
  externalType: string
  externalId: string
  internalType: string
  internalId: string
  sourceJobId: string
}): Promise<void> {
  const nowUnixMs = Date.now()
  await execute(
    `
    insert into public.external_source_links (
      id, owner_user_id, provider, external_type, external_id, internal_type, internal_id, source_job_id, created_at_unix_ms, updated_at_unix_ms
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    on conflict (owner_user_id, provider, external_type, external_id) do update
      set internal_type = excluded.internal_type,
          internal_id = excluded.internal_id,
          source_job_id = excluded.source_job_id,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      crypto.randomUUID(),
      params.userId,
      params.provider,
      params.externalType,
      params.externalId,
      params.internalType,
      params.internalId,
      params.sourceJobId,
      nowUnixMs,
    ],
  )
}
