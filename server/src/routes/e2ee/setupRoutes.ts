import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import * as e2ee from "../../e2ee"
import { asyncHandler, sendError } from "../../http"
import { readOptionalInteger, readOptionalRecoveryPolicy, readOptionalText, readRequiredInteger, readRequiredNumber, readText, validateArgon2Params } from "../requestParsers"
import type { RegisterE2eeRoutesParams } from "./types"

// Registers endpoints that create or rotate E2EE user key material.
export function registerE2eeSetupRoutes(app: Express, params: RegisterE2eeRoutesParams): void {
  app.post(
    "/e2ee/setup",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}

      const argon2Salt = readText(payload.argon2Salt, "argon2Salt")
      const argon2TimeCost = readRequiredNumber(payload.argon2TimeCost, "argon2TimeCost")
      const argon2MemoryCostKib = readRequiredNumber(payload.argon2MemoryCostKib, "argon2MemoryCostKib")
      const argon2Parallelism = readRequiredNumber(payload.argon2Parallelism, "argon2Parallelism")
      const wrappedArkUserPassphrase = readText(payload.wrappedArkUserPassphrase, "wrappedArkUserPassphrase")
      const wrappedArkRecoveryCode = readOptionalText(payload.wrappedArkRecoveryCode, true) ?? null
      const keyVersion = readRequiredInteger(payload.keyVersion ?? 1, "keyVersion")
      const cryptoVersion = readRequiredInteger(payload.cryptoVersion ?? 1, "cryptoVersion")
      const recoveryPolicy = readOptionalRecoveryPolicy(payload.recoveryPolicy) ?? "self_service"
      const custodianThreshold = readOptionalInteger(payload.custodianThreshold)
      validateArgon2Params({
        argon2TimeCost,
        argon2MemoryCostKib,
        argon2Parallelism,
      })

      await e2ee.setUserManagedCustody({
        userId: user.userId,
        argon2Salt,
        argon2TimeCost,
        argon2MemoryCostKib,
        argon2Parallelism,
        wrappedArkUserPassphrase,
        wrappedArkRecoveryCode,
        keyVersion,
        cryptoVersion,
        recoveryPolicy,
        custodianThreshold,
        nowUnixMs: Date.now(),
      })

      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/e2ee/custody/disable-user-managed",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const keyVersion = readRequiredInteger(payload.keyVersion, "keyVersion")
      const arkBase64 = readText(payload.arkBase64, "arkBase64")
      const arkBytes = new Uint8Array(Buffer.from(arkBase64, "base64"))
      if (arkBytes.length !== 32) {
        sendError(res, 400, "arkBase64 must decode to 32 bytes")
        return
      }

      await e2ee.setServerManagedCustody({
        userId: user.userId,
        keyVersion,
        arkBytes,
        nowUnixMs: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/e2ee/custody/enable-user-managed",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}

      const argon2Salt = readText(payload.argon2Salt, "argon2Salt")
      const argon2TimeCost = readRequiredNumber(payload.argon2TimeCost, "argon2TimeCost")
      const argon2MemoryCostKib = readRequiredNumber(payload.argon2MemoryCostKib, "argon2MemoryCostKib")
      const argon2Parallelism = readRequiredNumber(payload.argon2Parallelism, "argon2Parallelism")
      const wrappedArkUserPassphrase = readText(payload.wrappedArkUserPassphrase, "wrappedArkUserPassphrase")
      const wrappedArkRecoveryCode = readOptionalText(payload.wrappedArkRecoveryCode, true) ?? null
      const keyVersion = readRequiredInteger(payload.keyVersion ?? 1, "keyVersion")
      const cryptoVersion = readRequiredInteger(payload.cryptoVersion ?? 1, "cryptoVersion")
      const recoveryPolicy = readOptionalRecoveryPolicy(payload.recoveryPolicy) ?? "self_service"
      const custodianThreshold = readOptionalInteger(payload.custodianThreshold)
      validateArgon2Params({
        argon2TimeCost,
        argon2MemoryCostKib,
        argon2Parallelism,
      })

      await e2ee.setUserManagedCustody({
        userId: user.userId,
        argon2Salt,
        argon2TimeCost,
        argon2MemoryCostKib,
        argon2Parallelism,
        wrappedArkUserPassphrase,
        wrappedArkRecoveryCode,
        keyVersion,
        cryptoVersion,
        recoveryPolicy,
        custodianThreshold,
        nowUnixMs: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/e2ee/recovery-code/set",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const wrappedArkRecoveryCode = readOptionalText(payload.wrappedArkRecoveryCode, true) ?? null
      await e2ee.setRecoveryWrappedArk({
        userId: user.userId,
        wrappedArkRecoveryCode,
        nowUnixMs: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/e2ee/passphrase/rotate",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const argon2Salt = readText(payload.argon2Salt, "argon2Salt")
      const argon2TimeCost = readRequiredNumber(payload.argon2TimeCost, "argon2TimeCost")
      const argon2MemoryCostKib = readRequiredNumber(payload.argon2MemoryCostKib, "argon2MemoryCostKib")
      const argon2Parallelism = readRequiredNumber(payload.argon2Parallelism, "argon2Parallelism")
      const wrappedArkUserPassphrase = readText(payload.wrappedArkUserPassphrase, "wrappedArkUserPassphrase")
      const keyVersion = readRequiredInteger(payload.keyVersion, "keyVersion")
      validateArgon2Params({
        argon2TimeCost,
        argon2MemoryCostKib,
        argon2Parallelism,
      })

      await e2ee.rotatePassphraseWrappedArk({
        userId: user.userId,
        argon2Salt,
        argon2TimeCost,
        argon2MemoryCostKib,
        argon2Parallelism,
        wrappedArkUserPassphrase,
        keyVersion,
        nowUnixMs: Date.now(),
      })

      res.status(200).json({ ok: true })
    }),
  )
}
