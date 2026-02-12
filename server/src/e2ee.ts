import { execute, queryMany, queryOne } from "./db"

export type RecoveryCustodyMode = "self" | "escrow"

export async function registerDevice(params: { userId: string; deviceId: string; publicKeyJwk: unknown; createdAtUnixMs: number }): Promise<void> {
  await execute(
    `
      insert into public.e2ee_devices (user_id, device_id, public_key_jwk, created_at_unix_ms)
      values ($1, $2, $3, $4)
      on conflict (user_id, device_id)
      do update set public_key_jwk = excluded.public_key_jwk
    `,
    [params.userId, params.deviceId, params.publicKeyJwk, params.createdAtUnixMs],
  )

  await execute(
    `
      insert into public.e2ee_device_keys (user_id, device_id, wrapped_user_data_key_for_device, updated_at_unix_ms)
      values ($1, $2, null, $3)
      on conflict (user_id, device_id)
      do nothing
    `,
    [params.userId, params.deviceId, params.createdAtUnixMs],
  )
}

export async function bootstrap(params: {
  userId: string
  deviceId: string
}): Promise<{
  e2eeEnabled: boolean
  wrappedUserDataKeyForDevice: string | null
  recoveryKeyUpdatedAtMs: number | null
  recoveryCustodyMode: RecoveryCustodyMode | null
  hasEscrowedRecoveryKey: boolean
}> {
  const userRow = await queryOne<{
    wrapped_user_data_key_for_recovery: string
    recovery_key_updated_at_unix_ms: number
    recovery_custody_mode: RecoveryCustodyMode | null
    escrow_reference_id: string | null
  }>(
    "select wrapped_user_data_key_for_recovery, recovery_key_updated_at_unix_ms, recovery_custody_mode, escrow_reference_id from public.e2ee_users where user_id = $1",
    [params.userId],
  )

  if (!userRow) {
    return {
      e2eeEnabled: false,
      wrappedUserDataKeyForDevice: null,
      recoveryKeyUpdatedAtMs: null,
      recoveryCustodyMode: null,
      hasEscrowedRecoveryKey: false,
    }
  }

  const deviceKeyRow = await queryOne<{ wrapped_user_data_key_for_device: string | null }>(
    "select wrapped_user_data_key_for_device from public.e2ee_device_keys where user_id = $1 and device_id = $2",
    [params.userId, params.deviceId],
  )

  return {
    e2eeEnabled: true,
    wrappedUserDataKeyForDevice: deviceKeyRow?.wrapped_user_data_key_for_device ?? null,
    recoveryKeyUpdatedAtMs: userRow.recovery_key_updated_at_unix_ms,
    recoveryCustodyMode: userRow.recovery_custody_mode || "self",
    hasEscrowedRecoveryKey: !!userRow.escrow_reference_id,
  }
}

export async function setupE2ee(params: {
  userId: string
  deviceId: string
  wrappedUserDataKeyForDevice?: string | null
  wrappedUserDataKeyForRecovery: string
  recoveryCustodyMode?: RecoveryCustodyMode | null
  escrowReferenceId?: string | null
  nowUnixMs: number
}): Promise<void> {
  await execute(
    `
      insert into public.e2ee_users (
        user_id,
        wrapped_user_data_key_for_recovery,
        recovery_key_updated_at_unix_ms,
        recovery_custody_mode,
        escrow_reference_id,
        escrow_updated_at_unix_ms
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (user_id) do nothing
    `,
    [
      params.userId,
      params.wrappedUserDataKeyForRecovery,
      params.nowUnixMs,
      params.recoveryCustodyMode || "self",
      params.escrowReferenceId ?? null,
      params.escrowReferenceId ? params.nowUnixMs : null,
    ],
  )

  if (params.wrappedUserDataKeyForDevice) {
    await execute(
      `
        update public.e2ee_device_keys
        set wrapped_user_data_key_for_device = $3, updated_at_unix_ms = $4
        where user_id = $1 and device_id = $2
      `,
      [params.userId, params.deviceId, params.wrappedUserDataKeyForDevice, params.nowUnixMs],
    )

    await execute(
      `
        update public.e2ee_devices
        set approved_at_unix_ms = $3, pairing_expires_at_unix_ms = null
        where user_id = $1 and device_id = $2
      `,
      [params.userId, params.deviceId, params.nowUnixMs],
    )
  }
}

export async function readRecoveryWrappedKey(params: { userId: string }): Promise<{ wrappedUserDataKeyForRecovery: string; recoveryKeyUpdatedAtMs: number } | null> {
  const row = await queryOne<{ wrapped_user_data_key_for_recovery: string; recovery_key_updated_at_unix_ms: number }>(
    "select wrapped_user_data_key_for_recovery, recovery_key_updated_at_unix_ms from public.e2ee_users where user_id = $1",
    [params.userId],
  )
  if (!row) return null
  return { wrappedUserDataKeyForRecovery: row.wrapped_user_data_key_for_recovery, recoveryKeyUpdatedAtMs: row.recovery_key_updated_at_unix_ms }
}

export async function setWrappedUserDataKeyForDevice(params: { userId: string; deviceId: string; wrappedUserDataKeyForDevice: string; nowUnixMs: number }): Promise<void> {
  await execute(
    `
      update public.e2ee_device_keys
      set wrapped_user_data_key_for_device = $3, updated_at_unix_ms = $4
      where user_id = $1 and device_id = $2
    `,
    [params.userId, params.deviceId, params.wrappedUserDataKeyForDevice, params.nowUnixMs],
  )

  await execute(
    `
      update public.e2ee_devices
      set approved_at_unix_ms = $3, pairing_expires_at_unix_ms = null
      where user_id = $1 and device_id = $2
    `,
    [params.userId, params.deviceId, params.nowUnixMs],
  )
}

export async function rotateRecoveryWrappedKey(params: { userId: string; wrappedUserDataKeyForRecovery: string; nowUnixMs: number }): Promise<void> {
  await execute(
    `
      update public.e2ee_users
      set wrapped_user_data_key_for_recovery = $2, recovery_key_updated_at_unix_ms = $3
      where user_id = $1
    `,
    [params.userId, params.wrappedUserDataKeyForRecovery, params.nowUnixMs],
  )
}

export async function setRecoveryCustody(params: {
  userId: string
  recoveryCustodyMode: RecoveryCustodyMode
  escrowReferenceId?: string | null
  nowUnixMs: number
}): Promise<void> {
  await execute(
    `
      update public.e2ee_users
      set recovery_custody_mode = $2,
          escrow_reference_id = $3,
          escrow_updated_at_unix_ms = $4
      where user_id = $1
    `,
    [params.userId, params.recoveryCustodyMode, params.escrowReferenceId ?? null, params.escrowReferenceId ? params.nowUnixMs : null],
  )
}

export async function requestPairing(params: { userId: string; deviceId: string; expiresAtUnixMs: number }): Promise<void> {
  await execute(
    `
      update public.e2ee_devices
      set pairing_expires_at_unix_ms = $3
      where user_id = $1 and device_id = $2 and revoked_at_unix_ms is null
    `,
    [params.userId, params.deviceId, params.expiresAtUnixMs],
  )
}

export async function approvePairing(params: { userId: string; deviceId: string; wrappedUserDataKeyForDevice: string; nowUnixMs: number }): Promise<void> {
  await setWrappedUserDataKeyForDevice({
    userId: params.userId,
    deviceId: params.deviceId,
    wrappedUserDataKeyForDevice: params.wrappedUserDataKeyForDevice,
    nowUnixMs: params.nowUnixMs,
  })
}

export async function listDevices(params: { userId: string }): Promise<
  { deviceId: string; publicKeyJwk: unknown; pairingExpiresAtMs: number | null; approvedAtMs: number | null; revokedAtMs: number | null; createdAtMs: number }[]
> {
  const rows = await queryMany<{
    device_id: string
    public_key_jwk: unknown
    pairing_expires_at_unix_ms: number | null
    approved_at_unix_ms: number | null
    revoked_at_unix_ms: number | null
    created_at_unix_ms: number
  }>(
    `
      select device_id, public_key_jwk, pairing_expires_at_unix_ms, approved_at_unix_ms, revoked_at_unix_ms, created_at_unix_ms
      from public.e2ee_devices
      where user_id = $1
      order by created_at_unix_ms asc
    `,
    [params.userId],
  )

  return rows.map((row) => ({
    deviceId: row.device_id,
    publicKeyJwk: row.public_key_jwk,
    pairingExpiresAtMs: row.pairing_expires_at_unix_ms,
    approvedAtMs: row.approved_at_unix_ms,
    revokedAtMs: row.revoked_at_unix_ms,
    createdAtMs: row.created_at_unix_ms,
  }))
}

export async function revokeDevice(params: { userId: string; deviceId: string; nowUnixMs: number }): Promise<void> {
  await execute(
    `
      update public.e2ee_devices
      set revoked_at_unix_ms = $3
      where user_id = $1 and device_id = $2
    `,
    [params.userId, params.deviceId, params.nowUnixMs],
  )

  await execute(
    `
      update public.e2ee_device_keys
      set wrapped_user_data_key_for_device = null, updated_at_unix_ms = $3
      where user_id = $1 and device_id = $2
    `,
    [params.userId, params.deviceId, params.nowUnixMs],
  )
}
