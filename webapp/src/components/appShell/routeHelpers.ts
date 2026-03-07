import type { SidebarItemKey } from '../Sidebar'
import { features } from '../../config/features'

export type RouteState =
  | { kind: 'activities' }
  | { kind: 'sessie'; sessieId: string }
  | { kind: 'item'; coacheeId: string; trajectoryId: string; itemId: string }
  | { kind: 'coachees' }
  | { kind: 'coachee'; coacheeId: string }
  | { kind: 'trajectory'; coacheeId: string; trajectoryId: string }
  | { kind: 'templates' }
  | { kind: 'nieuwe-rapportage' }
  | { kind: 'mijn-praktijk' }
  | { kind: 'geschrevenVerslag' }
  | { kind: 'archief' }
  | { kind: 'admin' }
  | { kind: 'admin-contact' }
  | { kind: 'admin-wachtlijst' }

const DISABLED_FEATURE_FALLBACK_ROUTE: RouteState = { kind: 'coachees' }

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
  // Activities/Templates stay in the internal route model for future activation.
  // While disabled, we always normalize to a supported active route.
  if (route.kind === 'activities' && !features.activities) return DISABLED_FEATURE_FALLBACK_ROUTE
  if (route.kind === 'templates' && !features.templates) return DISABLED_FEATURE_FALLBACK_ROUTE
  return route
}

export function parseRouteFromPath(pathname: string): RouteState {
  const cleanedPath = pathname.startsWith('/inloggen') ? pathname.slice('/inloggen'.length) : pathname
  const path = cleanedPath.startsWith('/') ? cleanedPath.slice(1) : cleanedPath
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'clienten' || parts[0] === 'coachees' || parts[0] === 'coaches') {
    const trajectSegment = parts[0] === 'clienten' ? 'trajecten' : 'trajectories'
    if (parts[1] && parts[2] === trajectSegment && parts[3] && parts[4] === 'items' && parts[5]) {
      return {
        kind: 'item',
        coacheeId: ensurePrefix(parts[1], 'coachee'),
        trajectoryId: ensurePrefix(parts[3], 'trajectory'),
        itemId: ensurePrefix(parts[5], 'session'),
      }
    }
    if (parts[1] && parts[2] === trajectSegment && parts[3]) {
      return {
        kind: 'trajectory',
        coacheeId: ensurePrefix(parts[1], 'coachee'),
        trajectoryId: ensurePrefix(parts[3], 'trajectory'),
      }
    }
    if (parts[1]) return { kind: 'coachee', coacheeId: ensurePrefix(parts[1], 'coachee') }
    return { kind: 'coachees' }
  }
  if (parts[0] === 'activiteiten') return { kind: 'activities' }
  if (parts[0] === 'sessies') {
    if (parts[1]) return { kind: 'sessie', sessieId: ensurePrefix(parts[1], 'session') }
    return { kind: 'activities' }
  }
  if (parts[0] === 'templates') return { kind: 'templates' }
  if (parts[0] === 'nieuwe-rapportage') return { kind: 'nieuwe-rapportage' }
  if (parts[0] === 'mijn-praktijk') return { kind: 'mijn-praktijk' }
  if (parts[0] === 'geschreven-verslag') return { kind: 'geschrevenVerslag' }
  if (parts[0] === 'archief') return { kind: 'archief' }
  if (parts[0] === 'admin') return { kind: 'admin' }
  if (parts[0] === 'admin-contact') return { kind: 'admin-contact' }
  if (parts[0] === 'admin-wachtlijst') return { kind: 'admin-wachtlijst' }
  return { kind: 'coachees' }
}

export function buildPathFromRoute(routeInput: RouteState): string {
  const route = normalizeRouteForAvailability(routeInput)
  if (route.kind === 'activities') return '/activiteiten'
  if (route.kind === 'sessie') return `/sessies/${stripPrefix(route.sessieId, 'session')}`
  if (route.kind === 'item') {
    return `/clienten/${stripPrefix(route.coacheeId, 'coachee')}/trajecten/${stripPrefix(route.trajectoryId, 'trajectory')}/items/${stripPrefix(route.itemId, 'session')}`
  }
  if (route.kind === 'coachees') return '/clienten'
  if (route.kind === 'coachee') return `/clienten/${stripPrefix(route.coacheeId, 'coachee')}`
  if (route.kind === 'trajectory') {
    return `/clienten/${stripPrefix(route.coacheeId, 'coachee')}/trajecten/${stripPrefix(route.trajectoryId, 'trajectory')}`
  }
  if (route.kind === 'templates') return '/templates'
  if (route.kind === 'nieuwe-rapportage') return '/nieuwe-rapportage'
  if (route.kind === 'mijn-praktijk') return '/mijn-praktijk'
  if (route.kind === 'geschrevenVerslag') return '/geschreven-verslag'
  if (route.kind === 'admin') return '/admin'
  if (route.kind === 'admin-contact') return '/admin-contact'
  if (route.kind === 'admin-wachtlijst') return '/admin-wachtlijst'
  return '/archief'
}

export function routeFromSidebarItemKey(sidebarItemKey: SidebarItemKey): RouteState {
  if (sidebarItemKey === 'coachees') return { kind: 'coachees' }
  if (sidebarItemKey === 'activities') return { kind: 'activities' }
  if (sidebarItemKey === 'templates') return { kind: 'templates' }
  if (sidebarItemKey === 'admin') return { kind: 'admin' }
  if (sidebarItemKey === 'adminContact') return { kind: 'admin-contact' }
  if (sidebarItemKey === 'adminWachtlijst') return { kind: 'admin-wachtlijst' }
  if (sidebarItemKey === 'mijnPraktijk') return { kind: 'mijn-praktijk' }
  if (sidebarItemKey === 'archief') return { kind: 'archief' }
  return { kind: 'coachees' }
}
