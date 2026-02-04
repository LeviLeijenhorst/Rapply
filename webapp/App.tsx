import { Catamaran_400Regular, Catamaran_500Medium, Catamaran_600SemiBold, Catamaran_700Bold, useFonts } from '@expo-google-fonts/catamaran'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'

import { AppShell } from './src/components/AppShell'
import { AppErrorBoundary } from './src/components/AppErrorBoundary'
import { AuthFlow } from './src/auth/AuthFlow'
import { AuthLoadingScreen } from './src/auth/components/AuthLoadingScreen'
import { AuthScreenLayout } from './src/auth/components/AuthScreenLayout'
import { LocalAppDataProvider } from './src/local/LocalAppDataProvider'
import { clearEntraLocalTokens, getStoredAccessToken } from './src/auth/entraAuth'
import { navigate } from './src/auth/router/webRouter'

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
    <>
      {/* App status bar */}
      <StatusBar style="auto" />
      {/* App shell */}
      <LocalAppDataProvider>
        {isLoggingOut ? (
          <AuthScreenLayout>
            <AuthLoadingScreen message="Bezig met uitloggen..." />
          </AuthScreenLayout>
        ) : isAuthenticated ? (
          <AppErrorBoundary onReset={() => setIsAuthenticated(false)}>
            <AppShell
              onLogout={() => {
                if (logoutTimeoutRef.current) {
                  clearTimeout(logoutTimeoutRef.current)
                }
                setIsLoggingOut(true)
                clearEntraLocalTokens()
                setIsAuthenticated(false)
                navigate('/inloggen', { replace: true })
                logoutTimeoutRef.current = setTimeout(() => setIsLoggingOut(false), 300)
              }}
            />
          </AppErrorBoundary>
        ) : (
          <AuthFlow onAuthenticated={() => setIsAuthenticated(true)} />
        )}
      </LocalAppDataProvider>
    </>
  )
}
