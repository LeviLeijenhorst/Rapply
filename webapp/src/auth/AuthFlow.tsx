import React, { useEffect, useRef, useState } from 'react'
import { AuthLoadingScreen } from './components/AuthLoadingScreen'
import { AuthScreenLayout } from './components/AuthScreenLayout'
import { AuthCardVerticalSwapTransition } from './components/AuthCardVerticalSwapTransition'
import { AuthEntryScreen } from './screens/AuthEntryScreen'
import { getValidAccessToken, handleAuthCallback } from './entraAuth'
import { navigate, usePathname } from './router/webRouter'

type Props = {
  onAuthenticated: () => void
}

export function AuthFlow({ onAuthenticated }: Props) {
  const pathname = usePathname()
  const [authError, setAuthError] = useState<string | null>(null)
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)
  const hasHandledCallback = useRef(false)

  useEffect(() => {
    if (pathname === '/') {
      navigate('/inloggen', { replace: true })
    }
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/auth/callback') return
    if (hasHandledCallback.current) return
    hasHandledCallback.current = true
    setIsProcessingCallback(true)

    handleAuthCallback()
      .then(() => {
        onAuthenticated()
        navigate('/sessies', { replace: true })
      })
      .catch((error) => {
        console.error('[AuthFlow] Entra callback failed', error)
        setAuthError(error instanceof Error ? error.message : 'Inloggen mislukt')
        navigate('/inloggen', { replace: true })
        hasHandledCallback.current = false
        setIsProcessingCallback(false)
      })
  }, [onAuthenticated, pathname])

  useEffect(() => {
    if (pathname === '/auth/callback') return
    let isActive = true

    void (async () => {
      const token = await getValidAccessToken()
      if (!isActive) return
      if (token) {
        onAuthenticated()
        navigate('/sessies', { replace: true })
      }
    })()

    return () => {
      isActive = false
    }
  }, [onAuthenticated, pathname])

  function renderRoute(routePathname: string) {
    if (routePathname === '/auth/callback') {
      return <AuthLoadingScreen message={authError ?? 'Bezig met inloggen...'} />
    }

    if (routePathname === '/inloggen' || routePathname === '/registreren') {
      const entryKey = routePathname === '/registreren' ? 'registreren' : 'inloggen'

      return (
        <AuthCardVerticalSwapTransition
          contentKey={entryKey}
          render={(contentKey) => (
            <AuthEntryScreen
              mode={contentKey === 'registreren' ? 'registreren' : 'inloggen'}
              onStartLogin={() => setAuthError(null)}
            />
          )}
        />
      )
    }

    return (
      <AuthCardVerticalSwapTransition
        contentKey="auth-fallback"
        render={() => (
          <AuthEntryScreen mode="inloggen" onStartLogin={() => setAuthError(null)} />
        )}
      />
    )
  }

  return (
    <AuthScreenLayout>
      {/* Authentication flow */}
      {isProcessingCallback ? <AuthLoadingScreen message={authError ?? 'Bezig met inloggen...'} /> : renderRoute(pathname)}
    </AuthScreenLayout>
  )
}
