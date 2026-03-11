import type { Client } from "./Client"
import type { Note } from "./Note"
import type { OrganizationSettings } from "./OrganizationSettings"
import type { Report } from "./Report"
import type { Session } from "./Session"
import type { Snippet } from "./Snippet"
import type { Trajectory } from "./Trajectory"
import type { UserSettings } from "./UserSettings"

export type WorkspaceData = {
  clients: Client[]
  trajectories: Trajectory[]
  sessions: Session[]
  reports: Report[]
  snippets: Snippet[]
  notes: Note[]
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
}
