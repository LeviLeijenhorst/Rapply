import fs from "node:fs"
import https from "node:https"
import crypto from "node:crypto"
import { env } from "./env"

type OvhEncryptResponse = {
  ciphertext?: string
  encryptedData?: string
  data?: string
}

type OvhDecryptResponse = {
  plaintext?: string
  decryptedData?: string
  data?: string
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64")
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"))
}

function readFileIfPresent(pathValue: string): Buffer | undefined {
  const trimmed = String(pathValue || "").trim()
  if (!trimmed) return undefined
  return fs.readFileSync(trimmed)
}

function requireLocalKmsMasterKey(): Buffer {
  const value = String(env.localKmsMasterKeyBase64 || "").trim()
  if (!value) {
    throw new Error("LOCAL_KMS_MASTER_KEY_BASE64 is required when KMS_PROVIDER=local")
  }
  const key = Buffer.from(value, "base64")
  if (key.length !== 32) {
    throw new Error("LOCAL_KMS_MASTER_KEY_BASE64 must decode to exactly 32 bytes")
  }
  return key
}

function localEncrypt(plaintextBase64: string): string {
  const masterKey = requireLocalKmsMasterKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv)
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintextBase64, "utf8")), cipher.final()])
  const tag = cipher.getAuthTag()
  const packed = Buffer.concat([Buffer.from("L1"), iv, tag, ciphertext]).toString("base64")
  return packed
}

function localDecrypt(ciphertextBase64: string): string {
  const masterKey = requireLocalKmsMasterKey()
  const packed = Buffer.from(ciphertextBase64, "base64")
  const magic = packed.subarray(0, 2).toString("utf8")
  if (magic !== "L1") throw new Error("Invalid local KMS payload")
  const iv = packed.subarray(2, 14)
  const tag = packed.subarray(14, 30)
  const ciphertext = packed.subarray(30)
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
  return plaintext
}

async function ovhRequestJson(path: string, payload: unknown): Promise<any> {
  const baseUrl = String(env.ovhKmsBaseUrl || "").trim().replace(/\/+$/, "")
  const serviceKeyId = String(env.ovhKmsServiceKeyId || "").trim()
  if (!baseUrl || !serviceKeyId) {
    throw new Error("OVH_KMS_BASE_URL and OVH_KMS_SERVICE_KEY_ID are required when KMS_PROVIDER=ovh")
  }

  const cert = readFileIfPresent(env.ovhKmsClientCertPath)
  const key = readFileIfPresent(env.ovhKmsClientKeyPath)
  const ca = readFileIfPresent(env.ovhKmsCaPath)
  if (!cert || !key) {
    throw new Error("OVH_KMS_CLIENT_CERT_PATH and OVH_KMS_CLIENT_KEY_PATH are required when KMS_PROVIDER=ovh")
  }

  const requestBody = JSON.stringify(payload)
  const url = new URL(`${baseUrl}/v1/servicekey/${encodeURIComponent(serviceKeyId)}${path}`)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : undefined,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        cert,
        key,
        ca,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(requestBody).toString(),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8")
          const status = Number(res.statusCode || 0)
          if (status < 200 || status >= 300) {
            reject(new Error(`OVH KMS error ${status}: ${body}`))
            return
          }
          try {
            resolve(body ? JSON.parse(body) : {})
          } catch (error) {
            reject(new Error(`OVH KMS invalid JSON response: ${String((error as Error).message || error)}`))
          }
        })
      },
    )

    req.on("error", reject)
    req.write(requestBody)
    req.end()
  })
}

async function ovhEncrypt(plaintextBase64: string): Promise<string> {
  const response = (await ovhRequestJson("/encrypt", {
    plaintext: plaintextBase64,
    context: env.ovhKmsContext,
  })) as OvhEncryptResponse

  const ciphertext = String(response.ciphertext || response.encryptedData || response.data || "").trim()
  if (!ciphertext) {
    throw new Error("OVH KMS encrypt response did not include ciphertext")
  }
  return ciphertext
}

async function ovhDecrypt(ciphertext: string): Promise<string> {
  const response = (await ovhRequestJson("/decrypt", {
    ciphertext,
    context: env.ovhKmsContext,
  })) as OvhDecryptResponse

  const plaintext = String(response.plaintext || response.decryptedData || response.data || "").trim()
  if (!plaintext) {
    throw new Error("OVH KMS decrypt response did not include plaintext")
  }
  return plaintext
}

export async function kmsWrapArkBytes(arkBytes: Uint8Array): Promise<string> {
  const plaintextBase64 = toBase64(arkBytes)
  if (env.kmsProvider === "ovh") {
    return ovhEncrypt(plaintextBase64)
  }
  if (env.kmsProvider !== "local") {
    throw new Error(`Unsupported KMS_PROVIDER: ${env.kmsProvider}`)
  }
  return localEncrypt(plaintextBase64)
}

export async function kmsUnwrapArkBytes(wrappedArk: string): Promise<Uint8Array> {
  const ciphertext = String(wrappedArk || "").trim()
  if (!ciphertext) {
    throw new Error("Missing wrapped ARK payload")
  }
  const plaintextBase64 =
    env.kmsProvider === "ovh"
      ? await ovhDecrypt(ciphertext)
      : env.kmsProvider === "local"
        ? localDecrypt(ciphertext)
        : (() => {
            throw new Error(`Unsupported KMS_PROVIDER: ${env.kmsProvider}`)
          })()
  return fromBase64(plaintextBase64)
}
