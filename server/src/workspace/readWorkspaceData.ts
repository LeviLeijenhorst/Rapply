import { listClients } from "../clients/store"
import { listNotes } from "../notes/store"
import { readPracticeSettings } from "../practiceSettings/store"
import { listReports } from "../reports/store"
import { listSessions } from "../sessions/store"
import { listSnippets } from "../snippets/store"
import { listTemplates } from "../templates/store"
import type { WorkspaceData } from "../types/WorkspaceData"

export async function readWorkspaceData(userId: string): Promise<WorkspaceData> {
  const [clients, sessions, reports, snippets, notes, templates, practiceSettings] = await Promise.all([
    listClients(userId),
    listSessions(userId),
    listReports(userId),
    listSnippets(userId),
    listNotes(userId),
    listTemplates(userId),
    readPracticeSettings(userId),
  ])

  return {
    clients,
    trajectories: [],
    sessions,
    reports,
    activities: [],
    activityTemplates: [],
    snippets,
    notes,
    templates,
    practiceSettings,
  }
}
