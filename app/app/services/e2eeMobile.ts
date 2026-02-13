import * as Crypto from "expo-crypto"
import * as SecureStore from "expo-secure-store"
import * as FileSystemLegacy from "expo-file-system/legacy"
import { Buffer } from "buffer"
import { requireNativeModule } from "expo"

import { requireUserId } from "./auth"
import { postToSecureApi } from "./secureApi"

const ExpoSegmentedAudioNative = requireNativeModule<any>("ExpoSegmentedAudio") as any

const deviceIdStorageKey = "coachscribe_e2ee_mobile_device_id_v1"
const legacyEncryptionKeyStorageKey = "encryption_key"
const userDataKeyStoragePrefix = "coachscribe_e2ee_user_data_key_v1:"
const recoveryKeyStoragePrefix = "coachscribe_e2ee_recovery_key_v1:"
const custodyModeStoragePrefix = "coachscribe_e2ee_custody_mode_v1:"

type RecoveryCustodyMode = "self" | "escrow"

type BootstrapResponse = {
  e2eeEnabled: boolean
  wrappedUserDataKeyForDevice: string | null
  recoveryKeyUpdatedAtMs: number | null
  recoveryCustodyMode: RecoveryCustodyMode | null
  hasEscrowedRecoveryKey: boolean
}

export type MobileE2eeStatus = {
  requiresSetup: boolean
  hasLocalEncryptionKey: boolean
  e2eeEnabledServerSide: boolean
  recoveryCustodyMode: RecoveryCustodyMode | null
  hasEscrowedRecoveryKey: boolean
}

export type SetupMobileE2eeParams = {
  custodyMode?: "self"
}

function toFsPath(uri: string) {
  return uri.startsWith("file://") ? uri.slice(7) : uri
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(text: string): Uint8Array {
  const normalized = String(text || "").replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  return new Uint8Array(Buffer.from(padded, "base64"))
}

function normalizeRecoveryKeyToBase64(recoveryKey: string): string {
  return Buffer.from(fromBase64Url(recoveryKey)).toString("base64")
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = (await SecureStore.getItemAsync(deviceIdStorageKey)) || ""
  if (existing) return existing
  const random = await Crypto.getRandomBytesAsync(16)
  const deviceId = `mobile-${Buffer.from(random).toString("hex")}`
  await SecureStore.setItemAsync(deviceIdStorageKey, deviceId)
  return deviceId
}

async function createTempFileUri(name: string): Promise<string> {
  const base = String(FileSystemLegacy.cacheDirectory || "")
  if (!base) throw new Error("Cache directory is not available")
  const dir = `${base}CoachScribe/e2ee_tmp/`
  await FileSystemLegacy.makeDirectoryAsync(dir, { intermediates: true })
  return `${dir}${name}`
}

async function encryptBytesToCsa1Base64Url(params: { bytes: Uint8Array; recoveryKeyBase64Url: string }): Promise<string> {
  const inputUri = await createTempFileUri(`wrap-input-${Date.now()}.bin`)
  const outputUri = await createTempFileUri(`wrap-output-${Date.now()}.csa1`)
  const inputBase64 = Buffer.from(params.bytes).toString("base64")
  const keyBase64 = normalizeRecoveryKeyToBase64(params.recoveryKeyBase64Url)
  try {
    await FileSystemLegacy.writeAsStringAsync(inputUri, inputBase64, { encoding: FileSystemLegacy.EncodingType.Base64 })
    const ok = await ExpoSegmentedAudioNative.encryptFile(toFsPath(inputUri), toFsPath(outputUri), keyBase64)
    if (!ok) throw new Error("Failed to encrypt wrapped key")
    const outputBase64 = await FileSystemLegacy.readAsStringAsync(outputUri, { encoding: FileSystemLegacy.EncodingType.Base64 })
    return toBase64Url(new Uint8Array(Buffer.from(outputBase64, "base64")))
  } finally {
    try {
      await FileSystemLegacy.deleteAsync(inputUri, { idempotent: true })
    } catch {}
    try {
      await FileSystemLegacy.deleteAsync(outputUri, { idempotent: true })
    } catch {}
  }
}

function normalizeWrappedKeyToCsa1Bytes(wrappedKey: string): Uint8Array {
  const bytes = fromBase64Url(wrappedKey)
  if (bytes.length < 17) {
    throw new Error("Invalid wrapped key")
  }
  const magic4 = Buffer.from(bytes.slice(0, 4)).toString("ascii")
  if (magic4 === "CSA1") return bytes
  const magic5 = Buffer.from(bytes.slice(0, 5)).toString("ascii")
  if (magic5 !== "E2EE1") {
    throw new Error("Unsupported wrapped key format")
  }
  const converted = new Uint8Array(bytes.length - 1)
  converted.set(Buffer.from("CSA1", "ascii"), 0)
  converted.set(bytes.slice(5), 4)
  return converted
}

async function decryptWrappedKeyToUserDataKeyBytes(params: {
  wrappedUserDataKeyForRecovery: string
  recoveryKeyBase64Url: string
}): Promise<Uint8Array> {
  const inputUri = await createTempFileUri(`unwrap-input-${Date.now()}.csa1`)
  const outputUri = await createTempFileUri(`unwrap-output-${Date.now()}.bin`)
  const keyBase64 = normalizeRecoveryKeyToBase64(params.recoveryKeyBase64Url)
  try {
    const csa1Bytes = normalizeWrappedKeyToCsa1Bytes(params.wrappedUserDataKeyForRecovery)
    const inputBase64 = Buffer.from(csa1Bytes).toString("base64")
    await FileSystemLegacy.writeAsStringAsync(inputUri, inputBase64, { encoding: FileSystemLegacy.EncodingType.Base64 })
    const ok = await ExpoSegmentedAudioNative.decryptFile(toFsPath(inputUri), toFsPath(outputUri), keyBase64)
    if (!ok) throw new Error("Failed to decrypt wrapped key")
    const outputBase64 = await FileSystemLegacy.readAsStringAsync(outputUri, { encoding: FileSystemLegacy.EncodingType.Base64 })
    const outputBytes = new Uint8Array(Buffer.from(outputBase64, "base64"))
    if (outputBytes.length !== 32) {
      throw new Error("Invalid unwrapped key length")
    }
    return outputBytes
  } finally {
    try {
      await FileSystemLegacy.deleteAsync(inputUri, { idempotent: true })
    } catch {}
    try {
      await FileSystemLegacy.deleteAsync(outputUri, { idempotent: true })
    } catch {}
  }
}

async function callE2eeBootstrap(deviceId: string): Promise<BootstrapResponse> {
  const result = await postToSecureApi("/e2ee/bootstrap", { deviceId })
  return {
    e2eeEnabled: !!result?.e2eeEnabled,
    wrappedUserDataKeyForDevice:
      typeof result?.wrappedUserDataKeyForDevice === "string" ? result.wrappedUserDataKeyForDevice : null,
    recoveryKeyUpdatedAtMs: typeof result?.recoveryKeyUpdatedAtMs === "number" ? result.recoveryKeyUpdatedAtMs : null,
    recoveryCustodyMode:
      result?.recoveryCustodyMode === "escrow" || result?.recoveryCustodyMode === "self" ? result.recoveryCustodyMode : null,
    hasEscrowedRecoveryKey: !!result?.hasEscrowedRecoveryKey,
  }
}

async function readLocalEncryptionKey(userId: string): Promise<string | null> {
  const userScoped = await SecureStore.getItemAsync(`${userDataKeyStoragePrefix}${userId}`)
  if (userScoped) return userScoped
  const legacy = await SecureStore.getItemAsync(legacyEncryptionKeyStorageKey)
  if (!legacy) return null
  await SecureStore.setItemAsync(`${userDataKeyStoragePrefix}${userId}`, legacy)
  return legacy
}

async function writeLocalEncryptionKey(userId: string, keyBase64: string): Promise<void> {
  await SecureStore.setItemAsync(`${userDataKeyStoragePrefix}${userId}`, keyBase64)
}

async function writeLocalRecoveryKey(userId: string, recoveryKey: string): Promise<void> {
  await SecureStore.setItemAsync(`${recoveryKeyStoragePrefix}${userId}`, recoveryKey)
}

async function writeLocalCustodyMode(userId: string, custodyMode: RecoveryCustodyMode): Promise<void> {
  await SecureStore.setItemAsync(`${custodyModeStoragePrefix}${userId}`, custodyMode)
}

export async function getLocalRecoveryKey(): Promise<string | null> {
  const userId = await requireUserId()
  return (await SecureStore.getItemAsync(`${recoveryKeyStoragePrefix}${userId}`)) || null
}

export async function getMobileE2eeStatus(): Promise<MobileE2eeStatus> {
  const userId = await requireUserId()
  const localKey = await readLocalEncryptionKey(userId)
  if (localKey) {
    const localModeRaw = (await SecureStore.getItemAsync(`${custodyModeStoragePrefix}${userId}`)) || null
    const localMode = localModeRaw === "escrow" || localModeRaw === "self" ? localModeRaw : null
    return {
      requiresSetup: false,
      hasLocalEncryptionKey: true,
      e2eeEnabledServerSide: true,
      recoveryCustodyMode: localMode,
      hasEscrowedRecoveryKey: false,
    }
  }

  const deviceId = await getOrCreateDeviceId()
  const bootstrap = await callE2eeBootstrap(deviceId)
  return {
    requiresSetup: true,
    hasLocalEncryptionKey: false,
    e2eeEnabledServerSide: bootstrap.e2eeEnabled,
    recoveryCustodyMode: bootstrap.recoveryCustodyMode,
    hasEscrowedRecoveryKey: bootstrap.hasEscrowedRecoveryKey,
  }
}

export async function setupMobileE2ee(params: SetupMobileE2eeParams): Promise<{ recoveryKey: string }> {
  const userId = await requireUserId()
  const deviceId = await getOrCreateDeviceId()
  const userDataKeyBytes = await Crypto.getRandomBytesAsync(32)
  const recoveryBytes = await Crypto.getRandomBytesAsync(32)
  const recoveryKey = toBase64Url(new Uint8Array(recoveryBytes))
  const wrappedUserDataKeyForRecovery = await encryptBytesToCsa1Base64Url({
    bytes: new Uint8Array(userDataKeyBytes),
    recoveryKeyBase64Url: recoveryKey,
  })

  await postToSecureApi("/e2ee/setup", {
    deviceId,
    wrappedUserDataKeyForRecovery,
    recoveryCustodyMode: "self",
  })

  await postToSecureApi("/e2ee/recovery/custody/set", {
    recoveryCustodyMode: "self",
  })

  const userDataKeyBase64 = Buffer.from(userDataKeyBytes).toString("base64")
  await writeLocalEncryptionKey(userId, userDataKeyBase64)
  await writeLocalRecoveryKey(userId, recoveryKey)
  await writeLocalCustodyMode(userId, "self")

  return { recoveryKey }
}

export async function restoreMobileE2eeWithRecoveryKey(recoveryKey: string): Promise<void> {
  const userId = await requireUserId()
  const deviceId = await getOrCreateDeviceId()
  const bootstrap = await callE2eeBootstrap(deviceId)
  const wrapped = await postToSecureApi("/e2ee/recovery/wrapped-user-data-key", {})
  const wrappedUserDataKeyForRecovery =
    typeof wrapped?.wrappedUserDataKeyForRecovery === "string" ? wrapped.wrappedUserDataKeyForRecovery : ""
  if (!wrappedUserDataKeyForRecovery) {
    throw new Error("No wrapped recovery key found")
  }
  const userDataKeyBytes = await decryptWrappedKeyToUserDataKeyBytes({
    wrappedUserDataKeyForRecovery,
    recoveryKeyBase64Url: recoveryKey.trim(),
  })
  const keyBase64 = Buffer.from(userDataKeyBytes).toString("base64")
  await writeLocalEncryptionKey(userId, keyBase64)
  await writeLocalRecoveryKey(userId, recoveryKey.trim())
  if (bootstrap.recoveryCustodyMode === "escrow" || bootstrap.recoveryCustodyMode === "self") {
    await writeLocalCustodyMode(userId, bootstrap.recoveryCustodyMode)
  }
}

export async function restoreMobileE2eeFromEscrow(): Promise<void> {
  throw new Error("Escrow recovery is disabled")
}

export async function getLocalEncryptionKeyOrThrow(): Promise<string> {
  const userId = await requireUserId()
  const key = await readLocalEncryptionKey(userId)
  if (!key) {
    throw new Error("E2EE_SETUP_REQUIRED")
  }
  return key
}
