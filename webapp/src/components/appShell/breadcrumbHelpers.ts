import { getCoacheeDisplayName } from '../../utils/coachee'
import type { RouteState } from './routeHelpers'

type BreadcrumbItem = {
  label: string
  onPress: () => void
}

type Params = {
  coachees: Array<{ id: string; name: string }>
  sessions: Array<{ id: string; title: string | null; coacheeId: string | null; trajectoryId: string | null }>
  trajectories: Array<{ id: string; coacheeId: string; name: string | null }>
  isNieuweRapportageOpen: boolean
  rapportageScreenMode: 'controleren' | 'bewerken'
  selectedCoacheeId: string | null
  selectedSessieId: string | null
  selectedSidebarItemKey: 'coachees' | 'activities' | 'templates' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'
  selectedTrajectoryId: string | null
  writtenReportInitialCoacheeId: string | null
  navigateTo: (route: RouteState) => void
}

export function buildBreadcrumbItems(params: Params): BreadcrumbItem[] {
  const {
    coachees,
    sessions,
    trajectories,
    isNieuweRapportageOpen,
    rapportageScreenMode,
    selectedCoacheeId,
    selectedSessieId,
    selectedSidebarItemKey,
    selectedTrajectoryId,
    writtenReportInitialCoacheeId,
    navigateTo,
  } = params

  if (isNieuweRapportageOpen) {
    const rapportageLabel = rapportageScreenMode === 'bewerken' ? 'Rapportage bewerken' : 'Rapportage controleren'
    const activeCoacheeId = selectedCoacheeId || writtenReportInitialCoacheeId
    if (activeCoacheeId) {
      const coacheeName = coachees.find((item) => item.id === activeCoacheeId)?.name ?? 'Cli\u00ebnt'
      return [
        { label: 'Cli\u00ebnten', onPress: () => navigateTo({ kind: 'coachees' }) },
        { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: activeCoacheeId }) },
        { label: rapportageLabel, onPress: () => navigateTo({ kind: 'nieuwe-rapportage' }) },
      ]
    }
    return [
      { label: 'Cli\u00ebnten', onPress: () => navigateTo({ kind: 'coachees' }) },
      { label: rapportageLabel, onPress: () => navigateTo({ kind: 'nieuwe-rapportage' }) },
    ]
  }

  if (selectedSessieId) {
    const session = sessions.find((item) => item.id === selectedSessieId)
    if (!session) return []
    const sessionTitle = session.title ?? 'Sessie'
    const trajectory = session.trajectoryId ? trajectories.find((item) => item.id === session.trajectoryId) ?? null : null
    const coacheeId = trajectory?.coacheeId ?? session.coacheeId
    if (coacheeId && trajectory) {
      const coacheeName = getCoacheeDisplayName(coachees, coacheeId)
      return [
        { label: 'Cli\u00ebnten', onPress: () => navigateTo({ kind: 'coachees' }) },
        { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId }) },
        { label: trajectory.name || 'Traject', onPress: () => navigateTo({ kind: 'trajectory', coacheeId, trajectoryId: trajectory.id }) },
        { label: sessionTitle, onPress: () => navigateTo({ kind: 'item', coacheeId, trajectoryId: trajectory.id, itemId: selectedSessieId }) },
      ]
    }
    return [
      { label: 'Activiteiten', onPress: () => navigateTo({ kind: 'activities' }) },
      { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
    ]
  }

  if (selectedSidebarItemKey === 'coachees' && selectedCoacheeId && selectedTrajectoryId) {
    const coacheeName = coachees.find((item) => item.id === selectedCoacheeId)?.name ?? 'Client'
    const trajectoryName = trajectories.find((item) => item.id === selectedTrajectoryId)?.name ?? 'Traject'
    return [
      { label: 'Cli\u00ebnten', onPress: () => navigateTo({ kind: 'coachees' }) },
      { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: selectedCoacheeId }) },
      { label: trajectoryName, onPress: () => navigateTo({ kind: 'trajectory', coacheeId: selectedCoacheeId, trajectoryId: selectedTrajectoryId }) },
    ]
  }

  if (selectedSidebarItemKey === 'coachees' && selectedCoacheeId) {
    const coacheeName = coachees.find((item) => item.id === selectedCoacheeId)?.name ?? 'Client'
    return [
      { label: 'Cli\u00ebnten', onPress: () => navigateTo({ kind: 'coachees' }) },
      { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: selectedCoacheeId }) },
    ]
  }

  if (selectedSidebarItemKey === 'coachees') return [{ label: 'Cli\u00ebnten', onPress: () => navigateTo({ kind: 'coachees' }) }]
  if (selectedSidebarItemKey === 'activities') return [{ label: 'Dashboard', onPress: () => navigateTo({ kind: 'activities' }) }]
  if (selectedSidebarItemKey === 'templates') return [{ label: 'Rapportages', onPress: () => navigateTo({ kind: 'templates' }) }]
  if (selectedSidebarItemKey === 'mijnPraktijk') return [{ label: 'Mijn organisatie', onPress: () => navigateTo({ kind: 'mijn-praktijk' }) }]
  if (selectedSidebarItemKey === 'admin') return [{ label: 'Admin', onPress: () => navigateTo({ kind: 'admin' }) }]
  if (selectedSidebarItemKey === 'adminContact') return [{ label: 'Contactberichten', onPress: () => navigateTo({ kind: 'admin-contact' }) }]
  if (selectedSidebarItemKey === 'adminWachtlijst') return [{ label: 'Wachtlijst', onPress: () => navigateTo({ kind: 'admin-wachtlijst' }) }]
  return [{ label: 'Coachscribe', onPress: () => navigateTo({ kind: 'coachees' }) }]
}
