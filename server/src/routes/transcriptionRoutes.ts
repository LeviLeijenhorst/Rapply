import type { Express } from "express"
import { registerTranscriptionCancelRoutes } from "./transcription/cancelRoutes"
import { registerTranscriptionPreflightRoutes } from "./transcription/preflightRoutes"
import { registerTranscriptionRealtimeRoutes } from "./transcription/realtimeRoutes"
import { registerTranscriptionStartRoutes } from "./transcription/startRoutes"
import type { RegisterTranscriptionRoutesParams } from "./transcription/types"

// Registers transcription preflight, execution, and cancellation routes.
export function registerTranscriptionRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  registerTranscriptionRealtimeRoutes(app, params)
  registerTranscriptionPreflightRoutes(app, params)
  registerTranscriptionStartRoutes(app, params)
  registerTranscriptionCancelRoutes(app, params)
}

