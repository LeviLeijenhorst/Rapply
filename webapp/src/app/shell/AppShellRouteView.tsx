import React from 'react'

import { EmptyPageMessage } from '../../ui/EmptyPageMessage'
import { LoadingScreen } from '../../ui/LoadingScreen'
import { Text } from '../../ui/Text'
import { ClientsScreen } from '../../screens/clients/ClientsScreen'
import { SessionsScreen } from '../../screens/sessions/SessionsScreen'
import { ClientScreen } from '../../screens/client/ClientScreen'
import { InputScreen } from '../../screens/session/InputScreen'
import { NewReportScreen } from '../../screens/newReport/NewReportScreen'
import { ReportScreen } from '../../screens/report/ReportScreen'
import { OrganizationScreen } from '../../screens/organization/OrganizationScreen'
import { ProfileScreen } from '../../screens/profile/ProfileScreen'
import { ReportsScreen } from '../../screens/reports/ReportsScreen'
import { NewClientScreen } from '../../screens/newClient/NewClientScreen'
import { DashboardScreen } from '../../screens/dashboard/DashboardScreen'
import { getClientDisplayName } from '../../types/client'
import type { ClientLeftTabKey } from '../../screens/client/clientScreen.types'
import type { NewInputQuickAction } from '../../screens/record/types'
import type { Report } from '../../storage/types'
import type { RouteState } from './routeHelpers'

type Props = {
  canOpenSubscription: boolean
  clientTabById: Record<string, ClientLeftTabKey>
  data: {
    clients: Array<{ id: string; name: string; isArchived?: boolean }>
    inputs: Array<{
      id: string
      title: string
      clientId: string | null
      trajectoryId: string | null
      createdAtUnixMs: number
      kind: string
    }>
    trajectories: Array<{ id: string; clientId: string; name: string }>
    reports: Report[]
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
  newlyCreatedClientName: string | null
  onClearNewlyCreatedClient: () => void
  onOpenNewClient: () => void
  onOpenNewInputModal: (clientId: string | null, trajectoryId?: string | null, initialOption?: 'gesprek' | 'gespreksverslag' | null, initialQuickAction?: NewInputQuickAction | null) => void
  onSetClientTabById: (clientId: string, tabKey: ClientLeftTabKey) => void
  onSetRapportageEditInputId: (sessionId: string | null) => void
  onSetRapportageOnlyInputId: (sessionId: string | null) => void
  onSetRapportageScreenMode: (mode: 'controleren' | 'bewerken') => void
  onSetSelectedSidebarItemKey: (key: 'clients' | 'sessions' | 'dashboard' | 'reports' | 'mijnPraktijk' | 'mijnProfiel' | 'admin' | 'adminContact' | 'adminWachtlijst') => void
  onSetInputIdPendingTemplatePicker: (sessionId: string | null) => void
  onSetInputOriginRoute: (route: RouteState | null) => void
  onToggleE2eePage: (open: boolean) => void
  overlayScreenKey: null
  rapportageEditInputId: string | null
  rapportageOnlyInputId: string | null
  rapportageScreenMode: 'controleren' | 'bewerken'
  selectedClientId: string | null
  selectedSidebarItemKey: 'clients' | 'sessions' | 'dashboard' | 'reports' | 'mijnPraktijk' | 'mijnProfiel' | 'admin' | 'adminContact' | 'adminWachtlijst'
  selectedSessieId: string | null
  selectedTrajectoryId: string | null
  sessionIdPendingTemplatePicker: string | null
  currentUserGivenName: string | null
  currentUserName: string | null
  currentUserEmail: string | null
  onLogout: () => void
  onOpenDeleteAccountConfirm: () => void
  isDeleteAccountBusy: boolean
}

export function AppShellRouteView(props: Props) {
  if (!props.isAppDataLoaded) {
    return <LoadingScreen />
  }
  if (props.isEndToEndEncryptiePageOpen) {
    return <EmptyPageMessage message="Beveiligingspagina is niet meer beschikbaar." onGoHome={() => props.onToggleE2eePage(false)} />
  }
  if (props.isAdminScreenOpen) {
    return <EmptyPageMessage message="Admin-overzicht is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'clients' })} />
  }
  if (props.isAdminContactScreenOpen) {
    return <EmptyPageMessage message="Contactbeheer is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'clients' })} />
  }
  if (props.isAdminWachtlijstScreenOpen) {
    return <EmptyPageMessage message="Wachtlijstbeheer is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'clients' })} />
  }
  if (props.isRecordPageOpen) {
    return <EmptyPageMessage message="Opnemen opent direct vanuit 'Nieuw item'." onGoHome={() => props.navigateTo({ kind: 'clients' })} />
  }

  if (props.isNewClientPageOpen) {
    return (
      <NewClientScreen
        onBack={() => props.navigateTo({ kind: 'clients' })}
        onSaved={(clientId) => props.navigateTo({ kind: 'client', clientId: clientId })}
      />
    )
  }

  if (props.isNieuweRapportageOpen) {
    if (props.rapportageEditInputId) {
      const selectedInput = props.data.inputs.find((item) => item.id === props.rapportageEditInputId) ?? null
      const selectedReport = props.data.reports.find((item) => item.id === props.rapportageEditInputId) ?? null
      const headerTitle = selectedReport?.title || selectedInput?.title || 'Rapportage'
      const headerClientName = getClientDisplayName(props.data.clients, selectedReport?.clientId ?? selectedInput?.clientId ?? props.selectedClientId)
      return (
        <ReportScreen
          initialClientId={props.selectedClientId}
          initialInputId={props.rapportageEditInputId}
          headerTitle={headerTitle}
          headerClientName={headerClientName}
          initialReport={selectedReport}
          onBack={props.goBack}
          mode={props.rapportageScreenMode}
        />
      )
    }
    return (
      <NewReportScreen
        initialClientId={props.selectedClientId}
        onBack={props.goBack}
      />
    )
  }

  if (props.selectedSessieId) {
    const selectedSessie = props.data.inputs.find((item) => item.id === props.selectedSessieId)
    if (!selectedSessie) {
      return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'clients' })} />
    }
    const sessieTitle = selectedSessie.title ?? 'Sessie'
    const clientName = getClientDisplayName(props.data.clients, selectedSessie.clientId)
    const date = new Date(selectedSessie.createdAtUnixMs).toLocaleDateString('nl-NL')
    return (
      <InputScreen
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
        onOpenReport={(reportId) => {
          props.onSetInputOriginRoute({ kind: 'reports' })
          props.onSetRapportageOnlyInputId(null)
          props.onSetRapportageScreenMode('bewerken')
          props.onSetRapportageEditInputId(reportId)
          props.navigateTo({ kind: 'rapportage', reportId })
        }}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'clients') {
    if (props.selectedClientId) {
      const selectedClient = props.data.clients.find((c) => c.id === props.selectedClientId)
      if (!selectedClient) {
        return <EmptyPageMessage message="Deze client bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'clients' })} />
      }
      if (props.selectedTrajectoryId) {
        const hasSelectedTrajectory = props.data.trajectories.some(
          (trajectory) => trajectory.id === props.selectedTrajectoryId && trajectory.clientId === props.selectedClientId,
        )
        if (!hasSelectedTrajectory) {
          return <EmptyPageMessage message="Dit traject bestaat niet meer." onGoHome={() => props.navigateTo({ kind: 'client', clientId: props.selectedClientId! })} />
        }
        return <EmptyPageMessage message="Trajectdetail is niet meer beschikbaar." onGoHome={() => props.navigateTo({ kind: 'client', clientId: props.selectedClientId! })} />
      }
      return (
        <ClientScreen
          clientId={props.selectedClientId}
          onBack={props.goBack}
          initialLeftActiveTabKey={props.clientTabById[props.selectedClientId] ?? 'sessies'}
          initialRightActiveTabKey="chatbot"
          onLeftActiveTabChange={(tabKey) => props.onSetClientTabById(props.selectedClientId!, tabKey)}
          onSelectInput={(sessionId, sourceTab) => {
            const selectedInput = props.data.inputs.find((session) => session.id === sessionId) ?? null
            const shouldOpenAsRapportage = sourceTab === 'rapportages'
            if (shouldOpenAsRapportage) {
              props.onSetInputOriginRoute({ kind: 'client', clientId: props.selectedClientId! })
              props.onSetRapportageOnlyInputId(null)
              props.onSetRapportageScreenMode('bewerken')
              props.onSetRapportageEditInputId(sessionId)
              props.navigateTo({ kind: 'rapportage', reportId: sessionId })
              return
            }
            if (selectedInput?.clientId && selectedInput?.trajectoryId) {
              props.onSetInputOriginRoute({ kind: 'client', clientId: props.selectedClientId! })
              props.onSetRapportageOnlyInputId(null)
              props.navigateTo({ kind: 'item', clientId: selectedInput.clientId, trajectoryId: selectedInput.trajectoryId, itemId: sessionId })
              return
            }
            props.onSetRapportageOnlyInputId(null)
            props.navigateTo({ kind: 'sessie', sessieId: sessionId })
          }}
          onPressCreateInput={(trajectoryId, initialQuickAction) =>
            props.onOpenNewInputModal(props.selectedClientId!, trajectoryId, null, initialQuickAction ?? null)
          }
          onPressCreateReports={() => {
            props.onSetRapportageOnlyInputId(null)
            props.onSetRapportageScreenMode('controleren')
            props.onSetRapportageEditInputId(null)
            props.navigateTo({ kind: 'nieuwe-rapportage' })
          }}
          isCreateInputDisabled={props.isRecordingBusy}
        />
      )
    }

    return (
      <ClientsScreen
        onSelectClient={(clientId) => props.navigateTo({ kind: 'client', clientId })}
        onOpenNewClientPage={() => props.navigateTo({ kind: 'new-client' })}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'dashboard') {
    return (
        <DashboardScreen
        onSelectClient={(clientId) => props.navigateTo({ kind: 'client', clientId: clientId })}
        onOpenNewClientPage={() => props.navigateTo({ kind: 'new-client' })}
        onOpenRecord={(action) => {
          props.onOpenNewInputModal(null, null, null, action)
        }}
        onOpenClientsPage={() => props.navigateTo({ kind: 'clients' })}
        onOpenSessionsPage={() => props.navigateTo({ kind: 'sessions' })}
        onOpenReportsPage={() => props.navigateTo({ kind: 'reports' })}
        onOpenInput={(sessionId) => props.navigateTo({ kind: 'sessie', sessieId: sessionId })}
        welcomeName={props.currentUserGivenName || props.currentUserName}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'mijnPraktijk') {
    return <OrganizationScreen />
  }

  if (props.selectedSidebarItemKey === 'mijnProfiel') {
    return (
      <ProfileScreen
        accountName={props.currentUserName}
        accountEmail={props.currentUserEmail}
        onLogout={props.onLogout}
        onDeleteAccount={props.onOpenDeleteAccountConfirm}
        isDeleteAccountBusy={props.isDeleteAccountBusy}
      />
    )
  }

  if (props.selectedSidebarItemKey === 'sessions') {
    return (
      <SessionsScreen
        onSelectSession={(item) => {
          props.onSetInputOriginRoute({ kind: 'sessions' })
          if (item.clientId && item.trajectoryId) {
            props.navigateTo({ kind: 'item', clientId: item.clientId, trajectoryId: item.trajectoryId, itemId: item.inputId })
            return
          }
          props.navigateTo({ kind: 'sessie', sessieId: item.inputId })
        }}
      />
    )
  }

  return <Text style={props.mainContentTextStyle}>{props.selectedSidebarItemKey}</Text>
}



