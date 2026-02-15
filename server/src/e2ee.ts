import crypto from "node:crypto"
import { execute, queryMany, queryOne } from "./db"
import { kmsUnwrapArkBytes, kmsWrapArkBytes } from "./kms"

export type RecoveryPolicy = "self_service" | "custodian_only" | "hybrid"
export type E2eeCustodyMode = "server_managed" | "user_managed"

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

export type BootstrapState = {
  e2eeConfigured: boolean
  keyVersion: number | null
  recoveryPolicy: RecoveryPolicy | null
  custodyMode: E2eeCustodyMode | null
}

function createArkBytes(): Uint8Array {
  return crypto.randomBytes(32)
}

// Intent: ensureServerManagedUserKey
export async function ensureServerManagedUserKey(params: { userId: string; nowUnixMs: number }): Promise<void> {
  const row = await queryOne<{ user_id: string }>("select user_id from public.e2ee_user_keys where user_id = $1", [params.userId])
  if (row) return
  const arkBytes = createArkBytes()
  const wrappedArkServerKms = await kmsWrapArkBytes(arkBytes)
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
        wrapped_ark_server_kms,
        recovery_policy,
        custody_mode,
        custodian_threshold,
        created_at_unix_ms,
        updated_at_unix_ms
      )
      values ($1, 1, 1, null, null, null, null, null, null, $2, 'self_service', 'server_managed', null, $3, $3)
    `,
    [params.userId, wrappedArkServerKms, params.nowUnixMs],
  )
}

// Intent: bootstrap
export async function bootstrap(params: { userId: string }): Promise<BootstrapState> {
  const row = await queryOne<{ key_version: number; recovery_policy: RecoveryPolicy; custody_mode: E2eeCustodyMode }>(
    "select key_version, recovery_policy, custody_mode from public.e2ee_user_keys where user_id = $1",
    [params.userId],
  )
  if (!row) {
    return { e2eeConfigured: false, keyVersion: null, recoveryPolicy: null, custodyMode: null }
  }
  return {
    e2eeConfigured: true,
    keyVersion: row.key_version,
    recoveryPolicy: row.recovery_policy,
    custodyMode: row.custody_mode,
  }
}

// Intent: readServerManagedArkBytes
export async function readServerManagedArkBytes(params: { userId: string }): Promise<{ arkBytes: Uint8Array; keyVersion: number } | null> {
  const row = await queryOne<{ wrapped_ark_server_kms: string | null; key_version: number; custody_mode: E2eeCustodyMode }>(
    `
      select wrapped_ark_server_kms, key_version, custody_mode
      from public.e2ee_user_keys
      where user_id = $1
    `,
    [params.userId],
  )
  if (!row || row.custody_mode !== "server_managed" || !row.wrapped_ark_server_kms) {
    return null
  }
  const arkBytes = await kmsUnwrapArkBytes(row.wrapped_ark_server_kms)
  return { arkBytes, keyVersion: row.key_version }
}

// Intent: setUserManagedCustody
export async function setUserManagedCustody(params: {
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
      update public.e2ee_user_keys
      set crypto_version = $2,
          key_version = $3,
          argon2_salt = $4,
          argon2_time_cost = $5,
          argon2_memory_cost_kib = $6,
          argon2_parallelism = $7,
          wrapped_ark_user_passphrase = $8,
          wrapped_ark_recovery_code = $9,
          wrapped_ark_server_kms = null,
          recovery_policy = $10,
          custody_mode = 'user_managed',
          custodian_threshold = $11,
          updated_at_unix_ms = $12
      where user_id = $1
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
    ],
  )
}

// Intent: setServerManagedCustody
export async function setServerManagedCustody(params: {
  userId: string
  keyVersion: number
  arkBytes: Uint8Array
  nowUnixMs: number
}): Promise<void> {
  const wrappedArkServerKms = await kmsWrapArkBytes(params.arkBytes)
  await execute(
    `
      update public.e2ee_user_keys
      set key_version = $2,
          wrapped_ark_server_kms = $3,
          custody_mode = 'server_managed',
          argon2_salt = null,
          argon2_time_cost = null,
          argon2_memory_cost_kib = null,
          argon2_parallelism = null,
          wrapped_ark_user_passphrase = null,
          wrapped_ark_recovery_code = null,
          updated_at_unix_ms = $4
      where user_id = $1
    `,
    [params.userId, params.keyVersion, wrappedArkServerKms, params.nowUnixMs],
  )
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
        wrapped_ark_server_kms,
        recovery_policy,
        custody_mode,
        custodian_threshold,
        created_at_unix_ms,
        updated_at_unix_ms
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, null, $10, 'user_managed', $11, $12, $12)
      on conflict (user_id) do update
      set crypto_version = excluded.crypto_version,
          key_version = excluded.key_version,
          argon2_salt = excluded.argon2_salt,
          argon2_time_cost = excluded.argon2_time_cost,
          argon2_memory_cost_kib = excluded.argon2_memory_cost_kib,
          argon2_parallelism = excluded.argon2_parallelism,
          wrapped_ark_user_passphrase = excluded.wrapped_ark_user_passphrase,
          wrapped_ark_recovery_code = excluded.wrapped_ark_recovery_code,
          wrapped_ark_server_kms = null,
          recovery_policy = excluded.recovery_policy,
          custody_mode = 'user_managed',
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
    ],
  )
}

// Intent: readUserKeyMaterial
export async function readUserKeyMaterial(params: { userId: string }): Promise<UserKeyMaterial | null> {
  const row = await queryOne<{
    crypto_version: number
    key_version: number
    argon2_salt: string | null
    argon2_time_cost: number | null
    argon2_memory_cost_kib: number | null
    argon2_parallelism: number | null
    wrapped_ark_user_passphrase: string | null
    wrapped_ark_recovery_code: string | null
    recovery_policy: RecoveryPolicy
    custody_mode: E2eeCustodyMode
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
        custody_mode,
        custodian_threshold
      from public.e2ee_user_keys
      where user_id = $1
    `,
    [params.userId],
  )
  if (!row || row.custody_mode !== "user_managed") return null
  if (!row.argon2_salt || !row.argon2_time_cost || !row.argon2_memory_cost_kib || !row.argon2_parallelism || !row.wrapped_ark_user_passphrase) {
    return null
  }
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
      where user_id = $1 and custody_mode = 'user_managed'
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
          custody_mode = 'user_managed',
          wrapped_ark_server_kms = null,
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
