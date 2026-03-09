import { kmsWrapArkBytes } from "../../kms"

export async function encryptPipedriveSecret(secret: string): Promise<string> {
  const bytes = new Uint8Array(Buffer.from(String(secret || ""), "utf8"))
  return kmsWrapArkBytes(bytes)
}
