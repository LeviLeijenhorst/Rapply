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
  inputs: Session[]
  sessions: Session[]
  reports: Report[]
  snippets: Snippet[]
  notes: Note[]
  templates: Array<{
    id: string
    name: string
    description: string
  }>
  organizationSettings: OrganizationSettings
  userSettings: UserSettings
  organizationMemberships?: Array<{ organizationId: string; role: "admin" | "regular" }>
}
