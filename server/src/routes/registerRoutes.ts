import type { Express, RequestHandler } from "express"
import { registerActivityAiRoutes } from "../activities/routes/registerActivityAiRoutes"
import { registerActivityRoutes } from "../activities/routes/registerActivityRoutes"
import { registerActivityTemplateRoutes } from "../activities/routes/registerActivityTemplateRoutes"
import { registerAccountRoutes } from "../account/routes/registerAccountRoutes"
import { authImplementationVersion } from "../auth"
import { registerChatRoutes } from "../chat/routes/registerChatRoutes"
import { registerClientRoutes } from "../clients/routes/registerClientRoutes"
import { registerEncryptionRoutes } from "../encryption/routes/registerEncryptionRoutes"
import { env } from "../env"
import { registerNoteRoutes } from "../notes/routes/registerNoteRoutes"
import { registerPracticeSettingsRoutes } from "../practiceSettings/routes/registerPracticeSettingsRoutes"
import { registerReportRoutes } from "../reports/routes/registerReportRoutes"
import { registerSessionRoutes } from "../sessions/routes/registerSessionRoutes"
import { registerSnippetAiRoutes } from "../snippets/routes/registerSnippetAiRoutes"
import { registerSnippetRoutes } from "../snippets/routes/registerSnippetRoutes"
import { registerSummaryRoutes } from "../summaries/routes/registerSummaryRoutes"
import { registerTemplateRoutes } from "../templates/routes/registerTemplateRoutes"
import { registerTrajectoryRoutes } from "../trajectories/routes/registerTrajectoryRoutes"
import { registerAnalyticsRoutes } from "../analytics/registerAnalyticsRoutes"
import { registerBillingRoutes } from "../billing/routes/registerBillingRoutes"
import { registerFeedbackRoutes } from "../feedback/registerFeedbackRoutes"
import { registerAuthRoutes } from "../identity/routes/registerAuthRoutes"
import { registerSystemRoutes } from "../system/registerSystemRoutes"
import { registerAdminTranscriptionRoutes } from "../transcription/routes/registerAdminTranscriptionRoutes"
import { registerTranscriptionRoutes } from "../transcription/routes/registerTranscriptionRoutes"
import { registerWorkspaceRoutes } from "../workspace/routes/registerWorkspaceRoutes"

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
  registerAnalyticsRoutes(app, { rateLimitAccount: params.rateLimitAccount, rateLimitPublic: params.rateLimitPublic })
  registerEncryptionRoutes(app, { rateLimitAccount: params.rateLimitAccount })
  registerWorkspaceRoutes(app)
  registerClientRoutes(app)
  registerTrajectoryRoutes(app)
  registerSessionRoutes(app)
  registerActivityRoutes(app)
  registerActivityTemplateRoutes(app)
  registerSnippetRoutes(app)
  registerNoteRoutes(app)
  registerTemplateRoutes(app)
  registerReportRoutes(app)
  registerPracticeSettingsRoutes(app)
  registerAccountRoutes(app)
  registerChatRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerSummaryRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerSnippetAiRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerActivityAiRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerFeedbackRoutes(app, { rateLimitAccount: params.rateLimitAccount, rateLimitPublic: params.rateLimitPublic })
  registerAdminTranscriptionRoutes(app, { rateLimitAccount: params.rateLimitAccount })
  registerBillingRoutes(app, { rateLimitBilling: params.rateLimitBilling })
  registerTranscriptionRoutes(app, { rateLimitTranscription: params.rateLimitTranscription })
}
