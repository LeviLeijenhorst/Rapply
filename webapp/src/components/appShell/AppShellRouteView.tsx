import React from 'react'
import { View } from 'react-native'

import { EmptyPageMessage } from '../../ui/EmptyPageMessage'
import { AppLoadingScreen } from '../AppLoadingScreen'
import { Text } from '../../ui/Text'
import { CoacheesScreen } from '../../screens/CoacheesScreen'
import { CoacheeDetailScreen } from '../../screens/CoacheeDetailScreen'
import { TrajectoryDetailScreen } from '../../screens/TrajectoryDetailScreen'
import { SessieDetailScreen } from '../../screens/SessieDetailScreen'
import { RapportagesScreen } from '../../screens/RapportagesScreen'
import { MijnPraktijkScreen } from '../../screens/MijnPraktijkScreen'
import { NewRapportageScreen } from '../../screens/NewRapportageScreen'
import { GeschrevenVerslagScreen } from '../../screens/GeschrevenVerslagScreen'
import { ArchiefScreen } from '../../screens/ArchiefScreen'
import { AdminRevenueScreen } from '../../screens/AdminRevenueScreen'
import { AdminContactSubmissionsScreen } from '../../screens/AdminContactSubmissionsScreen'
import { AdminWachtlijstScreen } from '../../screens/AdminWachtlijstScreen'
import { EndToEndEncryptieScreen } from '../../screens/EndToEndEncryptieScreen'
import { getCoacheeDisplayName } from '../../utils/coachee'
import { isSessionReportArtifact } from '../../utils/sessionArtifacts'
import type { CoacheeTabKey } from '../coacheeDetail/CoacheeTabs'
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
  onSetSelectedSidebarItemKey: (key: 'coachees') => void
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
  selectedSidebarItemKey: 'coachees' | 'activities' | 'templates' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'
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
    return <EndToEndEncryptieScreen onBack={() => props.onToggleE2eePage(false)} />
  }
  if (props.isAdminScreenOpen) {
    return <AdminRevenueScreen />
  }
  if (props.isAdminContactScreenOpen) {
    return <AdminContactSubmissionsScreen />
  }
  if (props.isAdminWachtlijstScreenOpen) {
    return <AdminWachtlijstScreen />
  }
  if (props.overlayScreenKey === 'archief') {
    return <ArchiefScreen />
  }

  if (props.isGeschrevenVerslagOpen) {
    return (
      <GeschrevenVerslagScreen
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
      <NewRapportageScreen
        initialCoacheeId={props.selectedCoacheeId}
        initialSessionId={props.rapportageEditSessionId}
        mode={props.rapportageScreenMode}
      />
    )
  }

  if (props.selectedSessieId) {
    const selectedSessie = props.data.sessions.find((item) => item.id === props.selectedSessieId)
    if (!selectedSessie) {
      return (
        <EmptyPageMessage
          message="Deze sessie bestaat niet meer."
          onGoHome={() => props.navigateTo({ kind: 'coachees' })}
        />
      )
    }
    const sessieTitle = selectedSessie.title ?? 'Sessie'
    const coacheeName = getCoacheeDisplayName(props.data.coachees, selectedSessie.coacheeId)
    const dateLabel = new Date(selectedSessie.createdAtUnixMs).toLocaleDateString('nl-NL')
    const shouldForceRapportageOnly = isSessionReportArtifact(selectedSessie as any) || props.rapportageOnlySessionId === props.selectedSessieId
    return (
      <SessieDetailScreen
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

  if (props.selectedSidebarItemKey === 'coachees') {
    if (props.selectedCoacheeId) {
      const selectedCoachee = props.data.coachees.find((c) => c.id === props.selectedCoacheeId)
      if (!selectedCoachee) {
        return (
          <EmptyPageMessage
            message="Deze client bestaat niet meer."
            onGoHome={() => props.navigateTo({ kind: 'coachees' })}
          />
        )
      }
      if (props.selectedTrajectoryId) {
        const selectedTrajectory = props.data.trajectories.find(
          (trajectory) => trajectory.id === props.selectedTrajectoryId && trajectory.coacheeId === props.selectedCoacheeId,
        )
        if (!selectedTrajectory) {
          return (
            <EmptyPageMessage
              message="Dit traject bestaat niet meer."
              onGoHome={() => props.navigateTo({ kind: 'coachee', coacheeId: props.selectedCoacheeId! })}
            />
          )
        }
        return (
          <TrajectoryDetailScreen
            coacheeId={props.selectedCoacheeId}
            trajectoryId={selectedTrajectory.id}
            onBack={props.goBack}
            onSelectSession={(sessionId) => {
              props.onSetSessionOriginRoute({ kind: 'trajectory', coacheeId: props.selectedCoacheeId!, trajectoryId: selectedTrajectory.id })
              props.onSetRapportageOnlySessionId(null)
              props.navigateTo({ kind: 'item', coacheeId: props.selectedCoacheeId!, trajectoryId: selectedTrajectory.id, itemId: sessionId })
            }}
            onPressCreateSession={(trajectoryId) => props.onOpenNewSessionModal(props.selectedCoacheeId!, trajectoryId)}
            onPressCreateRapportage={() => {
              props.onSetRapportageOnlySessionId(null)
              props.onSetRapportageScreenMode('controleren')
              props.onSetRapportageEditSessionId(null)
              props.navigateTo({ kind: 'nieuwe-rapportage' })
            }}
          />
        )
      }
      return (
        <CoacheeDetailScreen
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

    return <CoacheesScreen onSelectCoachee={(coacheeId) => props.navigateTo({ kind: 'coachee', coacheeId })} />
  }

  if (props.selectedSidebarItemKey === 'activities') {
    return <View style={{ flex: 1 }} />
  }

  if (props.selectedSidebarItemKey === 'templates') {
    return (
      <RapportagesScreen
        onOpenReport={(sessionId, coacheeId, trajectoryId) => {
          if (coacheeId && trajectoryId) {
            props.onSetSessionOriginRoute({ kind: 'templates' })
            props.navigateTo({ kind: 'item', coacheeId, trajectoryId, itemId: sessionId })
            return
          }
          props.navigateTo({ kind: 'sessie', sessieId: sessionId })
        }}
      />
    )
  }
  if (props.selectedSidebarItemKey === 'mijnPraktijk') {
    return <MijnPraktijkScreen />
  }
  return <Text style={props.mainContentTextStyle}>{props.selectedSidebarItemKey}</Text>
}


