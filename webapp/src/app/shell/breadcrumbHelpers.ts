import { getClientDisplayName } from '../../types/client'
import type { RouteState } from './routeHelpers'

type BreadcrumbItem = {
  label: string
  onPress: () => void
}

type Params = {
  clients: Array<{ id: string; name: string }>
  inputs: Array<{ id: string; title: string | null; clientId: string | null; trajectoryId: string | null }>
  trajectories: Array<{ id: string; clientId: string; name: string | null }>
  isNieuweRapportageOpen: boolean
  isRecordPageOpen: boolean
  isNewClientPageOpen: boolean
  rapportageScreenMode: 'controleren' | 'bewerken'
  selectedClientId: string | null
  selectedSessieId: string | null
  selectedSidebarItemKey: 'clients' | 'dashboard' | 'reports' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'
  selectedTrajectoryId: string | null
  navigateTo: (route: RouteState) => void
}

export function buildBreadcrumbItems(params: Params): BreadcrumbItem[] {
  const {
    clients,
    inputs,
    trajectories,
    isNieuweRapportageOpen,
    isRecordPageOpen,
    isNewClientPageOpen,
    rapportageScreenMode,
    selectedClientId,
    selectedSessieId,
    selectedSidebarItemKey,
    selectedTrajectoryId,
    navigateTo,
  } = params

  if (isRecordPageOpen) return [{ label: 'Opnemen', onPress: () => navigateTo({ kind: 'record' }) }]
  if (isNewClientPageOpen) return [{ label: 'Nieuwe cliënt', onPress: () => navigateTo({ kind: 'new-client' }) }]

  if (isNieuweRapportageOpen) {
    const rapportageLabel = rapportageScreenMode === 'bewerken' ? 'Rapportage bewerken' : 'Rapportage controleren'
    const activeClientId = selectedClientId
    if (activeClientId) {
      const clientName = clients.find((item) => item.id === activeClientId)?.name ?? 'Cliënt'
      return [
        { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
        { label: clientName, onPress: () => navigateTo({ kind: 'client', clientId: activeClientId }) },
        { label: rapportageLabel, onPress: () => navigateTo({ kind: 'nieuwe-rapportage' }) },
      ]
    }
    return [
      { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
      { label: rapportageLabel, onPress: () => navigateTo({ kind: 'nieuwe-rapportage' }) },
    ]
  }

  if (selectedSessieId) {
    const session = inputs.find((item) => item.id === selectedSessieId)
    if (!session) return []
    const sessionTitle = session.title ?? 'Sessie'
    const trajectory = session.trajectoryId ? trajectories.find((item) => item.id === session.trajectoryId) ?? null : null
    const clientId = trajectory?.clientId ?? session.clientId
    if (clientId && trajectory) {
      const clientName = getClientDisplayName(clients, clientId)
      return [
        { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
        { label: clientName, onPress: () => navigateTo({ kind: 'client', clientId }) },
        { label: trajectory.name || 'Traject', onPress: () => navigateTo({ kind: 'trajectory', clientId, trajectoryId: trajectory.id }) },
        { label: sessionTitle, onPress: () => navigateTo({ kind: 'item', clientId, trajectoryId: trajectory.id, itemId: selectedSessieId }) },
      ]
    }
    if (clientId) {
      const clientName = getClientDisplayName(clients, clientId)
      return [
        { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
        { label: clientName, onPress: () => navigateTo({ kind: 'client', clientId }) },
        { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
      ]
    }
    return [
      { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
      { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
    ]
  }

  if (selectedSidebarItemKey === 'clients' && selectedClientId && selectedTrajectoryId) {
    const clientName = clients.find((item) => item.id === selectedClientId)?.name ?? 'Cliënt'
    const trajectoryName = trajectories.find((item) => item.id === selectedTrajectoryId)?.name ?? 'Traject'
    return [
      { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
      { label: clientName, onPress: () => navigateTo({ kind: 'client', clientId: selectedClientId }) },
      { label: trajectoryName, onPress: () => navigateTo({ kind: 'trajectory', clientId: selectedClientId, trajectoryId: selectedTrajectoryId }) },
    ]
  }

  if (selectedSidebarItemKey === 'clients' && selectedClientId) {
    const clientName = clients.find((item) => item.id === selectedClientId)?.name ?? 'Cliënt'
    return [
      { label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) },
      { label: clientName, onPress: () => navigateTo({ kind: 'client', clientId: selectedClientId }) },
    ]
  }

  if (selectedSidebarItemKey === 'clients') return [{ label: 'Cliënten', onPress: () => navigateTo({ kind: 'clients' }) }]
  if (selectedSidebarItemKey === 'dashboard') return [{ label: 'Dashboard', onPress: () => navigateTo({ kind: 'dashboard' }) }]
  if (selectedSidebarItemKey === 'reports') return [{ label: 'Rapportages', onPress: () => navigateTo({ kind: 'reports' }) }]
  if (selectedSidebarItemKey === 'mijnPraktijk') return [{ label: 'Mijn organisatie', onPress: () => navigateTo({ kind: 'mijn-praktijk' }) }]
  if (selectedSidebarItemKey === 'admin') return [{ label: 'Admin', onPress: () => navigateTo({ kind: 'admin' }) }]
  if (selectedSidebarItemKey === 'adminContact') return [{ label: 'Contactberichten', onPress: () => navigateTo({ kind: 'admin-contact' }) }]
  if (selectedSidebarItemKey === 'adminWachtlijst') return [{ label: 'Wachtlijst', onPress: () => navigateTo({ kind: 'admin-wachtlijst' }) }]
  return [{ label: 'Coachscribe', onPress: () => navigateTo({ kind: 'clients' }) }]
}



