import type { Activity } from "./Activity"
import type { ActivityTemplate } from "./ActivityTemplate"
import type { Client } from "./Client"
import type { Note } from "./Note"
import type { PracticeSettings } from "./PracticeSettings"
import type { Report } from "./Report"
import type { Session } from "./Session"
import type { Snippet } from "./Snippet"
import type { Template } from "./Template"
import type { Trajectory } from "./Trajectory"

export type WorkspaceData = {
  clients: Client[]
  trajectories: Trajectory[]
  sessions: Session[]
  reports: Report[]
  activities: Activity[]
  activityTemplates: ActivityTemplate[]
  snippets: Snippet[]
  notes: Note[]
  templates: Template[]
  practiceSettings: PracticeSettings
}
