import type { Express } from "express"
import { registerTranscriptionCancelRoutes } from "./registerTranscriptionCancelRoutes"
import { registerTranscriptionPreflightRoutes } from "./registerTranscriptionPreflightRoutes"
import { registerTranscriptionRealtimeRoutes } from "./registerTranscriptionRealtimeRoutes"
import { registerTranscriptionStartRoutes } from "./registerTranscriptionStartRoutes"
import type { RegisterTranscriptionRoutesParams } from "./types"

export function registerTranscriptionRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  registerTranscriptionRealtimeRoutes(app, params)
  registerTranscriptionPreflightRoutes(app, params)
  registerTranscriptionStartRoutes(app, params)
  registerTranscriptionCancelRoutes(app, params)
}
