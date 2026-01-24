import crypto from "crypto"

export function randomBase64Url(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

