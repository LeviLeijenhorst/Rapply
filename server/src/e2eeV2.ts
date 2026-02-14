import { execute, queryMany, queryOne } from "./db"

export type RecoveryPolicy = "self_service" | "custodian_only" | "hybrid"

export type UserKeyMaterial = {
  cryptoVersion: number
  keyVersion: number
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
  wrappedArkRecoveryCode: string | null
  recoveryPolicy: RecoveryPolicy
  custodianThreshold: number | null
}

// Intent: bootstrap
export async function bootstrap(params: { userId: string }): Promise<{ e2eeConfigured: boolean; keyVersion: number | null; recoveryPolicy: RecoveryPolicy | null }> {
  const row = await queryOne<{ key_version: number; recovery_policy: RecoveryPolicy }>(
    "select key_version, recovery_policy from public.e2ee_user_keys where user_id = $1",
    [params.userId],
  )
  if (!row) {
    return { e2eeConfigured: false, keyVersion: null, recoveryPolicy: null }
  }
  return { e2eeConfigured: true, keyVersion: row.key_version, recoveryPolicy: row.recovery_policy }
}

// Intent: setupUserKeys
export async function setupUserKeys(params: {
  userId: string
  cryptoVersion: number
  keyVersion: number
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
  wrappedArkRecoveryCode: string | null
  recoveryPolicy: RecoveryPolicy
  custodianThreshold: number | null
  nowUnixMs: number
}): Promise<void> {
  await execute(
    `
      insert into public.e2ee_user_keys (
        user_id,
        crypto_version,
        key_version,
        argon2_salt,
        argon2_time_cost,
        argon2_memory_cost_kib,
        argon2_parallelism,
        wrapped_ark_user_passphrase,
        wrapped_ark_recovery_code,
        recovery_policy,
        custodian_threshold,
        created_at_unix_ms,
        updated_at_unix_ms
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      on conflict (user_id) do update
      set crypto_version = excluded.crypto_version,
          key_version = excluded.key_version,
          argon2_salt = excluded.argon2_salt,
          argon2_time_cost = excluded.argon2_time_cost,
          argon2_memory_cost_kib = excluded.argon2_memory_cost_kib,
          argon2_parallelism = excluded.argon2_parallelism,
          wrapped_ark_user_passphrase = excluded.wrapped_ark_user_passphrase,
          wrapped_ark_recovery_code = excluded.wrapped_ark_recovery_code,
          recovery_policy = excluded.recovery_policy,
          custodian_threshold = excluded.custodian_threshold,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      params.userId,
      params.cryptoVersion,
      params.keyVersion,
      params.argon2Salt,
      params.argon2TimeCost,
      params.argon2MemoryCostKib,
      params.argon2Parallelism,
      params.wrappedArkUserPassphrase,
      params.wrappedArkRecoveryCode,
      params.recoveryPolicy,
      params.custodianThreshold,
      params.nowUnixMs,
      params.nowUnixMs,
    ],
  )
}

// Intent: readUserKeyMaterial
export async function readUserKeyMaterial(params: { userId: string }): Promise<UserKeyMaterial | null> {
  const row = await queryOne<{
    crypto_version: number
    key_version: number
    argon2_salt: string
    argon2_time_cost: number
    argon2_memory_cost_kib: number
    argon2_parallelism: number
    wrapped_ark_user_passphrase: string
    wrapped_ark_recovery_code: string | null
    recovery_policy: RecoveryPolicy
    custodian_threshold: number | null
  }>(
    `
      select
        crypto_version,
        key_version,
        argon2_salt,
        argon2_time_cost,
        argon2_memory_cost_kib,
        argon2_parallelism,
        wrapped_ark_user_passphrase,
        wrapped_ark_recovery_code,
        recovery_policy,
        custodian_threshold
      from public.e2ee_user_keys
      where user_id = $1
    `,
    [params.userId],
  )
  if (!row) return null
  return {
    cryptoVersion: row.crypto_version,
    keyVersion: row.key_version,
    argon2Salt: row.argon2_salt,
    argon2TimeCost: row.argon2_time_cost,
    argon2MemoryCostKib: row.argon2_memory_cost_kib,
    argon2Parallelism: row.argon2_parallelism,
    wrappedArkUserPassphrase: row.wrapped_ark_user_passphrase,
    wrappedArkRecoveryCode: row.wrapped_ark_recovery_code,
    recoveryPolicy: row.recovery_policy,
    custodianThreshold: row.custodian_threshold,
  }
}

// Intent: setRecoveryWrappedArk
export async function setRecoveryWrappedArk(params: { userId: string; wrappedArkRecoveryCode: string | null; nowUnixMs: number }): Promise<void> {
  await execute(
    `
      update public.e2ee_user_keys
      set wrapped_ark_recovery_code = $2,
          updated_at_unix_ms = $3
      where user_id = $1
    `,
    [params.userId, params.wrappedArkRecoveryCode, params.nowUnixMs],
  )
}

// Intent: rotatePassphraseWrappedArk
export async function rotatePassphraseWrappedArk(params: {
  userId: string
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
  keyVersion: number
  nowUnixMs: number
}): Promise<void> {
  await execute(
    `
      update public.e2ee_user_keys
      set argon2_salt = $2,
          argon2_time_cost = $3,
          argon2_memory_cost_kib = $4,
          argon2_parallelism = $5,
          wrapped_ark_user_passphrase = $6,
          key_version = $7,
          updated_at_unix_ms = $8
      where user_id = $1
    `,
    [
      params.userId,
      params.argon2Salt,
      params.argon2TimeCost,
      params.argon2MemoryCostKib,
      params.argon2Parallelism,
      params.wrappedArkUserPassphrase,
      params.keyVersion,
      params.nowUnixMs,
    ],
  )
}

// Intent: upsertObjectKey
export async function upsertObjectKey(params: {
  userId: string
  objectType: string
  objectId: string
  keyVersion: number
  cryptoVersion: number
  wrappedDek: string
  nowUnixMs: number
}): Promise<void> {
  await execute(
    `
      insert into public.e2ee_object_keys (
        user_id,
        object_type,
        object_id,
        key_version,
        crypto_version,
        wrapped_dek,
        created_at_unix_ms,
        updated_at_unix_ms
      )
      values ($1, $2, $3, $4, $5, $6, $7, $7)
      on conflict (user_id, object_type, object_id, key_version) do update
      set crypto_version = excluded.crypto_version,
          wrapped_dek = excluded.wrapped_dek,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      params.userId,
      params.objectType,
      params.objectId,
      params.keyVersion,
      params.cryptoVersion,
      params.wrappedDek,
      params.nowUnixMs,
    ],
  )
}

// Intent: readObjectKeys
export async function readObjectKeys(params: { userId: string; objectType: string; objectId: string }): Promise<
  { keyVersion: number; cryptoVersion: number; wrappedDek: string; updatedAtUnixMs: number }[]
> {
  const rows = await queryMany<{
    key_version: number
    crypto_version: number
    wrapped_dek: string
    updated_at_unix_ms: number
  }>(
    `
      select key_version, crypto_version, wrapped_dek, updated_at_unix_ms
      from public.e2ee_object_keys
      where user_id = $1 and object_type = $2 and object_id = $3
      order by key_version desc
    `,
    [params.userId, params.objectType, params.objectId],
  )
  return rows.map((row) => ({
    keyVersion: row.key_version,
    cryptoVersion: row.crypto_version,
    wrappedDek: row.wrapped_dek,
    updatedAtUnixMs: row.updated_at_unix_ms,
  }))
}

// Intent: readLatestObjectKeysBatch
export async function readLatestObjectKeysBatch(params: {
  userId: string
  refs: { objectType: string; objectId: string }[]
}): Promise<{ objectType: string; objectId: string; keyVersion: number; cryptoVersion: number; wrappedDek: string; updatedAtUnixMs: number }[]> {
  if (!params.refs.length) return []

  const values: unknown[] = [params.userId]
  const rowSql: string[] = []
  for (let index = 0; index < params.refs.length; index += 1) {
    const ref = params.refs[index]
    const typeParamIndex = values.length + 1
    const idParamIndex = values.length + 2
    values.push(ref.objectType, ref.objectId)
    rowSql.push(`($${typeParamIndex}::text, $${idParamIndex}::text)`)
  }

  const rows = await queryMany<{
    object_type: string
    object_id: string
    key_version: number
    crypto_version: number
    wrapped_dek: string
    updated_at_unix_ms: number
  }>(
    `
      with refs(object_type, object_id) as (
        values ${rowSql.join(",\n        ")}
      )
      select distinct on (k.object_type, k.object_id)
        k.object_type,
        k.object_id,
        k.key_version,
        k.crypto_version,
        k.wrapped_dek,
        k.updated_at_unix_ms
      from public.e2ee_object_keys k
      inner join refs r
        on r.object_type = k.object_type and r.object_id = k.object_id
      where k.user_id = $1
      order by k.object_type, k.object_id, k.key_version desc
    `,
    values,
  )

  return rows.map((row) => ({
    objectType: row.object_type,
    objectId: row.object_id,
    keyVersion: row.key_version,
    cryptoVersion: row.crypto_version,
    wrappedDek: row.wrapped_dek,
    updatedAtUnixMs: row.updated_at_unix_ms,
  }))
}
