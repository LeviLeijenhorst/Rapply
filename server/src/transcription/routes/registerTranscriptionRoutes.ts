import type { Express } from "express"
import { registerTranscriptionCancelRoutes } from "./registerTranscriptionCancelRoutes"
import { registerTranscriptionOperationRoutes } from "./registerTranscriptionOperationRoutes"
import { registerTranscriptionPreflightRoutes } from "./registerTranscriptionPreflightRoutes"
import { registerRealtimeTranscriptionRoutes } from "./registerRealtimeTranscriptionRoutes"
import { registerTranscriptionStartRoutes } from "./registerTranscriptionStartRoutes"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers every public transcription route.
export function registerTranscriptionRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  registerRealtimeTranscriptionRoutes(app, params)
  registerTranscriptionPreflightRoutes(app, params)
  registerTranscriptionStartRoutes(app, params)
  registerTranscriptionOperationRoutes(app, params)
  registerTranscriptionCancelRoutes(app, params)
}
