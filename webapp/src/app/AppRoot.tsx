import { Catamaran_400Regular, Catamaran_500Medium, Catamaran_600SemiBold, Catamaran_700Bold, useFonts } from '@expo-google-fonts/catamaran'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'

import { WebappAnalyticsTracker } from '../analytics/WebappAnalyticsTracker'
import { signOutFromEntra } from '../screens/authentication/internal/entraAuth'
import { navigate } from '../screens/authentication/internal/router/webRouter'
import { LoginScreen } from '../screens/authentication/LoginScreen'
import { AuthLoadingScreen } from '../screens/authentication/internal/ui/AuthLoadingScreen'
import { AuthScreenLayout } from '../screens/authentication/internal/ui/AuthScreenLayout'
import { AppShell } from './AppShell'
import { AppErrorBoundary } from './ErrorBoundary'
import { LocalAppDataProvider } from '../storage/LocalAppDataProvider'
import { E2eeProvider } from '../encryption/E2eeProvider'
import { warmUpSecureApi } from '../api/secureApi'
import { AppProviders } from './providers/AppProviders'
import { getInitialAuthenticationState } from './bootstrap/authBootstrap'

export function AppRoot() {
  const [areFontsLoaded] = useFonts({
    Catamaran_400Regular,
    Catamaran_500Medium,
    Catamaran_600SemiBold,
    Catamaran_700Bold,
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => getInitialAuthenticationState())
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    void warmUpSecureApi()
  }, [isAuthenticated])

  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
    }
  }, [])

  if (!areFontsLoaded) return null

  return (
    <AppProviders>
      <StatusBar style="auto" />
      <WebappAnalyticsTracker isAuthenticated={isAuthenticated} />
      <E2eeProvider isAuthenticated={isAuthenticated}>
        <LocalAppDataProvider isAuthenticated={isAuthenticated}>
          {isLoggingOut ? (
            <AuthScreenLayout>
              <AuthLoadingScreen message="Bezig met uitloggen..." />
            </AuthScreenLayout>
          ) : isAuthenticated ? (
            <AppErrorBoundary onReset={() => setIsAuthenticated(false)}>
              <AppShell
                onLogout={() => {
                  void (async () => {
                    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
                    setIsLoggingOut(true)
                    setIsAuthenticated(false)
                    navigate('/inloggen', { replace: true })
                    try {
                      await signOutFromEntra()
                    } finally {
                      logoutTimeoutRef.current = setTimeout(() => setIsLoggingOut(false), 300)
                    }
                  })()
                }}
              />
            </AppErrorBoundary>
          ) : (
            <LoginScreen onAuthenticated={() => setIsAuthenticated(true)} />
          )}
        </LocalAppDataProvider>
      </E2eeProvider>
    </AppProviders>
  )
}
