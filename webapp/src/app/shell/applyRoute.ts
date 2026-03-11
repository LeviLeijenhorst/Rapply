import type { Dispatch, SetStateAction } from 'react'

import type { SidebarItemKey } from './components/Sidebar'
import type { RouteState } from './routeHelpers'
import { normalizeRouteForAvailability } from './routeHelpers'

type ApplyRouteSetters = {
  setIsNieuweRapportageOpen: Dispatch<SetStateAction<boolean>>
  setIsRecordPageOpen: Dispatch<SetStateAction<boolean>>
  setIsNewClientPageOpen: Dispatch<SetStateAction<boolean>>
  setRapportageScreenMode: Dispatch<SetStateAction<'controleren' | 'bewerken'>>
  setRapportageEditSessionId: Dispatch<SetStateAction<string | null>>
  setIsEndToEndEncryptiePageOpen: Dispatch<SetStateAction<boolean>>
  setSelectedSidebarItemKey: Dispatch<SetStateAction<SidebarItemKey>>
  setIsAdminScreenOpen: Dispatch<SetStateAction<boolean>>
  setIsAdminContactScreenOpen: Dispatch<SetStateAction<boolean>>
  setIsAdminWachtlijstScreenOpen: Dispatch<SetStateAction<boolean>>
  setOverlayScreenKey: Dispatch<SetStateAction<'archief' | null>>
  setSelectedSessieId: Dispatch<SetStateAction<string | null>>
  setSessionIdPendingTemplatePicker: Dispatch<SetStateAction<string | null>>
  setSelectedCoacheeId: Dispatch<SetStateAction<string | null>>
  setSelectedTrajectoryId: Dispatch<SetStateAction<string | null>>
  setSessionOriginRoute: Dispatch<SetStateAction<RouteState | null>>
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
    setRapportageEditSessionId,
    setIsEndToEndEncryptiePageOpen,
    setSelectedSidebarItemKey,
    setIsAdminScreenOpen,
    setIsAdminContactScreenOpen,
    setIsAdminWachtlijstScreenOpen,
    setOverlayScreenKey,
    setSelectedSessieId,
    setSessionIdPendingTemplatePicker,
    setSelectedCoacheeId,
    setSelectedTrajectoryId,
    setSessionOriginRoute,
  } = params

  const route = normalizeRouteForAvailability(routeInput)

  if (route.kind !== 'nieuwe-rapportage') {
    setRapportageScreenMode('controleren')
    setRapportageEditSessionId(null)
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
    setSessionIdPendingTemplatePicker(null)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
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
      setSelectedSidebarItemKey('coachees')
      setSelectedSessieId(null)
      setSelectedCoacheeId(null)
      setSelectedTrajectoryId(null)
      setSessionOriginRoute(null)
      return
    }
    setIsEndToEndEncryptiePageOpen(false)
    setIsAdminScreenOpen(route.kind === 'admin')
    setIsAdminContactScreenOpen(route.kind === 'admin-contact')
    setIsAdminWachtlijstScreenOpen(route.kind === 'admin-wachtlijst')
    setOverlayScreenKey(null)
    setSelectedSidebarItemKey(route.kind === 'admin' ? 'admin' : route.kind === 'admin-contact' ? 'adminContact' : 'adminWachtlijst')
    setSelectedSessieId(null)
    setSessionIdPendingTemplatePicker(null)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
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
    setSelectedSidebarItemKey('coachees')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    setIsRecordPageOpen(true)
    return
  }

  if (route.kind === 'new-client') {
    setSelectedSidebarItemKey('coachees')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    setIsNewClientPageOpen(true)
    return
  }

  if (route.kind === 'reports') {
    setSelectedSidebarItemKey('reports')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }

  if (route.kind === 'coachees') {
    setSelectedSidebarItemKey('coachees')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'coachee') {
    setSelectedSidebarItemKey('coachees')
    setSelectedCoacheeId(route.coacheeId)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'trajectory') {
    setSelectedSidebarItemKey('coachees')
    setSelectedCoacheeId(route.coacheeId)
    setSelectedTrajectoryId(route.trajectoryId)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'activities') {
    setSelectedSidebarItemKey('activities')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'templates') {
    setSelectedSidebarItemKey('reports')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'nieuwe-rapportage') {
    setSelectedSidebarItemKey('coachees')
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    setIsNieuweRapportageOpen(true)
    return
  }
  if (route.kind === 'mijn-praktijk') {
    setSelectedSidebarItemKey('mijnPraktijk')
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSelectedSessieId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'sessie') {
    setSelectedSidebarItemKey('coachees')
    setSelectedSessieId(route.sessieId)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
    return
  }
  if (route.kind === 'item') {
    setSelectedSidebarItemKey('coachees')
    setSelectedSessieId(route.itemId)
    setSelectedCoacheeId(route.coacheeId)
    setSelectedTrajectoryId(route.trajectoryId)
    setSessionOriginRoute({ kind: 'trajectory', coacheeId: route.coacheeId, trajectoryId: route.trajectoryId })
    return
  }
  setSelectedSidebarItemKey('coachees')
  setSelectedSessieId(null)
  setSelectedCoacheeId(null)
  setSelectedTrajectoryId(null)
  setSessionOriginRoute(null)
}
