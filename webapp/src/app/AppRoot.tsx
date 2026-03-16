import { Catamaran_400Regular, Catamaran_500Medium, Catamaran_600SemiBold, Catamaran_700Bold, useFonts } from '@expo-google-fonts/catamaran'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'

import { WebappAnalyticsTracker } from '../analytics/WebappAnalyticsTracker'
import { signOutFromEntra } from '../screens/authentication/internal/entraAuth'
import { navigate } from '../screens/authentication/internal/router/webRouter'
import { LoginScreen } from '../screens/authentication/LoginScreen'
import { AuthLoadingScreen } from '../screens/authentication/internal/ui/AuthLoadingScreen'
import { AuthScreenLayout } from '../screens/authentication/internal/ui/AuthScreenLayout'
import { AppShell } from '../app/shell/AppShell'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { LocalAppDataProvider } from '../storage/LocalAppDataProvider'
import { E2eeProvider } from '../security/providers/E2eeProvider'
import { warmUpSecureApi } from '../api/secureApi'
import { AppProviders } from './providers/AppProviders'
import { getInitialAuthenticationState } from './bootstrap/authBootstrap'

const DEV_AUTH_BYPASS = String(process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS || '').trim().toLowerCase() === 'true'

export function AppRoot() {
  const [areFontsLoaded] = useFonts({
    Catamaran_400Regular,
    Catamaran_500Medium,
    Catamaran_600SemiBold,
    Catamaran_700Bold,
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => getInitialAuthenticationState())
  const isAppAuthenticated = isAuthenticated || DEV_AUTH_BYPASS
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAppAuthenticated) return
    void warmUpSecureApi()
  }, [isAppAuthenticated])

  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
    }
  }, [])

  if (!areFontsLoaded) return null

  return (
    <AppProviders>
      <StatusBar style="auto" />
      <WebappAnalyticsTracker isAuthenticated={isAppAuthenticated} />
      <E2eeProvider isAuthenticated={isAppAuthenticated}>
        <LocalAppDataProvider isAuthenticated={isAppAuthenticated}>
          {isLoggingOut ? (
            <AuthScreenLayout>
              <AuthLoadingScreen message="Bezig met uitloggen..." />
            </AuthScreenLayout>
          ) : isAppAuthenticated ? (
            <ErrorBoundary onReset={() => setIsAuthenticated(false)}>
              <AppShell
                onLogout={() => {
                  void (async () => {
                    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
                    setIsLoggingOut(true)
                    setIsAuthenticated(false)
                    if (!DEV_AUTH_BYPASS) navigate('/inloggen', { replace: true })
                    try {
                      if (!DEV_AUTH_BYPASS) await signOutFromEntra()
                    } finally {
                      logoutTimeoutRef.current = setTimeout(() => setIsLoggingOut(false), 300)
                    }
                  })()
                }}
              />
            </ErrorBoundary>
          ) : (
            <LoginScreen onAuthenticated={() => setIsAuthenticated(true)} />
          )}
        </LocalAppDataProvider>
      </E2eeProvider>
    </AppProviders>
  )
}



