import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import * as e2eeV2 from "../../e2eeV2"
import { asyncHandler } from "../../http"
import { readId, readRequiredInteger, readRequiredObjectType, readText } from "../requestParsers"

// Registers endpoints that manage per-object E2EE DEKs.
export function registerE2eeObjectKeyRoutes(app: Express): void {
  app.post(
    "/e2ee/v2/object-key/upsert",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const objectType = readRequiredObjectType(payload.objectType)
      const objectId = readId(payload.objectId, "objectId")
      const keyVersion = readRequiredInteger(payload.keyVersion, "keyVersion")
      const cryptoVersion = readRequiredInteger(payload.cryptoVersion ?? 1, "cryptoVersion")
      const wrappedDek = readText(payload.wrappedDek, "wrappedDek")
      await e2eeV2.upsertObjectKey({
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
    "/e2ee/v2/object-key/get",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const objectType = readRequiredObjectType(payload.objectType)
      const objectId = readId(payload.objectId, "objectId")
      const objectKeys = await e2eeV2.readObjectKeys({ userId: user.userId, objectType, objectId })
      res.status(200).json({ objectKeys })
    }),
  )

  app.post(
    "/e2ee/v2/object-key/get-batch",
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

      const objectKeys = await e2eeV2.readLatestObjectKeysBatch({ userId: user.userId, refs })
      res.status(200).json({ objectKeys })
    }),
  )
}

