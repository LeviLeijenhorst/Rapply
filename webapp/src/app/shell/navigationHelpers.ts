import type { SidebarItemKey } from './components/Sidebar'
import type { RouteState } from './routeHelpers'

type MainContentKeyParams = {
  isAdminContactScreenOpen: boolean
  isAdminScreenOpen: boolean
  isAdminWachtlijstScreenOpen: boolean
  isNieuweRapportageOpen: boolean
  rapportageScreenMode: 'controleren' | 'bewerken'
  isRecordPageOpen: boolean
  isNewClientPageOpen: boolean
  overlayScreenKey: 'archief' | null
  selectedClientId: string | null
  selectedSessieId: string | null
  selectedSidebarItemKey: SidebarItemKey
  selectedTrajectoryId: string | null
}

export function getMainContentKey(params: MainContentKeyParams): string {
  if (params.overlayScreenKey) return params.overlayScreenKey
  if (params.isAdminScreenOpen) return 'admin'
  if (params.isAdminContactScreenOpen) return 'admin-contact'
  if (params.isAdminWachtlijstScreenOpen) return 'admin-wachtlijst'
  if (params.isNieuweRapportageOpen) return `nieuwe-rapportage-${params.rapportageScreenMode}`
  if (params.isRecordPageOpen) return 'record-page'
  if (params.isNewClientPageOpen) return 'new-client-page'
  if (params.selectedSessieId) return `sessie-${params.selectedSessieId}`
  if (params.selectedSidebarItemKey === 'dashboard') return 'dashboard'
  if (params.selectedSidebarItemKey === 'clients') {
    if (params.selectedTrajectoryId) return `trajectory-${params.selectedTrajectoryId}`
    return params.selectedClientId ? `client-${params.selectedClientId}` : 'clients'
  }
  return params.selectedSidebarItemKey
}

type CurrentRouteParams = {
  isAdminContactScreenOpen: boolean
  isAdminScreenOpen: boolean
  isAdminWachtlijstScreenOpen: boolean
  isNieuweRapportageOpen: boolean
  isRecordPageOpen: boolean
  isNewClientPageOpen: boolean
  overlayScreenKey: 'archief' | null
  selectedClientId: string | null
  selectedSessieId: string | null
  selectedSidebarItemKey: SidebarItemKey
  selectedTrajectoryId: string | null
}

export function getCurrentRouteFromSelection(params: CurrentRouteParams): RouteState {
  if (params.overlayScreenKey === 'archief') return { kind: 'archief' }
  if (params.isAdminScreenOpen) return { kind: 'admin' }
  if (params.isAdminContactScreenOpen) return { kind: 'admin-contact' }
  if (params.isAdminWachtlijstScreenOpen) return { kind: 'admin-wachtlijst' }
  if (params.isNieuweRapportageOpen) return { kind: 'nieuwe-rapportage' }
  if (params.isRecordPageOpen) return { kind: 'record' }
  if (params.isNewClientPageOpen) return { kind: 'new-client' }
  if (params.selectedSessieId && params.selectedClientId && params.selectedTrajectoryId) {
    return { kind: 'item', clientId: params.selectedClientId, trajectoryId: params.selectedTrajectoryId, itemId: params.selectedSessieId }
  }
  if (params.selectedSessieId) return { kind: 'sessie', sessieId: params.selectedSessieId }
  if (params.selectedSidebarItemKey === 'dashboard') return { kind: 'dashboard' }
  if (params.selectedSidebarItemKey === 'reports') return { kind: 'reports' }
  if (params.selectedSidebarItemKey === 'clients') {
    if (params.selectedClientId && params.selectedTrajectoryId) {
      return { kind: 'trajectory', clientId: params.selectedClientId, trajectoryId: params.selectedTrajectoryId }
    }
    return params.selectedClientId ? { kind: 'client', clientId: params.selectedClientId } : { kind: 'clients' }
  }
  if (params.selectedSidebarItemKey === 'mijnPraktijk') return { kind: 'mijn-praktijk' }
  if (params.selectedSidebarItemKey === 'mijnProfiel') return { kind: 'mijn-profiel' }
  if (params.selectedSidebarItemKey === 'admin') return { kind: 'admin' }
  if (params.selectedSidebarItemKey === 'adminContact') return { kind: 'admin-contact' }
  if (params.selectedSidebarItemKey === 'adminWachtlijst') return { kind: 'admin-wachtlijst' }
  return { kind: 'clients' }
}


