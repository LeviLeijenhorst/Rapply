import type { Dispatch, SetStateAction } from 'react'

import type { SidebarItemKey } from '../Sidebar'
import type { RouteState } from './routeHelpers'
import { normalizeRouteForAvailability } from './routeHelpers'

type ApplyRouteSetters = {
  setIsNieuweRapportageOpen: Dispatch<SetStateAction<boolean>>
  setRapportageScreenMode: Dispatch<SetStateAction<'controleren' | 'bewerken'>>
  setRapportageEditSessionId: Dispatch<SetStateAction<string | null>>
  setIsEndToEndEncryptiePageOpen: Dispatch<SetStateAction<boolean>>
  setSelectedSidebarItemKey: Dispatch<SetStateAction<SidebarItemKey>>
  setIsAdminScreenOpen: Dispatch<SetStateAction<boolean>>
  setIsAdminContactScreenOpen: Dispatch<SetStateAction<boolean>>
  setIsAdminWachtlijstScreenOpen: Dispatch<SetStateAction<boolean>>
  setOverlayScreenKey: Dispatch<SetStateAction<'archief' | null>>
  setIsGeschrevenVerslagOpen: Dispatch<SetStateAction<boolean>>
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
    setRapportageScreenMode,
    setRapportageEditSessionId,
    setIsEndToEndEncryptiePageOpen,
    setSelectedSidebarItemKey,
    setIsAdminScreenOpen,
    setIsAdminContactScreenOpen,
    setIsAdminWachtlijstScreenOpen,
    setOverlayScreenKey,
    setIsGeschrevenVerslagOpen,
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
    setIsEndToEndEncryptiePageOpen(false)
    setSelectedSidebarItemKey('archief')
    setIsAdminScreenOpen(false)
    setIsAdminContactScreenOpen(false)
    setIsAdminWachtlijstScreenOpen(false)
    setOverlayScreenKey('archief')
    setIsGeschrevenVerslagOpen(false)
    setSelectedSessieId(null)
    setSessionIdPendingTemplatePicker(null)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
    return
  }

  if (route.kind === 'geschrevenVerslag') {
    setIsNieuweRapportageOpen(false)
    setIsEndToEndEncryptiePageOpen(false)
    setIsAdminScreenOpen(false)
    setIsAdminContactScreenOpen(false)
    setIsAdminWachtlijstScreenOpen(false)
    setOverlayScreenKey(null)
    setIsGeschrevenVerslagOpen(true)
    setSelectedSidebarItemKey('coachees')
    setSelectedSessieId(null)
    setSessionIdPendingTemplatePicker(null)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
    return
  }

  if (route.kind === 'admin') {
    setIsNieuweRapportageOpen(false)
    if (!isCurrentUserAdmin) {
      setIsEndToEndEncryptiePageOpen(false)
      setIsAdminScreenOpen(false)
      setIsAdminContactScreenOpen(false)
      setIsAdminWachtlijstScreenOpen(false)
      setOverlayScreenKey(null)
      setIsGeschrevenVerslagOpen(false)
      setSelectedSidebarItemKey('coachees')
      setSelectedSessieId(null)
      setSelectedCoacheeId(null)
      setSelectedTrajectoryId(null)
      setSessionOriginRoute(null)
      return
    }
    setIsEndToEndEncryptiePageOpen(false)
    setIsAdminScreenOpen(true)
    setIsAdminContactScreenOpen(false)
    setIsAdminWachtlijstScreenOpen(false)
    setOverlayScreenKey(null)
    setIsGeschrevenVerslagOpen(false)
    setSelectedSidebarItemKey('admin')
    setSelectedSessieId(null)
    setSessionIdPendingTemplatePicker(null)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
    return
  }

  if (route.kind === 'admin-contact') {
    setIsNieuweRapportageOpen(false)
    if (!isCurrentUserAdmin) {
      setIsEndToEndEncryptiePageOpen(false)
      setIsAdminScreenOpen(false)
      setIsAdminContactScreenOpen(false)
      setIsAdminWachtlijstScreenOpen(false)
      setOverlayScreenKey(null)
      setIsGeschrevenVerslagOpen(false)
      setSelectedSidebarItemKey('coachees')
      setSelectedSessieId(null)
      setSelectedCoacheeId(null)
      setSelectedTrajectoryId(null)
      setSessionOriginRoute(null)
      return
    }
    setIsEndToEndEncryptiePageOpen(false)
    setIsAdminScreenOpen(false)
    setIsAdminContactScreenOpen(true)
    setIsAdminWachtlijstScreenOpen(false)
    setOverlayScreenKey(null)
    setIsGeschrevenVerslagOpen(false)
    setSelectedSidebarItemKey('adminContact')
    setSelectedSessieId(null)
    setSessionIdPendingTemplatePicker(null)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(null)
    setSessionOriginRoute(null)
    return
  }

  if (route.kind === 'admin-wachtlijst') {
    setIsNieuweRapportageOpen(false)
    if (!isCurrentUserAdmin) {
      setIsEndToEndEncryptiePageOpen(false)
      setIsAdminScreenOpen(false)
      setIsAdminContactScreenOpen(false)
      setIsAdminWachtlijstScreenOpen(false)
      setOverlayScreenKey(null)
      setIsGeschrevenVerslagOpen(false)
      setSelectedSidebarItemKey('coachees')
      setSelectedSessieId(null)
      setSelectedCoacheeId(null)
      setSelectedTrajectoryId(null)
      setSessionOriginRoute(null)
      return
    }
    setIsEndToEndEncryptiePageOpen(false)
    setIsAdminScreenOpen(false)
    setIsAdminContactScreenOpen(false)
    setIsAdminWachtlijstScreenOpen(true)
    setOverlayScreenKey(null)
    setIsGeschrevenVerslagOpen(false)
    setSelectedSidebarItemKey('adminWachtlijst')
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
  setIsGeschrevenVerslagOpen(false)
  setIsNieuweRapportageOpen(false)

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
    setSelectedSidebarItemKey('templates')
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
