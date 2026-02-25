import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { AuthLoadingScreen } from './components/AuthLoadingScreen'
import { AuthScreenLayout } from './components/AuthScreenLayout'
import { AuthCardVerticalSwapTransition } from './components/AuthCardVerticalSwapTransition'
import { AuthEntryScreen } from './screens/AuthEntryScreen'
import { clearAuthIntent, getAuthIntent, getValidAccessToken, handleAuthCallback, signInWithEntra } from './entraAuth'
import { navigate, usePathname } from './router/webRouter'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'

type Props = {
  onAuthenticated: () => void
}

export function AuthFlow({ onAuthenticated }: Props) {
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const [authError, setAuthError] = useState<string | null>(null)
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)
  const hasHandledCallback = useRef(false)
  const hasStartedDirectSignIn = useRef(false)

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
        const intent = getAuthIntent()
        clearAuthIntent()
        const mode = intent === 'signup' ? 'signup' : 'signin'
        setAuthError(toUserFriendlyErrorMessage(error, {
          fallback: 'Inloggen mislukt',
          forbiddenMessage: 'Je hebt geen toegang tot dit account.',
        }))
        navigate(`/inloggen?mode=${mode}`, { replace: true })
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

  useEffect(() => {
    if (pathname !== '/inloggen') {
      hasStartedDirectSignIn.current = false
      return
    }
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('direct') !== '1') return
    if (hasStartedDirectSignIn.current) return
    hasStartedDirectSignIn.current = true

    setAuthError(null)
    setIsProcessingCallback(true)
    signInWithEntra().catch((error) => {
      console.error('[AuthFlow] direct Entra sign in failed', error)
      setAuthError(toUserFriendlyErrorMessage(error, {
        fallback: 'Inloggen mislukt',
        forbiddenMessage: 'Je hebt geen toegang tot dit account.',
      }))
      navigate('/inloggen?mode=signin', { replace: true })
      setIsProcessingCallback(false)
      hasStartedDirectSignIn.current = false
    })
  }, [pathname])

  function renderRoute(routePathname: string) {
    if (width < 1100) {
      return (
        <View style={styles.tooSmallContainer}>
          <Text style={styles.tooSmallText}>Deze webapp is niet zichtbaar op schermen smaller dan 1100px.</Text>
        </View>
      )
    }

    if (routePathname === '/auth/callback') {
      return <AuthLoadingScreen message="Bezig met inloggen..." />
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
              errorMessage={authError}
            />
          )}
        />
      )
    }

    return (
      <AuthCardVerticalSwapTransition
        contentKey="auth-fallback"
        render={() => (
          <AuthEntryScreen mode="inloggen" onStartLogin={() => setAuthError(null)} errorMessage={authError} />
        )}
      />
    )
  }

  return (
    <AuthScreenLayout>
      {/* Authentication flow */}
      {isProcessingCallback ? <AuthLoadingScreen message="Bezig met inloggen..." /> : renderRoute(pathname)}
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create({
  tooSmallContainer: {
    width: '100%',
    minHeight: 380,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooSmallText: {
    maxWidth: 520,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textStrong,
    textAlign: 'center',
  },
})
