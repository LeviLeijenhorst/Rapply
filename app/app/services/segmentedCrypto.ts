import { NativeModules, Platform } from "react-native"

type SegmentInfo = {
  version: number
  cipher: "gcm" | "cbc"
  segmentSize: number
  segmentCount: number
  fileLength: number
}

type SegmentedCryptoModuleType = {
  isAvailable(): boolean
  unwrapKey(wrappedKeyBase64: string, masterKeyAlias?: string): Promise<string>
  encryptToSegmented(
    inputPath: string,
    outputPathTmp: string,
    wrappedKeyBase64: string,
    segmentSize: number,
    cipher?: "gcm" | "cbc",
  ): Promise<boolean>
  segmentInfo(inputPath: string): Promise<SegmentInfo>
}

const SegmentedCryptoNative: SegmentedCryptoModuleType | undefined =
  (NativeModules as any)?.SegmentedCryptoModule

export function segmentedCryptoAvailable() {
  return !!SegmentedCryptoNative?.isAvailable?.()
}

export async function unwrapKey(wrappedKeyBase64: string, masterKeyAlias?: string) {
  if (!SegmentedCryptoNative?.unwrapKey) throw new Error("SegmentedCrypto native module is not available")
  return await SegmentedCryptoNative.unwrapKey(wrappedKeyBase64, masterKeyAlias)
}

export async function encryptToSegmented(
  inputPath: string,
  outputPathTmp: string,
  wrappedKeyBase64: string,
  segmentSize: number,
  cipher: "gcm" | "cbc" = "gcm",
) {
  if (!SegmentedCryptoNative?.encryptToSegmented) throw new Error("SegmentedCrypto native module is not available")
  return await SegmentedCryptoNative.encryptToSegmented(inputPath, outputPathTmp, wrappedKeyBase64, segmentSize, cipher)
}

export async function readSegmentInfo(inputPath: string) {
  if (!SegmentedCryptoNative?.segmentInfo) throw new Error("SegmentedCrypto native module is not available")
  return await SegmentedCryptoNative.segmentInfo(inputPath)
}

export const defaultSegmentSize = 64 * 1024

