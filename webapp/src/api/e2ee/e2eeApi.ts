import { callSecureApi } from '../secureApi'

export type E2eeRecoveryPolicy = 'self_service' | 'custodian_only' | 'hybrid'
export type E2eeCustodyMode = 'server_managed' | 'user_managed'

export type E2eeObjectType =
  | 'coachee'
  | 'session'
  | 'note'
  | 'written_report'
  | 'template'
  | 'practice_settings'
  | 'audio_blob'
  | 'audio_stream'

export type E2eeUserKeyMaterial = {
  cryptoVersion: number
  keyVersion: number
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
  wrappedArkRecoveryCode: string | null
  recoveryPolicy: E2eeRecoveryPolicy
  custodianThreshold: number | null
}

// Loads encryption bootstrap state for the current user.
export async function e2eeBootstrap(): Promise<{
  e2eeConfigured: boolean
  keyVersion: number | null
  recoveryPolicy: E2eeRecoveryPolicy | null
  custodyMode: E2eeCustodyMode | null
}> {
  return callSecureApi('/e2ee/bootstrap', {})
}

// Creates or replaces user key material for account encryption.
export async function e2eeSetup(params: {
  cryptoVersion?: number
  keyVersion?: number
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
  wrappedArkRecoveryCode?: string | null
  recoveryPolicy?: E2eeRecoveryPolicy
  custodianThreshold?: number | null
}): Promise<void> {
  await callSecureApi('/e2ee/setup', params)
}

// Enables user-managed custody and removes server-managed KMS custody.
export async function e2eeEnableUserManagedCustody(params: {
  cryptoVersion?: number
  keyVersion?: number
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
  wrappedArkRecoveryCode?: string | null
  recoveryPolicy?: E2eeRecoveryPolicy
  custodianThreshold?: number | null
}): Promise<void> {
  await callSecureApi('/e2ee/custody/enable-user-managed', params)
}

// Disables user-managed custody and stores ARK in server-managed KMS custody.
export async function e2eeDisableUserManagedCustody(params: {
  keyVersion: number
  arkBase64: string
}): Promise<void> {
  await callSecureApi('/e2ee/custody/disable-user-managed', params)
}

// Reads the current user's key material needed for unlock and recovery.
export async function e2eeGetUserKeyMaterial(): Promise<E2eeUserKeyMaterial> {
  return callSecureApi('/e2ee/user-key-material', {})
}

// Reads ARK for server-managed custody to unlock encryption without passphrase.
export async function e2eeUnlockServerManaged(): Promise<{ arkBase64: string; keyVersion: number }> {
  return callSecureApi('/e2ee/server-managed/unlock', {})
}

// Stores or clears the recovery-code wrapped ARK value.
export async function e2eeSetRecoveryCode(params: { wrappedArkRecoveryCode: string | null }): Promise<void> {
  await callSecureApi('/e2ee/recovery-code/set', params)
}

// Rotates the passphrase-wrapped ARK and Argon2 parameters.
export async function e2eeRotatePassphrase(params: {
  keyVersion: number
  argon2Salt: string
  argon2TimeCost: number
  argon2MemoryCostKib: number
  argon2Parallelism: number
  wrappedArkUserPassphrase: string
}): Promise<void> {
  await callSecureApi('/e2ee/passphrase/rotate', params)
}

// Upserts an encrypted object DEK for one object reference.
export async function e2eeUpsertObjectKey(params: {
  objectType: E2eeObjectType
  objectId: string
  keyVersion: number
  cryptoVersion?: number
  wrappedDek: string
}): Promise<void> {
  await callSecureApi('/e2ee/object-key/upsert', params)
}

// Reads all encrypted object DEK versions for one object reference.
export async function e2eeGetObjectKeys(params: {
  objectType: E2eeObjectType
  objectId: string
}): Promise<{ objectKeys: { keyVersion: number; cryptoVersion: number; wrappedDek: string; updatedAtUnixMs: number }[] }> {
  return callSecureApi('/e2ee/object-key/get', params)
}

// Reads the latest encrypted object DEK versions for multiple object references.
export async function e2eeGetObjectKeysBatch(params: {
  refs: {
    objectType: E2eeObjectType
    objectId: string
  }[]
}): Promise<{ objectKeys: { objectType: string; objectId: string; keyVersion: number; cryptoVersion: number; wrappedDek: string; updatedAtUnixMs: number }[] }> {
  return callSecureApi('/e2ee/object-key/get-batch', params)
}

