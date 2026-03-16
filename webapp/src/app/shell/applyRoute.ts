import type { Dispatch, SetStateAction } from 'react'

import type { SidebarItemKey } from './components/Sidebar'
import type { RouteState } from './routeHelpers'
import { normalizeRouteForAvailability } from './routeHelpers'

type ApplyRouteSetters = {
  setIsNieuweRapportageOpen: Dispatch<SetStateAction<boolean>>
  setIsRecordPageOpen: Dispatch<SetStateAction<boolean>>
  setIsNewClientPageOpen: Dispatch<SetStateAction<boolean>>
  setRapportageScreenMode: Dispatch<SetStateAction<'controleren' | 'bewerken'>>
  setRapportageEditInputId: Dispatch<SetStateAction<string | null>>
  setIsEndToEndEncryptiePageOpen: Dispatch<SetStateAction<boolean>>
  setSelectedSidebarItemKey: Dispatch<SetStateAction<SidebarItemKey>>
  setIsAdminScreenOpen: Dispatch<SetStateAction<boolean>>
  setIsAdminContactScreenOpen: Dispatch<SetStateAction<boolean>>
  setIsAdminWachtlijstScreenOpen: Dispatch<SetStateAction<boolean>>
  setOverlayScreenKey: Dispatch<SetStateAction<'archief' | null>>
  setSelectedSessieId: Dispatch<SetStateAction<string | null>>
  setInputIdPendingTemplatePicker: Dispatch<SetStateAction<string | null>>
  setSelectedClientId: Dispatch<SetStateAction<string | null>>
  setSelectedTrajectoryId: Dispatch<SetStateAction<string | null>>
  setInputOriginRoute: Dispatch<SetStateAction<RouteState | null>>
}

type ApplyRouteParams = ApplyRouteSetters & {
  isCurrentUserAdmin: boolean
  routeInput: RouteState
}

export function applyRouteToShell(params: ApplyRouteParams): void {
  const {
    isCurrentUserAdmin,
    routeInput,
    setIsNieuweRapportageOpen,
    setIsRecordPageOpen,
    setIsNewClientPageOpen,
    setRapportageScreenMode,
    setRapportageEditInputId,
    setIsEndToEndEncryptiePageOpen,
    setSelectedSidebarItemKey,
    setIsAdminScreenOpen,
    setIsAdminContactScreenOpen,
    setIsAdminWachtlijstScreenOpen,
    setOverlayScreenKey,
    setSelectedSessieId,
    setInputIdPendingTemplatePicker,
    setSelectedClientId,
    setSelectedTrajectoryId,
    setInputOriginRoute,
  } = params

  const route = normalizeRouteForAvailability(routeInput)

  if (route.kind !== 'nieuwe-rapportage' && route.kind !== 'rapportage') {
    setRapportageScreenMode('controleren')
    setRapportageEditInputId(null)
  }

  if (route.kind === 'archief') {
    setIsNieuweRapportageOpen(false)
    setIsRecordPageOpen(false)
    setIsNewClientPageOpen(false)
    setIsEndToEndEncryptiePageOpen(false)
    setSelectedSidebarItemKey('archief')
    setIsAdminScreenOpen(false)
    setIsAdminContactScreenOpen(false)
    setIsAdminWachtlijstScreenOpen(false)
    setOverlayScreenKey('archief')
    setSelectedSessieId(null)
    setInputIdPendingTemplatePicker(null)
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setInputOriginRoute(null)
    return
  }

  if (route.kind === 'admin' || route.kind === 'admin-contact' || route.kind === 'admin-wachtlijst') {
    setIsNieuweRapportageOpen(false)
    setIsRecordPageOpen(false)
    setIsNewClientPageOpen(false)
    if (!isCurrentUserAdmin) {
      setIsEndToEndEncryptiePageOpen(false)
      setIsAdminScreenOpen(false)
      setIsAdminContactScreenOpen(false)
      setIsAdminWachtlijstScreenOpen(false)
      setOverlayScreenKey(null)
      setSelectedSidebarItemKey('clients')
      setSelectedSessieId(null)
      setSelectedClientId(null)
      setSelectedTrajectoryId(null)
      setInputOriginRoute(null)
      return
    }
    setIsEndToEndEncryptiePageOpen(false)
    setIsAdminScreenOpen(route.kind === 'admin')
    setIsAdminContactScreenOpen(route.kind === 'admin-contact')
    setIsAdminWachtlijstScreenOpen(route.kind === 'admin-wachtlijst')
    setOverlayScreenKey(null)
    setSelectedSidebarItemKey(route.kind === 'admin' ? 'admin' : route.kind === 'admin-contact' ? 'adminContact' : 'adminWachtlijst')
    setSelectedSessieId(null)
    setInputIdPendingTemplatePicker(null)
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setInputOriginRoute(null)
    return
  }

  setIsAdminScreenOpen(false)
  setIsAdminContactScreenOpen(false)
  setIsAdminWachtlijstScreenOpen(false)
  setIsEndToEndEncryptiePageOpen(false)
  setOverlayScreenKey(null)
  setIsNieuweRapportageOpen(false)
  setIsRecordPageOpen(false)
  setIsNewClientPageOpen(false)

  if (route.kind === 'record') {
    setSelectedSidebarItemKey('clients')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    setIsRecordPageOpen(true)
    return
  }

  if (route.kind === 'new-client') {
    setSelectedSidebarItemKey('clients')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    setIsNewClientPageOpen(true)
    return
  }

  if (route.kind === 'reports') {
    setSelectedSidebarItemKey('reports')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'rapportage') {
    setSelectedSidebarItemKey('clients')
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    setRapportageScreenMode('bewerken')
    setRapportageEditInputId(route.reportId)
    setIsNieuweRapportageOpen(true)
    return
  }

  if (route.kind === 'clients') {
    setSelectedSidebarItemKey('clients')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'client') {
    setSelectedSidebarItemKey('clients')
    setSelectedClientId(route.clientId)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'trajectory') {
    setSelectedSidebarItemKey('clients')
    setSelectedClientId(route.clientId)
    setSelectedTrajectoryId(route.trajectoryId)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'dashboard') {
    setSelectedSidebarItemKey('dashboard')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'templates') {
    setSelectedSidebarItemKey('reports')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'nieuwe-rapportage') {
    setSelectedSidebarItemKey('clients')
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    setIsNieuweRapportageOpen(true)
    return
  }
  if (route.kind === 'mijn-praktijk') {
    setSelectedSidebarItemKey('mijnPraktijk')
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'sessie') {
    setSelectedSidebarItemKey('clients')
    setSelectedSessieId(route.sessieId)
    setSelectedClientId(null)
    setSelectedTrajectoryId(null)
    setInputOriginRoute(null)
    return
  }
  if (route.kind === 'item') {
    setSelectedSidebarItemKey('clients')
    setSelectedSessieId(route.itemId)
    setSelectedClientId(route.clientId)
    setSelectedTrajectoryId(route.trajectoryId)
    setInputOriginRoute({ kind: 'trajectory', clientId: route.clientId, trajectoryId: route.trajectoryId })
    return
  }
  setSelectedSidebarItemKey('clients')
  setSelectedSessieId(null)
  setSelectedClientId(null)
  setSelectedTrajectoryId(null)
  setInputOriginRoute(null)
}


