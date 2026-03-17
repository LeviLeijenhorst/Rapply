import type { Express, RequestHandler } from "express"
import { registerAccountRoutes } from "../account/routes/registerAccountRoutes"
import { authImplementationVersion } from "../identity/auth"
import { requireAuthenticatedUser } from "../identity/auth"
import { registerChatRoutes } from "../chat/routes/registerChatRoutes"
import { registerClientRoutes } from "../clients/routes/registerClientRoutes"
import { registerEncryptionRoutes } from "../encryption/routes/registerEncryptionRoutes"
import { env } from "../env"
import { registerNoteRoutes } from "../notes/routes/registerNoteRoutes"
import { registerReportRoutes } from "../reports/routes/registerReportRoutes"
import { registerSessionRoutes } from "../sessions/routes/registerSessionRoutes"
import { registerSnippetRoutes } from "../snippets/routes/registerSnippetRoutes"
import { registerSummaryRoutes } from "../summaries/routes/registerSummaryRoutes"
import { registerBillingRoutes } from "../billing/routes/registerBillingRoutes"
import { registerAuthRoutes } from "../identity/routes/registerAuthRoutes"
import { registerSystemRoutes } from "../system/registerSystemRoutes"
import { registerTranscriptionRoutes } from "../transcription/routes/registerTranscriptionRoutes"
import { registerOrganizationSettingsRoutes } from "../organizationSettings/routes/registerOrganizationSettingsRoutes"
import { registerUserSettingsRoutes } from "../userSettings/routes/registerUserSettingsRoutes"
import { registerWorkspaceRoutes } from "../workspace/routes/registerWorkspaceRoutes"
import { registerTrajectoryRoutes } from "../trajectories/routes/registerTrajectoryRoutes"
import { registerPipelineRoutes } from "../pipeline/routes/registerPipelineRoutes"
import { registerMeetingRecordingRoutes } from "../meetingRecordings/routes/registerMeetingRecordingRoutes"
import { asyncHandler } from "../http"

type RegisterRoutesParams = {
  diagnosticLogVersion: string
  rateLimitAi: RequestHandler
  rateLimitBilling: RequestHandler
  rateLimitPublic: RequestHandler
  rateLimitTranscription: RequestHandler
  rateLimitAccount: RequestHandler
  hasDatabaseUrl: boolean
  databaseSsl: "on" | "off"
  hasAzureStorageAccountName: boolean
  hasAzureStorageAccountKey: boolean
  hasEntraOpenIdConfigurationUrl: boolean
  hasEntraAudience: boolean
  hasMollieApiKey: boolean
  hasMollieWebhookUrl: boolean
  hasMollieRedirectUrl: boolean
  runtimeEnvironment: string
  hasCorsAllowlist: boolean
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  azureSpeechConfigured: boolean
  speechmaticsConfigured: boolean
  getRequiredSchemaCheckStatus: () => { checkedAtUnixMs: number | null; missingRequiredColumns: string[] }
}

// Registers all API route groups in a single explicit order.
export function registerRoutes(app: Express, params: RegisterRoutesParams): void {
  registerSystemRoutes(app, {
    authImplementationVersion,
    diagnosticLogVersion: params.diagnosticLogVersion,
    hasDatabaseUrl: params.hasDatabaseUrl,
    databaseSsl: params.databaseSsl,
    hasAzureStorageAccountName: params.hasAzureStorageAccountName,
    hasAzureStorageAccountKey: params.hasAzureStorageAccountKey,
    transcriptionUploadsContainer: env.azureStorageTranscriptionUploadsContainer,
    hasEntraOpenIdConfigurationUrl: params.hasEntraOpenIdConfigurationUrl,
    hasEntraAudience: params.hasEntraAudience,
    hasMollieApiKey: params.hasMollieApiKey,
    hasMollieWebhookUrl: params.hasMollieWebhookUrl,
    hasMollieRedirectUrl: params.hasMollieRedirectUrl,
    runtimeEnvironment: params.runtimeEnvironment,
    hasCorsAllowlist: params.hasCorsAllowlist,
    rateLimitWindowMs: params.rateLimitWindowMs,
    rateLimitMaxRequests: params.rateLimitMaxRequests,
    azureSpeechConfigured: params.azureSpeechConfigured,
    speechmaticsConfigured: params.speechmaticsConfigured,
    getRequiredSchemaCheckStatus: params.getRequiredSchemaCheckStatus,
  })

  registerAuthRoutes(app)
  registerEncryptionRoutes(app, { rateLimitAccount: params.rateLimitAccount })
  registerWorkspaceRoutes(app)
  registerClientRoutes(app)
  registerTrajectoryRoutes(app)
  registerSessionRoutes(app)
  registerSnippetRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerNoteRoutes(app)
  registerReportRoutes(app)
  registerPipelineRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerOrganizationSettingsRoutes(app)
  registerUserSettingsRoutes(app)
  registerAccountRoutes(app)
  registerChatRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerSummaryRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerBillingRoutes(app, { rateLimitBilling: params.rateLimitBilling })
  registerTranscriptionRoutes(app, { rateLimitTranscription: params.rateLimitTranscription })
  registerMeetingRecordingRoutes(app, { rateLimitTranscription: params.rateLimitTranscription })

  // Keep legacy endpoints stable while features are out of scope in the new schema.
  app.post(
    "/analytics/events",
    asyncHandler(async (_req, res) => {
      res.status(200).json({ ok: true })
    }),
  )
  app.post(
    "/pricing/plans/public",
    asyncHandler(async (_req, res) => {
      res.status(200).json({ items: [] })
    }),
  )
  app.post(
    "/pricing/me-visibility",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ canSeePricingPage: false, planId: null })
    }),
  )
  app.post(
    "/templates/create",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/templates/update",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/templates/delete",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/templates/defaults",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ templates: [] })
    }),
  )
  app.post(
    "/activities/create",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/activities/update",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/activities/delete",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/activity-templates/create",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/activity-templates/update",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
  app.post(
    "/activity-templates/delete",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: true, disabled: true })
    }),
  )
}
