import type { RouteState } from './routes'

export function buildPath(route: RouteState): string {
  if (route.kind === 'clients') return '/clients'
  if (route.kind === 'client') return `/client/${route.clientId}`
  if (route.kind === 'session') return `/session/${route.sessionId}`
  if (route.kind === 'new-report') return '/new-report'
  return '/organization'
}
