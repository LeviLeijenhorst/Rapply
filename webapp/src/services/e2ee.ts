import { callSecureApi } from './secureApi'

export async function e2eeBootstrap(params: { deviceId: string }): Promise<{ e2eeEnabled: boolean; wrappedUserDataKeyForDevice: string | null; recoveryKeyUpdatedAtMs: number | null }> {
  return callSecureApi('/e2ee/bootstrap', params)
}

export async function e2eeRegisterDevice(params: { deviceId: string; publicKeyJwk: JsonWebKey }): Promise<void> {
  await callSecureApi('/e2ee/device/register', params)
}

export async function e2eeSetup(params: { deviceId: string; wrappedUserDataKeyForDevice: string; wrappedUserDataKeyForRecovery: string }): Promise<void> {
  await callSecureApi('/e2ee/setup', params)
}

export async function e2eeGetWrappedUserDataKeyForRecovery(): Promise<{ wrappedUserDataKeyForRecovery: string; recoveryKeyUpdatedAtMs: number }> {
  return callSecureApi('/e2ee/recovery/wrapped-user-data-key', {})
}

export async function e2eeSetWrappedUserDataKeyForDevice(params: { deviceId: string; wrappedUserDataKeyForDevice: string }): Promise<void> {
  await callSecureApi('/e2ee/device-key/set', params)
}

export async function e2eeRotateRecoveryWrappedKey(params: { wrappedUserDataKeyForRecovery: string }): Promise<void> {
  await callSecureApi('/e2ee/recovery/rotate', params)
}

export async function e2eeRequestPairing(params: { deviceId: string }): Promise<{ expiresAtMs: number }> {
  return callSecureApi('/e2ee/pairing/request', params)
}

export async function e2eeApprovePairing(params: { deviceId: string; wrappedUserDataKeyForDevice: string }): Promise<void> {
  await callSecureApi('/e2ee/pairing/approve', params)
}

export async function e2eeListDevices(): Promise<{
  devices: { deviceId: string; publicKeyJwk: JsonWebKey; pairingExpiresAtMs: number | null; approvedAtMs: number | null; revokedAtMs: number | null; createdAtMs: number }[]
}> {
  return callSecureApi('/e2ee/devices/list', {})
}

export async function e2eeRevokeDevice(params: { deviceId: string }): Promise<void> {
  await callSecureApi('/e2ee/devices/revoke', params)
}

