import React from 'react'
import { View } from 'react-native'

import { EmptyPageMessage } from '../../ui/EmptyPageMessage'
import { AppLoadingScreen } from '../AppLoadingScreen'
import { Text } from '../../ui/Text'
import { ClientsScreen } from '../../screens/clients/ClientsScreen'
import { ClientScreen } from '../../screens/client/ClientScreen'
import { SessionScreen } from '../../screens/session/SessionScreen'
import { NewReportScreen } from '../../screens/newReport/NewReportScreen'
import { ReportScreen } from '../../screens/report/ReportScreen'
import { OrganizationScreen } from '../../screens/organization/OrganizationScreen'
import { RecordScreen } from '../../screens/record/RecordScreen'
import { ReportsScreen } from '../../screens/reports/ReportsScreen'
import { NewClientScreen } from '../../screens/newClient/NewClientScreen'
import { getCoacheeDisplayName } from '../../types/client'
import { isSessionReportArtifact } from '../../types/sessionArtifacts'
import type { CoacheeTabKey } from '../../screens/client/components/CoacheeTabs'
import type { RouteState } from './routeHelpers'

type Props = {
  canOpenSubscription: boolean
  coacheeTabById: Record<string, CoacheeTabKey>
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
  isGeschrevenVerslagOpen: boolean
  mainContentTextStyle: any
  navigateTo: (route: RouteState) => void
  navigateToReplacingHistory: (route: RouteState) => void
  newlyCreatedCoacheeName: string | null
  onClearNewlyCreatedCoachee: () => void
  onOpenMySubscription: () => void
  onOpenNewCoachee: () => void
  onOpenNewSessionModal: (coacheeId: string | null, trajectoryId?: string | null, initialOption?: 'gesprek' | 'gespreksverslag' | null) => void
  onSetCoacheeTabById: (coacheeId: string, tabKey: CoacheeTabKey) => void
  onSetPreviousRoute: (route: RouteState | null) => void
  onSetRapportageEditSessionId: (sessionId: string | null) => void
  onSetRapportageOnlySessionId: (sessionId: string | null) => void
  onSetRapportageScreenMode: (mode: 'controleren' | 'bewerken') => void
  onSetSelectedSidebarItemKey: (key: 'coachees' | 'reports') => void
  onSetSessionIdPendingTemplatePicker: (sessionId: string | null) => void
  onSetSessionOriginRoute: (route: RouteState | null) => void
  onSetWrittenReportInitialCoacheeId: (coacheeId: string | null) => void
  onToggleE2eePage: (open: boolean) => void
  overlayScreenKey: 'archief' | null
  previousRoute: RouteState | null
  rapportageEditSessionId: string | null
  rapportageOnlySessionId: string | null
  rapportageScreenMode: 'controleren' | 'bewerken'
  selectedCoacheeId: string | null
  selectedSidebarItemKey: 'coachees' | 'activities' | 'reports' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'
  selectedSessieId: string | null
  selectedTrajectoryId: string | null
  sessionIdPendingTemplatePicker: string | null
  writtenReportInitialCoacheeId: string | null
}

export function AppShellRouteView(props: Props) {
  if (!props.isAppDataLoaded) {
    return <AppLoadingScreen />
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
    return <RecordScreen onOpenRecorder={() => props.onOpenNewSessionModal(null, null, 'gesprek')} />
  }

  if (props.isNewClientPageOpen) {
    return (
      <NewClientScreen
        onBack={() => props.navigateTo({ kind: 'coachees' })}
        onSaved={(clientId) => props.navigateTo({ kind: 'coachee', coacheeId: clientId })}
      />
    )
  }

  if (props.isGeschrevenVerslagOpen) {
    return (
      <ReportScreen
        initialCoacheeId={props.writtenReportInitialCoacheeId}
        onBack={() => {
          props.onSetWrittenReportInitialCoacheeId(null)
          if (props.previousRoute) {
            props.navigateTo(props.previousRoute)
            props.onSetPreviousRoute(null)
            return
          }
          props.goBack()
        }}
        onOpenNewCoachee={props.onOpenNewCoachee}
        onOpenSession={(sessionId) => {
          const openedSession = props.data.sessions.find((item) => item.id === sessionId)
          const nextRoute =
            openedSession?.coacheeId && openedSession?.trajectoryId
              ? ({ kind: 'item', coacheeId: openedSession.coacheeId, trajectoryId: openedSession.trajectoryId, itemId: sessionId } as const)
              : ({ kind: 'sessie', sessieId: sessionId } as const)
          props.onSetWrittenReportInitialCoacheeId(null)
          props.onSetPreviousRoute(null)
          props.onSetRapportageOnlySessionId(null)
          props.onSetSessionIdPendingTemplatePicker(null)
          props.navigateToReplacingHistory(nextRoute)
        }}
      />
    )
  }

  if (props.isNieuweRapportageOpen) {
    return (
      <NewReportScreen
        initialCoacheeId={props.selectedCoacheeId}
        initialSessionId={props.rapportageEditSessionId}
        mode={props.rapportageScreenMode}
      />
    )
  }

  if (props.selectedSessieId) {
    const selectedSessie = props.data.sessions.find((item) => item.id === props.selectedSessieId)
    if (!selectedSessie) {
      return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'coachees' })} />
    }
    const sessieTitle = selectedSessie.title ?? 'Sessie'
    const coacheeName = getCoacheeDisplayName(props.data.coachees, selectedSessie.coacheeId)
    const dateLabel = new Date(selectedSessie.createdAtUnixMs).toLocaleDateString('nl-NL')
    const shouldForceRapportageOnly = isSessionReportArtifact(selectedSessie as any) || props.rapportageOnlySessionId === props.selectedSessieId
    return (
      <SessionScreen
        sessionId={props.selectedSessieId}
        title={sessieTitle}
        coacheeName={coacheeName}
        dateLabel={dateLabel}
        forceRapportageOnly={shouldForceRapportageOnly}
        initialOpenTemplatePicker={props.sessionIdPendingTemplatePicker === props.selectedSessieId}
        onInitialTemplatePickerHandled={() => {
          if (props.sessionIdPendingTemplatePicker === props.selectedSessieId) {
            props.onSetSessionIdPendingTemplatePicker(null)
          }
        }}
        onBack={props.goBack}
        onOpenNewCoachee={props.onOpenNewCoachee}
        onOpenMySubscription={props.onOpenMySubscription}
        onChangeCoachee={(nextCoacheeId) => {
          if (!nextCoacheeId) {
            props.onSetSelectedSidebarItemKey('coachees')
            props.onSetSessionOriginRoute(null)
          }
        }}
        newlyCreatedCoacheeName={props.newlyCreatedCoacheeName}
        onNewlyCreatedCoacheeHandled={props.onClearNewlyCreatedCoachee}
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
          coacheeId={props.selectedCoacheeId}
          onBack={props.goBack}
          initialActiveTabKey={props.coacheeTabById[props.selectedCoacheeId] ?? 'sessies'}
          onActiveTabChange={(tabKey) => props.onSetCoacheeTabById(props.selectedCoacheeId!, tabKey)}
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
          onPressCreateRapportage={() => {
            props.onSetRapportageOnlySessionId(null)
            props.onSetRapportageScreenMode('controleren')
            props.onSetRapportageEditSessionId(null)
            props.navigateTo({ kind: 'nieuwe-rapportage' })
          }}
          onOpenMySubscription={props.onOpenMySubscription}
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
    return <View style={{ flex: 1 }} />
  }

  if (props.selectedSidebarItemKey === 'mijnPraktijk') {
    return <OrganizationScreen />
  }

  return <Text style={props.mainContentTextStyle}>{props.selectedSidebarItemKey}</Text>
}
