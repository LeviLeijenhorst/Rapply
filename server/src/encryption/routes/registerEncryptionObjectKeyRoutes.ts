import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import * as e2ee from "../../encryption/e2ee"
import { asyncHandler } from "../../http"
import { readId, readRequiredInteger, readText } from "../../routes/parsers/scalars"
import { readRequiredObjectType } from "../../routes/parsers/e2ee"

// Registers endpoints that manage per-object E2EE DEKs.
export function registerE2eeObjectKeyRoutes(app: Express): void {
  app.post(
    "/e2ee/object-key/upsert",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const objectType = readRequiredObjectType(payload.objectType)
      const objectId = readId(payload.objectId, "objectId")
      const keyVersion = readRequiredInteger(payload.keyVersion, "keyVersion")
      const cryptoVersion = readRequiredInteger(payload.cryptoVersion ?? 1, "cryptoVersion")
      const wrappedDek = readText(payload.wrappedDek, "wrappedDek")
      await e2ee.upsertObjectKey({
        userId: user.userId,
        objectType,
        objectId,
        keyVersion,
        cryptoVersion,
        wrappedDek,
        nowUnixMs: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/e2ee/object-key/get",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const objectType = readRequiredObjectType(payload.objectType)
      const objectId = readId(payload.objectId, "objectId")
      const objectKeys = await e2ee.readObjectKeys({ userId: user.userId, objectType, objectId })
      res.status(200).json({ objectKeys })
    }),
  )

  app.post(
    "/e2ee/object-key/get-batch",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const refsRaw = Array.isArray(payload.refs) ? payload.refs : []
      if (!refsRaw.length) {
        res.status(200).json({ objectKeys: [] })
        return
      }

      const refs = refsRaw.map((item: unknown, index: number) => {
        const objectType = readRequiredObjectType((item as any)?.objectType)
        const objectId = readId((item as any)?.objectId, `refs[${index}].objectId`)
        return { objectType, objectId }
      })

      const objectKeys = await e2ee.readLatestObjectKeysBatch({ userId: user.userId, refs })
      res.status(200).json({ objectKeys })
    }),
  )
}
