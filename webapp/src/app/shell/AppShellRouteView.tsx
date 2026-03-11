import React from 'react'

import { EmptyPageMessage } from '../../ui/EmptyPageMessage'
import { LoadingScreen } from '../../ui/LoadingScreen'
import { Text } from '../../ui/Text'
import { ClientsScreen } from '../../screens/clients/ClientsScreen'
import { ClientScreen } from '../../screens/client/ClientScreen'
import { SessionScreen } from '../../screens/session/SessionScreen'
import { NewReportScreen } from '../../screens/newReport/NewReportScreen'
import { ReportScreen } from '../../screens/report/ReportScreen'
import { OrganizationScreen } from '../../screens/organization/OrganizationScreen'
import { ReportsScreen } from '../../screens/reports/ReportsScreen'
import { NewClientScreen } from '../../screens/newClient/NewClientScreen'
import { DashboardScreen } from '../../screens/dashboard/DashboardScreen'
import { getCoacheeDisplayName } from '../../types/client'
import type { ClientLeftTabKey } from '../../screens/client/clientScreen.types'
import type { RouteState } from './routeHelpers'

type Props = {
  canOpenSubscription: boolean
  coacheeTabById: Record<string, ClientLeftTabKey>
  data: {
    coachees: Array<{ id: string; name: string; isArchived?: boolean }>
    sessions: Array<{
      id: string
      title: string
      coacheeId: string | null
      trajectoryId: string | null
      createdAtUnixMs: number
      kind: string
    }>
    trajectories: Array<{ id: string; coacheeId: string; name: string }>
  }
  goBack: () => void
  isAdminContactScreenOpen: boolean
  isAdminScreenOpen: boolean
  isAdminWachtlijstScreenOpen: boolean
  isAppDataLoaded: boolean
  isEndToEndEncryptiePageOpen: boolean
  isNieuweRapportageOpen: boolean
  isRecordPageOpen: boolean
  isNewClientPageOpen: boolean
  isRecordingBusy: boolean
  mainContentTextStyle: any
  navigateTo: (route: RouteState) => void
  newlyCreatedCoacheeName: string | null
  onClearNewlyCreatedCoachee: () => void
  onOpenNewCoachee: () => void
  onOpenNewSessionModal: (coacheeId: string | null, trajectoryId?: string | null, initialOption?: 'gesprek' | 'gespreksverslag' | null) => void
  onSetCoacheeTabById: (coacheeId: string, tabKey: ClientLeftTabKey) => void
  onSetRapportageEditSessionId: (sessionId: string | null) => void
  onSetRapportageOnlySessionId: (sessionId: string | null) => void
  onSetRapportageScreenMode: (mode: 'controleren' | 'bewerken') => void
  onSetSelectedSidebarItemKey: (key: 'coachees' | 'reports') => void
  onSetSessionIdPendingTemplatePicker: (sessionId: string | null) => void
  onSetSessionOriginRoute: (route: RouteState | null) => void
  onToggleE2eePage: (open: boolean) => void
  overlayScreenKey: 'archief' | null
  rapportageEditSessionId: string | null
  rapportageOnlySessionId: string | null
  rapportageScreenMode: 'controleren' | 'bewerken'
  selectedCoacheeId: string | null
  selectedSidebarItemKey: 'coachees' | 'activities' | 'reports' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'
  selectedSessieId: string | null
  selectedTrajectoryId: string | null
  sessionIdPendingTemplatePicker: string | null
}

export function AppShellRouteView(props: Props) {
  if (!props.isAppDataLoaded) {
    return <LoadingScreen />
  }
  if (props.isEndToEndEncryptiePageOpen) {
    return <EmptyPageMessage message="Beveiligingspagina is niet meer beschikbaar." onGoHome={() => props.onToggleE2eePage(false)} />
  }
  if (props.isAdminScreenOpen) {
    return <EmptyPageMessage message="Admin-overzicht is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
  }
  if (props.isAdminContactScreenOpen) {
    return <EmptyPageMessage message="Contactbeheer is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
  }
  if (props.isAdminWachtlijstScreenOpen) {
    return <EmptyPageMessage message="Wachtlijstbeheer is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
  }
  if (props.overlayScreenKey === 'archief') {
    return <EmptyPageMessage message="Archief komt binnenkort beschikbaar" onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
  }

  if (props.isRecordPageOpen) {
    return <EmptyPageMessage message="Opnemen opent direct vanuit 'Nieuw item'." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
  }

  if (props.isNewClientPageOpen) {
    return (
      <NewClientScreen
        onBack={() => props.navigateTo({ kind: 'coachees' })}
        onSaved={(clientId) => props.navigateTo({ kind: 'coachee', coacheeId: clientId })}
      />
    )
  }

  if (props.isNieuweRapportageOpen) {
    if (props.rapportageEditSessionId) {
      return (
        <ReportScreen
          initialCoacheeId={props.selectedCoacheeId}
          initialSessionId={props.rapportageEditSessionId}
          mode={props.rapportageScreenMode}
        />
      )
    }
    return (
      <NewReportScreen
        initialCoacheeId={props.selectedCoacheeId}
      />
    )
  }

  if (props.selectedSessieId) {
    const selectedSessie = props.data.sessions.find((item) => item.id === props.selectedSessieId)
    if (!selectedSessie) {
      return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
    }
    const sessieTitle = selectedSessie.title ?? 'Sessie'
    const clientName = getCoacheeDisplayName(props.data.coachees, selectedSessie.coacheeId)
    const date = new Date(selectedSessie.createdAtUnixMs).toLocaleDateString('nl-NL')
    return (
      <SessionScreen
        id={props.selectedSessieId}
        title={sessieTitle}
        clientName={clientName}
        date={date}
        onBack={props.goBack}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'reports') {
    return (
      <ReportsScreen
        onOpenReport={(sessionId) => {
          props.onSetSessionOriginRoute({ kind: 'reports' })
          props.onSetRapportageOnlySessionId(null)
          props.onSetRapportageScreenMode('bewerken')
          props.onSetRapportageEditSessionId(sessionId)
          props.navigateTo({ kind: 'nieuwe-rapportage' })
        }}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'coachees') {
    if (props.selectedCoacheeId) {
      const selectedCoachee = props.data.coachees.find((c) => c.id === props.selectedCoacheeId)
      if (!selectedCoachee) {
        return <EmptyPageMessage message="Deze client bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
      }
      if (props.selectedTrajectoryId) {
        const hasSelectedTrajectory = props.data.trajectories.some(
          (trajectory) => trajectory.id === props.selectedTrajectoryId && trajectory.coacheeId === props.selectedCoacheeId,
        )
        if (!hasSelectedTrajectory) {
          return <EmptyPageMessage message="Dit traject bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'coachee', coacheeId: props.selectedCoacheeId! })} />
        }
        return <EmptyPageMessage message="Trajectdetail is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'coachee', coacheeId: props.selectedCoacheeId! })} />
      }
      return (
        <ClientScreen
          clientId={props.selectedCoacheeId}
          onBack={props.goBack}
          initialLeftActiveTabKey={props.coacheeTabById[props.selectedCoacheeId] ?? 'sessies'}
          initialRightActiveTabKey="chatbot"
          onLeftActiveTabChange={(tabKey) => props.onSetCoacheeTabById(props.selectedCoacheeId!, tabKey)}
          onSelectSession={(sessionId, sourceTab) => {
            const selectedSession = props.data.sessions.find((session) => session.id === sessionId) ?? null
            const shouldOpenAsRapportage = sourceTab === 'rapportages'
            if (shouldOpenAsRapportage) {
              props.onSetSessionOriginRoute({ kind: 'coachee', coacheeId: props.selectedCoacheeId! })
              props.onSetRapportageOnlySessionId(null)
              props.onSetRapportageScreenMode('bewerken')
              props.onSetRapportageEditSessionId(sessionId)
              props.navigateTo({ kind: 'nieuwe-rapportage' })
              return
            }
            if (selectedSession?.coacheeId && selectedSession?.trajectoryId) {
              props.onSetSessionOriginRoute({ kind: 'coachee', coacheeId: props.selectedCoacheeId! })
              props.onSetRapportageOnlySessionId(null)
              props.navigateTo({ kind: 'item', coacheeId: selectedSession.coacheeId, trajectoryId: selectedSession.trajectoryId, itemId: sessionId })
              return
            }
            props.onSetRapportageOnlySessionId(null)
            props.navigateTo({ kind: 'sessie', sessieId: sessionId })
          }}
          onPressCreateSession={(trajectoryId) => props.onOpenNewSessionModal(props.selectedCoacheeId!, trajectoryId)}
          onPressCreateReports={() => {
            props.onSetRapportageOnlySessionId(null)
            props.onSetRapportageScreenMode('controleren')
            props.onSetRapportageEditSessionId(null)
            props.navigateTo({ kind: 'nieuwe-rapportage' })
          }}
          isCreateSessionDisabled={props.isRecordingBusy}
        />
      )
    }

    return (
      <ClientsScreen
        onSelectCoachee={(coacheeId) => props.navigateTo({ kind: 'coachee', coacheeId })}
        onOpenNewClientPage={() => props.navigateTo({ kind: 'new-client' })}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'activities') {
    return (
      <DashboardScreen
        onSelectClient={(clientId) => props.navigateTo({ kind: 'coachee', coacheeId: clientId })}
        onOpenNewClientPage={() => props.navigateTo({ kind: 'new-client' })}
        onOpenRecord={() => props.navigateTo({ kind: 'record' })}
        onOpenClientsPage={() => props.navigateTo({ kind: 'coachees' })}
        onOpenReportsPage={() => props.navigateTo({ kind: 'reports' })}
        onOpenSession={(sessionId) => props.navigateTo({ kind: 'sessie', sessieId: sessionId })}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'mijnPraktijk') {
    return <OrganizationScreen />
  }

  return <Text style={props.mainContentTextStyle}>{props.selectedSidebarItemKey}</Text>
}
