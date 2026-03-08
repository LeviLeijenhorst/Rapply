import type { Express } from "express"
import { registerActivityTemplateRoutes } from "./appData/activityTemplateRoutes"
import { registerActivityRoutes } from "./appData/activityRoutes"
import { registerAppDataAccountRoutes } from "./appData/accountRoutes"
import { registerCoacheeRoutes } from "./appData/coacheeRoutes"
import { registerNoteRoutes } from "./appData/noteRoutes"
import { registerPracticeSettingsRoutes } from "./appData/practiceSettingsRoutes"
import { registerAppDataReadRoutes } from "./appData/readRoutes"
import { registerSessionRoutes } from "./appData/sessionRoutes"
import { registerSnippetRoutes } from "./appData/snippetRoutes"
import { registerTemplateRoutes } from "./appData/templateRoutes"
import { registerTrajectoryRoutes } from "./appData/trajectoryRoutes"
import { registerWrittenReportRoutes } from "./appData/writtenReportRoutes"

// Registers app data CRUD routes for coachees, sessions, notes, templates, and settings.
export function registerAppDataRoutes(app: Express): void {
  registerAppDataReadRoutes(app)
  registerCoacheeRoutes(app)
  registerTrajectoryRoutes(app)
  registerSessionRoutes(app)
  registerActivityRoutes(app)
  registerActivityTemplateRoutes(app)
  registerSnippetRoutes(app)
  registerNoteRoutes(app)
  registerTemplateRoutes(app)
  registerWrittenReportRoutes(app)
  registerPracticeSettingsRoutes(app)
  registerAppDataAccountRoutes(app)
}
