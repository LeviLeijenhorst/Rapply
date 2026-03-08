import React from 'react'

import { ClientsScreen } from '../../screens/clients/ClientsScreen'
import { ClientScreen } from '../../screens/client/ClientScreen'
import { SessionScreen } from '../../screens/session/SessionScreen'
import { NewReportScreen } from '../../screens/newReport/NewReportScreen'
import { ReportScreen } from '../../screens/report/ReportScreen'
import { OrganizationScreen } from '../../screens/organization/OrganizationScreen'
import type { RouteState } from './routes'

export function AppRouteView({ route }: { route: RouteState }) {
  if (route.kind === 'clients') return <ClientsScreen onSelectCoachee={() => undefined} />
  if (route.kind === 'client') {
    return (
      <ClientScreen
        coacheeId={route.clientId}
        onBack={() => undefined}
        onSelectSession={() => undefined}
        onPressCreateSession={() => undefined}
        onPressCreateRapportage={() => undefined}
        onOpenMySubscription={() => undefined}
      />
    )
  }
  if (route.kind === 'session') {
    return (
      <SessionScreen
        sessionId={route.sessionId}
        title=""
        coacheeName=""
        dateLabel=""
        onBack={() => undefined}
        onOpenNewCoachee={() => undefined}
        onOpenMySubscription={() => undefined}
        onChangeCoachee={() => undefined}
      />
    )
  }
  if (route.kind === 'new-report') return <NewReportScreen />
  if (route.kind === 'report') return <ReportScreen onBack={() => undefined} onOpenSession={() => undefined} onOpenNewCoachee={() => undefined} />
  return <OrganizationScreen />
}
