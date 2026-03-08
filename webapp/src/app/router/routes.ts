export type RouteState =
  | { kind: 'clients' }
  | { kind: 'client'; clientId: string }
  | { kind: 'session'; sessionId: string }
  | { kind: 'new-report' }
  | { kind: 'report'; reportId: string }
  | { kind: 'organization' }
