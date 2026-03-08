import { buildPath } from './buildPath'
import type { RouteState } from './routes'

export function navigateTo(route: RouteState, replace = false) {
  if (typeof window === 'undefined') return
  const nextPath = buildPath(route)
  if (replace) {
    window.history.replaceState({ path: nextPath }, '', nextPath)
    return
  }
  window.history.pushState({ path: nextPath }, '', nextPath)
}
