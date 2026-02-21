import { Catamaran_400Regular, Catamaran_500Medium, Catamaran_600SemiBold, Catamaran_700Bold, useFonts } from '@expo-google-fonts/catamaran'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'

import { AppShell } from './src/components/AppShell'
import { AppErrorBoundary } from './src/components/AppErrorBoundary'
import { AuthFlow } from './src/auth/AuthFlow'
import { AuthLoadingScreen } from './src/auth/components/AuthLoadingScreen'
import { AuthScreenLayout } from './src/auth/components/AuthScreenLayout'
import { LocalAppDataProvider } from './src/local/LocalAppDataProvider'
import { getStoredAccessToken, signOutFromEntra } from './src/auth/entraAuth'
import { navigate } from './src/auth/router/webRouter'
import { E2eeProvider } from './src/e2ee/E2eeProvider'
import { warmUpSecureApi } from './src/services/secureApi'
import { ThemeProvider } from './src/theme/ThemeProvider'

export default function App() {
  const [areFontsLoaded] = useFonts({
    Catamaran_400Regular,
    Catamaran_500Medium,
    Catamaran_600SemiBold,
    Catamaran_700Bold,
  })

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const token = getStoredAccessToken()
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void warmUpSecureApi()
  }, [isAuthenticated])

  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
    }
  }, [])

  if (!areFontsLoaded) {
    return null
  }

  return (
    <ThemeProvider>
      <>
        {/* App status bar */}
        <StatusBar style="auto" />
        {/* App shell */}
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
                      if (logoutTimeoutRef.current) {
                        clearTimeout(logoutTimeoutRef.current)
                      }
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
              <AuthFlow onAuthenticated={() => setIsAuthenticated(true)} />
            )}
          </LocalAppDataProvider>
        </E2eeProvider>
      </>
    </ThemeProvider>
  )
}
