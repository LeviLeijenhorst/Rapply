import React from 'react'

import { ClientsScreen } from '../../screens/clients/ClientsScreen'
import { ClientScreen } from '../../screens/client/ClientScreen'
import { SessionScreen } from '../../screens/session/SessionScreen'
import { NewReportScreen } from '../../screens/newReport/NewReportScreen'
import { OrganizationScreen } from '../../screens/organization/OrganizationScreen'
import type { RouteState } from './routes'

export function AppRouteView({ route }: { route: RouteState }) {
  if (route.kind === 'clients') return <ClientsScreen onSelectCoachee={() => undefined} />
  if (route.kind === 'client') {
    return (
      <ClientScreen
        clientId={route.clientId}
        onBack={() => undefined}
        onSelectSession={() => undefined}
        onPressCreateSession={() => undefined}
        onPressCreateReports={() => undefined}
      />
    )
  }
  if (route.kind === 'session') {
    return (
      <SessionScreen
        id={route.sessionId}
        title=""
        clientName=""
        date=""
        onBack={() => undefined}
      />
    )
  }
  if (route.kind === 'new-report') return <NewReportScreen />
  return <OrganizationScreen />
}
