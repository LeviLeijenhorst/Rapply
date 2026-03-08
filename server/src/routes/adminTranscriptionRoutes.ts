import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { isAdminEmail, normalizeEmail } from "../admin"
import { asyncHandler, sendError } from "../http"
import {
  parseTranscriptionMode,
  parseTranscriptionProvider,
  readTranscriptionModeWithMetadata,
  writeTranscriptionRuntimeSettings,
} from "../transcription/mode"

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

      const current = await readTranscriptionModeWithMetadata()
      const mode = req.body?.mode === undefined ? current.mode : parseTranscriptionMode(req.body?.mode)
      const provider = req.body?.provider === undefined ? current.provider : parseTranscriptionProvider(req.body?.provider)
      if (!mode || !provider) {
        sendError(res, 400, "Invalid mode or provider")
        return
      }

      await writeTranscriptionRuntimeSettings({ mode, provider, updatedBy: adminEmail })
      const settings = await readTranscriptionModeWithMetadata()
      res.status(200).json(settings)
    }),
  )
}
