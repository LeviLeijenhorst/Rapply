import { useEffect } from 'react'

import { trackWebappError, trackWebappEvent } from '../api/analytics'

type Props = {
  isAuthenticated: boolean
}

function readElementData(target: EventTarget | null): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  if (!(target instanceof Element)) return {}

  const element = target as HTMLElement
  const text = String(element.textContent || '').trim().slice(0, 120)
  const href = element instanceof HTMLAnchorElement ? element.href : element.closest('a')?.getAttribute('href')

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    className: String(element.className || '').slice(0, 160) || null,
    role: element.getAttribute('role'),
    ariaLabel: element.getAttribute('aria-label'),
    text: text || null,
    href: href || null,
    testId: element.getAttribute('data-testid'),
  }
}

export function WebappAnalyticsTracker({ isAuthenticated }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastPath = ''
    const emitVisit = () => {
      const path = window.location.pathname
      if (path === lastPath) return
      lastPath = path
      trackWebappEvent(
        {
          type: 'visit',
          action: 'page_open',
          path,
          metadata: {
            source: 'webapp',
          },
        },
        { authenticated: isAuthenticated },
      )
    }
    emitVisit()

    const onClick = (event: MouseEvent) => {
      trackWebappEvent(
        {
          type: 'click',
          action: 'user_click',
          path: window.location.pathname,
          metadata: readElementData(event.target),
        },
        { authenticated: isAuthenticated },
      )
    }

    const onError = (event: ErrorEvent) => {
      trackWebappError(event.error || event.message, {
        filename: event.filename || null,
        lineno: event.lineno || null,
        colno: event.colno || null,
      }, { authenticated: isAuthenticated })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackWebappError(event.reason, { kind: 'unhandledrejection' }, { authenticated: isAuthenticated })
    }

    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args)
      emitVisit()
    }
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args)
      emitVisit()
    }
    const onPopState = () => emitVisit()

    document.addEventListener('click', onClick, true)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      window.removeEventListener('popstate', onPopState)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [isAuthenticated])

  return null
}
