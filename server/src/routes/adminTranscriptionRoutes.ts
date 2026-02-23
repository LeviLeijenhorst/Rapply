import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { isAdminEmail, normalizeEmail } from "../admin"
import { asyncHandler, sendError } from "../http"
import { parseTranscriptionMode, readTranscriptionModeWithMetadata, writeTranscriptionMode } from "../transcription/mode"

type RegisterAdminTranscriptionRoutesParams = {
  rateLimitAccount: RequestHandler
}

async function requireAdminUserEmail(req: Parameters<typeof requireAuthenticatedUser>[0]): Promise<string> {
  const user = await requireAuthenticatedUser(req)
  const normalizedUserEmail = normalizeEmail(user.email)
  const hasAdminRole = user.accountType === "admin"
  const isBootstrapAdmin = isAdminEmail(normalizedUserEmail)
  if (!hasAdminRole && !isBootstrapAdmin) {
    const error: any = new Error("Forbidden")
    error.status = 403
    throw error as Error
  }
  return normalizedUserEmail || `admin:${user.userId}`
}

export function registerAdminTranscriptionRoutes(app: Express, params: RegisterAdminTranscriptionRoutesParams): void {
  app.post(
    "/admin/transcription/mode/get",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      try {
        await requireAdminUserEmail(req)
      } catch {
        sendError(res, 403, "Forbidden")
        return
      }

      const settings = await readTranscriptionModeWithMetadata()
      res.status(200).json(settings)
    }),
  )

  app.post(
    "/admin/transcription/mode/set",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const adminEmail = await requireAdminUserEmail(req).catch(() => null)
      if (!adminEmail) {
        sendError(res, 403, "Forbidden")
        return
      }

      const mode = parseTranscriptionMode(req.body?.mode)
      if (!mode) {
        sendError(res, 400, "Invalid mode")
        return
      }

      await writeTranscriptionMode({ mode, updatedBy: adminEmail })
      const settings = await readTranscriptionModeWithMetadata()
      res.status(200).json(settings)
    }),
  )
}
