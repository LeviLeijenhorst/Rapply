import crypto from "crypto"

// Generates a URL-safe random operation id.
export function randomBase64Url(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url")
}

