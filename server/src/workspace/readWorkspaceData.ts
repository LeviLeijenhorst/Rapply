import { listClients } from "../clients/store"
import { listNotes } from "../notes/store"
import { readOrganizationSettings } from "../organizationSettings/store"
import { listReports } from "../reports/store"
import { listSessions } from "../sessions/store"
import { listSnippets } from "../snippets/store"
import { readUserSettings } from "../userSettings/store"
import type { WorkspaceData } from "../types/WorkspaceData"

export async function readWorkspaceData(userId: string): Promise<WorkspaceData> {
  const [clients, sessions, reports, snippets, notes, organizationSettings, userSettings] = await Promise.all([
    listClients(userId),
    listSessions(userId),
    listReports(userId),
    listSnippets(userId),
    listNotes(userId),
    readOrganizationSettings(userId),
    readUserSettings(userId),
  ])

  return {
    clients,
    trajectories: [],
    sessions,
    reports,
    snippets,
    notes,
    organizationSettings,
    userSettings,
  }
}
