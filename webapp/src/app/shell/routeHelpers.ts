import type { SidebarItemKey } from './components/Sidebar'
import { features } from '../../config/features'

export type RouteState =
  | { kind: 'dashboard' }
  | { kind: 'record' }
  | { kind: 'reports' }
  | { kind: 'rapportage'; reportId: string }
  | { kind: 'new-client' }
  | { kind: 'sessie'; sessieId: string }
  | { kind: 'item'; clientId: string; trajectoryId: string; itemId: string }
  | { kind: 'clients' }
  | { kind: 'client'; clientId: string }
  | { kind: 'trajectory'; clientId: string; trajectoryId: string }
  | { kind: 'templates' }
  | { kind: 'nieuwe-rapportage' }
  | { kind: 'mijn-praktijk' }
  | { kind: 'mijn-profiel' }
  | { kind: 'archief' }
  | { kind: 'admin' }
  | { kind: 'admin-contact' }
  | { kind: 'admin-wachtlijst' }

const DISABLED_FEATURE_FALLBACK_ROUTE: RouteState = { kind: 'clients' }

function stripPrefix(value: string, prefix: string) {
  return value.startsWith(`${prefix}-`) ? value.slice(prefix.length + 1) : value
}

function ensurePrefix(value: string, prefix: string) {
  return value.startsWith(`${prefix}-`) ? value : `${prefix}-${value}`
}

export function resolveRouteEntityId(value: string, prefix: string, existingIds: string[]): string | null {
  if (!value) return null
  if (existingIds.includes(value)) return value
  const withPrefix = ensurePrefix(value, prefix)
  if (existingIds.includes(withPrefix)) return withPrefix
  const stripped = stripPrefix(value, prefix)
  if (existingIds.includes(stripped)) return stripped
  return null
}

export function normalizeRouteForAvailability(route: RouteState): RouteState {
  if (route.kind === 'templates' && !features.templates) return DISABLED_FEATURE_FALLBACK_ROUTE
  return route
}

export function parseRouteFromPath(pathname: string): RouteState {
  const cleanedPath = pathname.startsWith('/inloggen') ? pathname.slice('/inloggen'.length) : pathname
  const path = cleanedPath.startsWith('/') ? cleanedPath.slice(1) : cleanedPath
  const parts = path.split('/').filter(Boolean)

  if (parts[0] === 'opnemen') return { kind: 'record' }
  if (parts[0] === 'rapportages' && parts[1]) return { kind: 'rapportage', reportId: ensurePrefix(parts[1], 'session') }
  if (parts[0] === 'rapportages') return { kind: 'reports' }

  if (parts[0] === 'clienten' || parts[0] === 'clients' || parts[0] === 'coaches') {
    if (parts[1] === 'nieuw') return { kind: 'new-client' }
    const trajectSegment = parts[0] === 'clienten' ? 'trajecten' : 'trajectories'
    if (parts[1] && parts[2] === trajectSegment && parts[3] && parts[4] === 'items' && parts[5]) {
      return {
        kind: 'item',
        clientId: ensurePrefix(parts[1], 'client'),
        trajectoryId: ensurePrefix(parts[3], 'trajectory'),
        itemId: ensurePrefix(parts[5], 'session'),
      }
    }
    if (parts[1] && parts[2] === trajectSegment && parts[3]) {
      return {
        kind: 'trajectory',
        clientId: ensurePrefix(parts[1], 'client'),
        trajectoryId: ensurePrefix(parts[3], 'trajectory'),
      }
    }
    if (parts[1]) return { kind: 'client', clientId: ensurePrefix(parts[1], 'client') }
    return { kind: 'clients' }
  }

  if (parts[0] === 'dashboard' || parts[0] === 'activiteiten') return { kind: 'dashboard' }
  if (parts[0] === 'sessies') {
    if (parts[1]) return { kind: 'sessie', sessieId: ensurePrefix(parts[1], 'session') }
    return { kind: 'dashboard' }
  }
  if (parts[0] === 'templates') return { kind: 'templates' }
  if (parts[0] === 'nieuwe-rapportage') return { kind: 'nieuwe-rapportage' }
  if (parts[0] === 'mijn-praktijk') return { kind: 'mijn-praktijk' }
  if (parts[0] === 'mijn-profiel') return { kind: 'mijn-profiel' }
  if (parts[0] === 'geschreven-verslag') return { kind: 'nieuwe-rapportage' }
  if (parts[0] === 'archief') return { kind: 'archief' }
  if (parts[0] === 'admin') return { kind: 'admin' }
  if (parts[0] === 'admin-contact') return { kind: 'admin-contact' }
  if (parts[0] === 'admin-wachtlijst') return { kind: 'admin-wachtlijst' }
  return { kind: 'clients' }
}

export function buildPathFromRoute(routeInput: RouteState): string {
  const route = normalizeRouteForAvailability(routeInput)
  if (route.kind === 'dashboard') return '/dashboard'
  if (route.kind === 'record') return '/opnemen'
  if (route.kind === 'rapportage') return `/rapportages/${stripPrefix(route.reportId, 'session')}`
  if (route.kind === 'reports') return '/rapportages'
  if (route.kind === 'new-client') return '/clienten/nieuw'
  if (route.kind === 'sessie') return `/sessies/${stripPrefix(route.sessieId, 'session')}`
  if (route.kind === 'item') {
    return `/clienten/${stripPrefix(route.clientId, 'client')}/trajecten/${stripPrefix(route.trajectoryId, 'trajectory')}/items/${stripPrefix(route.itemId, 'session')}`
  }
  if (route.kind === 'clients') return '/clienten'
  if (route.kind === 'client') return `/clienten/${stripPrefix(route.clientId, 'client')}`
  if (route.kind === 'trajectory') {
    return `/clienten/${stripPrefix(route.clientId, 'client')}/trajecten/${stripPrefix(route.trajectoryId, 'trajectory')}`
  }
  if (route.kind === 'templates') return '/templates'
  if (route.kind === 'nieuwe-rapportage') return '/nieuwe-rapportage'
  if (route.kind === 'mijn-praktijk') return '/mijn-praktijk'
  if (route.kind === 'mijn-profiel') return '/mijn-profiel'
  if (route.kind === 'admin') return '/admin'
  if (route.kind === 'admin-contact') return '/admin-contact'
  if (route.kind === 'admin-wachtlijst') return '/admin-wachtlijst'
  return '/archief'
}

export function routeFromSidebarItemKey(sidebarItemKey: SidebarItemKey): RouteState {
  if (sidebarItemKey === 'clients') return { kind: 'clients' }
  if (sidebarItemKey === 'dashboard') return { kind: 'dashboard' }
  if (sidebarItemKey === 'reports') return { kind: 'reports' }
  if (sidebarItemKey === 'admin') return { kind: 'admin' }
  if (sidebarItemKey === 'adminContact') return { kind: 'admin-contact' }
  if (sidebarItemKey === 'adminWachtlijst') return { kind: 'admin-wachtlijst' }
  if (sidebarItemKey === 'mijnPraktijk') return { kind: 'mijn-praktijk' }
  if (sidebarItemKey === 'mijnProfiel') return { kind: 'mijn-profiel' }
  if (sidebarItemKey === 'archief') return { kind: 'archief' }
  return { kind: 'clients' }
}


