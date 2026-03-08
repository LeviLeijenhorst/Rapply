import type { SidebarItemKey } from '../Sidebar'
import type { RouteState } from './routeHelpers'

type MainContentKeyParams = {
  isAdminContactScreenOpen: boolean
  isAdminScreenOpen: boolean
  isAdminWachtlijstScreenOpen: boolean
  isGeschrevenVerslagOpen: boolean
  isNieuweRapportageOpen: boolean
  rapportageScreenMode: 'controleren' | 'bewerken'
  isRecordPageOpen: boolean
  isNewClientPageOpen: boolean
  overlayScreenKey: 'archief' | null
  selectedCoacheeId: string | null
  selectedSessieId: string | null
  selectedSidebarItemKey: SidebarItemKey
  selectedTrajectoryId: string | null
}

export function getMainContentKey(params: MainContentKeyParams): string {
  if (params.overlayScreenKey) return params.overlayScreenKey
  if (params.isAdminScreenOpen) return 'admin'
  if (params.isAdminContactScreenOpen) return 'admin-contact'
  if (params.isAdminWachtlijstScreenOpen) return 'admin-wachtlijst'
  if (params.isGeschrevenVerslagOpen) return 'geschreven-verslag'
  if (params.isNieuweRapportageOpen) return `nieuwe-rapportage-${params.rapportageScreenMode}`
  if (params.isRecordPageOpen) return 'record-page'
  if (params.isNewClientPageOpen) return 'new-client-page'
  if (params.selectedSessieId) return `sessie-${params.selectedSessieId}`
  if (params.selectedSidebarItemKey === 'activities') return 'activities'
  if (params.selectedSidebarItemKey === 'coachees') {
    if (params.selectedTrajectoryId) return `trajectory-${params.selectedTrajectoryId}`
    return params.selectedCoacheeId ? `coachee-${params.selectedCoacheeId}` : 'coachees'
  }
  return params.selectedSidebarItemKey
}

type CurrentRouteParams = {
  isAdminContactScreenOpen: boolean
  isAdminScreenOpen: boolean
  isAdminWachtlijstScreenOpen: boolean
  isGeschrevenVerslagOpen: boolean
  isNieuweRapportageOpen: boolean
  isRecordPageOpen: boolean
  isNewClientPageOpen: boolean
  overlayScreenKey: 'archief' | null
  selectedCoacheeId: string | null
  selectedSessieId: string | null
  selectedSidebarItemKey: SidebarItemKey
  selectedTrajectoryId: string | null
}

export function getCurrentRouteFromSelection(params: CurrentRouteParams): RouteState {
  if (params.overlayScreenKey === 'archief') return { kind: 'archief' }
  if (params.isAdminScreenOpen) return { kind: 'admin' }
  if (params.isAdminContactScreenOpen) return { kind: 'admin-contact' }
  if (params.isAdminWachtlijstScreenOpen) return { kind: 'admin-wachtlijst' }
  if (params.isGeschrevenVerslagOpen) return { kind: 'geschrevenVerslag' }
  if (params.isNieuweRapportageOpen) return { kind: 'nieuwe-rapportage' }
  if (params.isRecordPageOpen) return { kind: 'record' }
  if (params.isNewClientPageOpen) return { kind: 'new-client' }
  if (params.selectedSessieId && params.selectedCoacheeId && params.selectedTrajectoryId) {
    return { kind: 'item', coacheeId: params.selectedCoacheeId, trajectoryId: params.selectedTrajectoryId, itemId: params.selectedSessieId }
  }
  if (params.selectedSessieId) return { kind: 'sessie', sessieId: params.selectedSessieId }
  if (params.selectedSidebarItemKey === 'activities') return { kind: 'activities' }
  if (params.selectedSidebarItemKey === 'reports') return { kind: 'reports' }
  if (params.selectedSidebarItemKey === 'coachees') {
    if (params.selectedCoacheeId && params.selectedTrajectoryId) {
      return { kind: 'trajectory', coacheeId: params.selectedCoacheeId, trajectoryId: params.selectedTrajectoryId }
    }
    return params.selectedCoacheeId ? { kind: 'coachee', coacheeId: params.selectedCoacheeId } : { kind: 'coachees' }
  }
  if (params.selectedSidebarItemKey === 'mijnPraktijk') return { kind: 'mijn-praktijk' }
  if (params.selectedSidebarItemKey === 'admin') return { kind: 'admin' }
  if (params.selectedSidebarItemKey === 'adminContact') return { kind: 'admin-contact' }
  if (params.selectedSidebarItemKey === 'adminWachtlijst') return { kind: 'admin-wachtlijst' }
  return { kind: 'coachees' }
}
