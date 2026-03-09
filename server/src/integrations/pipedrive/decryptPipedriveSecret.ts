import { kmsUnwrapArkBytes } from "../../kms"

export async function decryptPipedriveSecret(encryptedSecret: string): Promise<string> {
  const bytes = await kmsUnwrapArkBytes(String(encryptedSecret || ""))
  return Buffer.from(bytes).toString("utf8")
}
