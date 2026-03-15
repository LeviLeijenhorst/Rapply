import { listClients } from "../clients/store"
import { listNotes } from "../notes/store"
import { readOrganizationSettings } from "../organizationSettings/store"
import { listReports } from "../reports/store"
import { listSessions } from "../sessions/store"
import { listSnippets } from "../snippets/store"
import { listTrajectories } from "../trajectories/store"
import { readUserSettings } from "../userSettings/store"
import type { WorkspaceData } from "../types/WorkspaceData"
import { listSupportedUwvTemplates } from "../pipeline/templates/uwvTemplates"
import { listUserOrganizationMemberships } from "../access/clientAccess"

export async function readWorkspaceData(userId: string): Promise<WorkspaceData> {
  const [clients, trajectories, inputs, reports, snippets, notes, organizationSettings, userSettings, organizationMemberships] = await Promise.all([
    listClients(userId),
    listTrajectories(userId),
    listSessions(userId),
    listReports(userId),
    listSnippets(userId),
    listNotes(userId),
    readOrganizationSettings(userId),
    readUserSettings(userId),
    listUserOrganizationMemberships(userId),
  ])

  return {
    clients,
    trajectories,
    inputs,
    sessions: inputs,
    reports,
    snippets,
    notes,
    templates: listSupportedUwvTemplates().map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
    })),
    organizationSettings,
    userSettings,
    organizationMemberships,
  }
}
