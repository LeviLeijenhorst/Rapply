import type { Express } from "express"

type RegisterSystemRoutesParams = {
  authImplementationVersion: number
  diagnosticLogVersion: string
  hasDatabaseUrl: boolean
  databaseSsl: "on" | "off"
  hasAzureStorageAccountName: boolean
  hasAzureStorageAccountKey: boolean
  transcriptionUploadsContainer: string
  hasEntraOpenIdConfigurationUrl: boolean
  hasEntraAudience: boolean
  hasRevenueCatSecretKey: boolean
  hasMollieApiKey: boolean
  hasMollieWebhookUrl: boolean
  hasMollieRedirectUrl: boolean
  runtimeEnvironment: string
  hasCorsAllowlist: boolean
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  azureSpeechConfigured: boolean
  getRequiredSchemaCheckStatus: () => { checkedAtUnixMs: number | null; missingRequiredColumns: string[] }
}

// Registers non-sensitive diagnostic and health endpoints.
export function registerSystemRoutes(app: Express, params: RegisterSystemRoutesParams): void {
  app.get("/health", (_req, res) => {
    const schema = params.getRequiredSchemaCheckStatus()
    res.status(200).json({
      ok: true,
      build: {
        authImplementationVersion: params.authImplementationVersion,
        diagnosticLogVersion: params.diagnosticLogVersion,
      },
      config: {
        database: {
          hasDatabaseUrl: params.hasDatabaseUrl,
          ssl: params.databaseSsl,
          schemaCheck: {
            checkedAtUnixMs: schema.checkedAtUnixMs,
            missingRequiredColumnsCount: schema.missingRequiredColumns.length,
            missingRequiredColumns: schema.missingRequiredColumns,
          },
        },
        azureStorage: {
          hasAccountName: params.hasAzureStorageAccountName,
          hasAccountKey: params.hasAzureStorageAccountKey,
          transcriptionUploadsContainer: params.transcriptionUploadsContainer,
        },
        entra: {
          hasOpenIdConfigurationUrl: params.hasEntraOpenIdConfigurationUrl,
          hasAudience: params.hasEntraAudience,
        },
        revenuecat: {
          hasSecretKey: params.hasRevenueCatSecretKey,
        },
        mollie: {
          hasApiKey: params.hasMollieApiKey,
          hasWebhookUrl: params.hasMollieWebhookUrl,
          hasRedirectUrl: params.hasMollieRedirectUrl,
        },
        security: {
          runtimeEnvironment: params.runtimeEnvironment,
          hasCorsAllowlist: params.hasCorsAllowlist,
          rateLimitWindowMs: params.rateLimitWindowMs,
          rateLimitMaxRequests: params.rateLimitMaxRequests,
        },
      },
    })
  })

  app.get("/debug/transcription-provider", (_req, res) => {
    res.status(200).json({
      azureSpeechConfigured: params.azureSpeechConfigured,
    })
  })
}
