import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../../auth"
import { asyncHandler, sendError } from "../../../http"
import { readOptionalText, readText } from "../../../routes/parsers/scalars"
import { completePipedriveAuthorization } from "../completePipedriveAuthorization"
import { createPipedriveAuthorizationUrl } from "../createPipedriveAuthorizationUrl"
import { createPipedriveImportJob } from "../createPipedriveImportJob"
import { readPipedriveImportJob } from "../readPipedriveImportJob"
import { env } from "../../../env"

function readEntityTypes(value: unknown): string[] {
  if (!Array.isArray(value)) return ["persons", "organizations", "activities", "notes", "files"]
  const types = value.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
  return types.length ? types : ["persons", "organizations", "activities", "notes", "files"]
}

export function registerPipedriveRoutes(app: Express, params: { rateLimitAccount: RequestHandler }): void {
  app.post(
    "/integrations/pipedrive/oauth/start",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const result = await createPipedriveAuthorizationUrl({ userId: user.userId })
      res.status(200).json(result)
    }),
  )

  app.get(
    "/integrations/pipedrive/oauth/callback",
    asyncHandler(async (req, res) => {
      const state = String(req.query?.state || "").trim()
      const code = String(req.query?.code || "").trim()
      if (!state || !code) {
        sendError(res, 400, "Missing state or code")
        return
      }

      const completed = await completePipedriveAuthorization({ state, code })
      const redirectBase = env.pipedriveOauthSuccessRedirectUrl
      if (!redirectBase) {
        res.status(200).json({ ok: true, connectionId: completed.connectionId, userId: completed.userId })
        return
      }

      const redirectUrl = new URL(redirectBase)
      redirectUrl.searchParams.set("provider", "pipedrive")
      redirectUrl.searchParams.set("status", "connected")
      redirectUrl.searchParams.set("connectionId", completed.connectionId)
      res.redirect(302, redirectUrl.toString())
    }),
  )

  app.post(
    "/integrations/pipedrive/imports",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const connectionId = readText(payload.connectionId, "connectionId")
      const entityTypes = readEntityTypes(payload.entityTypes)
      const mappingVersion = readOptionalText(payload.mappingVersion, true) || "v1"
      const options = payload.options && typeof payload.options === "object" ? (payload.options as Record<string, unknown>) : null

      const created = await createPipedriveImportJob({
        userId: user.userId,
        connectionId,
        entityTypes,
        mappingVersion,
        options,
      })

      res.status(200).json({ jobId: created.jobId })
    }),
  )

  app.get(
    "/integrations/pipedrive/imports/:jobId",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const jobId = readText(req.params?.jobId, "jobId")
      const job = await readPipedriveImportJob({ userId: user.userId, jobId })
      if (!job) {
        sendError(res, 404, "Import job not found")
        return
      }
      res.status(200).json({ job })
    }),
  )
}
