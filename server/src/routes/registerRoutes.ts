import type { Express, RequestHandler } from "express"
import { authImplementationVersion } from "../auth"
import { env } from "../env"
import { registerAiRoutes } from "./aiRoutes"
import { registerAppDataRoutes } from "./appDataRoutes"
import { registerAuthRoutes } from "./authRoutes"
import { registerBillingRoutes } from "./billingRoutes"
import { registerE2eeRoutes } from "./e2eeRoutes"
import { registerFeedbackRoutes } from "./feedbackRoutes"
import { registerSystemRoutes } from "./systemRoutes"
import { registerTranscriptionRoutes } from "./transcriptionRoutes"

type RegisterRoutesParams = {
  diagnosticLogVersion: string
  rateLimitAi: RequestHandler
  rateLimitBilling: RequestHandler
  rateLimitTranscription: RequestHandler
  rateLimitAccount: RequestHandler
  hasDatabaseUrl: boolean
  databaseSsl: "on" | "off"
  hasAzureStorageAccountName: boolean
  hasAzureStorageAccountKey: boolean
  hasEntraOpenIdConfigurationUrl: boolean
  hasEntraAudience: boolean
  hasMistralApiKey: boolean
  hasRevenueCatSecretKey: boolean
  runtimeEnvironment: string
  hasCorsAllowlist: boolean
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  azureSpeechConfigured: boolean
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
    hasMistralApiKey: params.hasMistralApiKey,
    mistralTranscriptionModel: env.mistralTranscriptionModel,
    hasRevenueCatSecretKey: params.hasRevenueCatSecretKey,
    runtimeEnvironment: params.runtimeEnvironment,
    hasCorsAllowlist: params.hasCorsAllowlist,
    rateLimitWindowMs: params.rateLimitWindowMs,
    rateLimitMaxRequests: params.rateLimitMaxRequests,
    azureSpeechConfigured: params.azureSpeechConfigured,
  })

  registerAuthRoutes(app)
  registerE2eeRoutes(app, { rateLimitAccount: params.rateLimitAccount })
  registerAppDataRoutes(app)
  registerAiRoutes(app, { rateLimitAi: params.rateLimitAi })
  registerFeedbackRoutes(app, { rateLimitAccount: params.rateLimitAccount })
  registerBillingRoutes(app, { rateLimitBilling: params.rateLimitBilling })
  registerTranscriptionRoutes(app, { rateLimitTranscription: params.rateLimitTranscription })
}
