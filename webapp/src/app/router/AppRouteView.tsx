import React from 'react'

import { ClientsScreen } from '../../screens/clients/ClientsScreen'
import { ClientScreen } from '../../screens/client/ClientScreen'
import { InputScreen } from '../../screens/session/InputScreen'
import { NewReportScreen } from '../../screens/newReport/NewReportScreen'
import { OrganizationScreen } from '../../screens/organization/OrganizationScreen'
import type { RouteState } from './routes'

export function AppRouteView({ route }: { route: RouteState }) {
  if (route.kind === 'clients') return <ClientsScreen onSelectClient={() => undefined} />
  if (route.kind === 'client') {
    return (
      <ClientScreen
        clientId={route.clientId}
        onBack={() => undefined}
        onSelectInput={() => undefined}
        onPressCreateInput={() => undefined}
        onPressCreateReports={() => undefined}
      />
    )
  }
  if (route.kind === 'session') {
    return (
      <InputScreen
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

