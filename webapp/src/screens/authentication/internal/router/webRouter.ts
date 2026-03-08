import { useEffect, useState } from 'react'

type Listener = () => void

const listeners = new Set<Listener>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function getPathnameFromWindow() {
  if (typeof window === 'undefined') return '/inloggen'
  const pathname = window.location.pathname
  if (!pathname) return '/inloggen'
  return pathname
}

export function navigate(pathname: string, options?: { replace?: boolean }) {
  if (typeof window === 'undefined') return

  const targetPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (options?.replace) {
    window.history.replaceState({}, '', targetPathname)
  } else {
    window.history.pushState({}, '', targetPathname)
  }
  notify()
}

export function usePathname() {
  const [pathname, setPathname] = useState(getPathnameFromWindow)

  useEffect(() => {
    function onPopState() {
      setPathname(getPathnameFromWindow())
    }

    function onNotify() {
      setPathname(getPathnameFromWindow())
    }

    window.addEventListener('popstate', onPopState)
    listeners.add(onNotify)

    return () => {
      window.removeEventListener('popstate', onPopState)
      listeners.delete(onNotify)
    }
  }, [])

  return pathname
}

