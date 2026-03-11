import crypto from "crypto"
import { Transform } from "stream"

// Decodes and validates a base64 AES key for CSA1 payloads.
export function ensureValidAesKey(keyBase64: string) {
  const key = Buffer.from(String(keyBase64 || ""), "base64")
  if (key.length !== 32 && key.length !== 24 && key.length !== 16) {
    throw new Error("Invalid AES key length")
  }
  return key
}

export class Csa1DecryptStream extends Transform {
  private header = Buffer.alloc(0)
  private tail = Buffer.alloc(0)
  private decipher: crypto.DecipherGCM | null = null
  private key: Buffer

  constructor(key: Buffer) {
    super()
    this.key = key
  }

  // Decrypts incoming ciphertext while keeping the final auth tag buffered.
  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    try {
      let buf = chunk

      if (!this.decipher) {
        this.header = Buffer.concat([this.header, buf])
        if (this.header.length < 16) {
          callback()
          return
        }
        const headerBytes = this.header.subarray(0, 16)
        const magic = headerBytes.subarray(0, 4).toString("ascii")
        if (magic !== "CSA1") {
          callback(new Error("Unsupported encrypted file format"))
          return
        }
        const nonce = headerBytes.subarray(4, 16)
        this.decipher = crypto.createDecipheriv(`aes-${this.key.length * 8}-gcm`, this.key, nonce) as crypto.DecipherGCM
        buf = this.header.subarray(16)
        this.header = Buffer.alloc(0)
      }

      if (buf.length > 0) {
        const combined = Buffer.concat([this.tail, buf])
        if (combined.length <= 16) {
          this.tail = combined
          callback()
          return
        }
        const toDecipher = combined.subarray(0, combined.length - 16)
        this.tail = combined.subarray(combined.length - 16)
        const out = this.decipher!.update(toDecipher)
        if (out.length) this.push(out)
      }

      callback()
    } catch (e: any) {
      callback(e)
    }
  }

  // Finalizes decryption after applying the buffered auth tag.
  _flush(callback: (error?: Error | null) => void) {
    try {
      if (!this.decipher) {
        callback(new Error("Missing encrypted header"))
        return
      }
      if (this.tail.length !== 16) {
        callback(new Error("Missing auth tag"))
        return
      }
      this.decipher.setAuthTag(this.tail)
      const out = this.decipher.final()
      if (out.length) this.push(out)
      callback()
    } catch (e: any) {
      callback(e)
    }
  }
}

