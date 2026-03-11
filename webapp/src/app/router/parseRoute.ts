import type { RouteState } from './routes'

export function parseRoute(pathname: string): RouteState {
  const path = String(pathname || '/').replace(/^\/+/, '')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'client' && parts[1]) return { kind: 'client', clientId: parts[1] }
  if (parts[0] === 'session' && parts[1]) return { kind: 'session', sessionId: parts[1] }
  if (parts[0] === 'new-report') return { kind: 'new-report' }
  if (parts[0] === 'organization') return { kind: 'organization' }
  return { kind: 'clients' }
}
