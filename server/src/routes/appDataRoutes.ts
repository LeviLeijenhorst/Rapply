import type { Express } from "express"
import { registerAppDataAccountRoutes } from "./appData/accountRoutes"
import { registerCoacheeRoutes } from "./appData/coacheeRoutes"
import { registerNoteRoutes } from "./appData/noteRoutes"
import { registerPracticeSettingsRoutes } from "./appData/practiceSettingsRoutes"
import { registerAppDataReadRoutes } from "./appData/readRoutes"
import { registerSessionRoutes } from "./appData/sessionRoutes"
import { registerTemplateRoutes } from "./appData/templateRoutes"
import { registerWrittenReportRoutes } from "./appData/writtenReportRoutes"

// Registers app data CRUD routes for coachees, sessions, notes, templates, and settings.
export function registerAppDataRoutes(app: Express): void {
  registerAppDataReadRoutes(app)
  registerCoacheeRoutes(app)
  registerSessionRoutes(app)
  registerNoteRoutes(app)
  registerTemplateRoutes(app)
  registerWrittenReportRoutes(app)
  registerPracticeSettingsRoutes(app)
  registerAppDataAccountRoutes(app)
}
