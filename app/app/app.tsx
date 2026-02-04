/* eslint-disable import/first */
/**
 * Welcome to the main entry point of the app. In this file, we'll
 * be kicking off our app.
 *
 * Most of this file is boilerplate and you shouldn't need to modify
 * it very often. But take some time to look through and understand
 * what is going on here.
 *
 * The app navigation resides in ./app/navigators, so head over there
 * if you're interested in adding screens and navigators.
 */
if (__DEV__) {
  // Load Reactotron in development only.
  // Note that you must be using metro's `inlineRequires` for this to work.
  // If you turn it off in metro.config.js, you'll have to manually import it.
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { Buffer } from "buffer";
global.Buffer = Buffer;

import { useEffect, useMemo, useState } from "react"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"
import { View, Pressable } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { initI18n } from "./i18n"
import { AppNavigator } from "./navigators/AppNavigator"
import { getActiveRouteName, navigate, navigationRef, useNavigationPersistence, goBack } from "./navigators/navigationUtilities"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import { logger } from "./utils/logger"
import * as storage from "./utils/storage"
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { configureRevenueCat } from "./services/revenuecat"
import { tabBarTotalHeight, safeAreaBottom, colors, vibrate } from "./screens/constants"
import { TabBar } from "./screens/TabBar"
import { Icon } from "./screens/Icon"
import { syncRevenueCatIdentity } from "./services/revenuecat"
import { deleteDirectory } from "./screens/EncryptedStorage"
import { invalidateBillingStatusCache } from "./services/billing"
import { onAuthSessionChange } from "./services/auth"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Web linking configuration
const prefix = Linking.createURL("/")
const config = {
  screens: {
    Login: {
      path: "",
    },
    Welcome: "welcome",
    Settings: "settings",
  },
}

/**
 * This is the root component of our app.
 * @param {AppProps} props - The props for the `App` component.
 * @returns {JSX.Element} The rendered `App` component.
 */
export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>(undefined)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  useEffect(() => {
    // Debug Entra redirect: confirm whether the app receives the deep link callback.
    Linking.getInitialURL()
      .then((url) => {
        if (url) logger.info("[linking] initialURL", { url })
      })
      .catch(() => {})

    const sub = Linking.addEventListener("url", ({ url }) => {
      logger.info("[linking] url", { url })
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    configureRevenueCat()
    let lastUserId: string | null = null
    const unsubscribe = onAuthSessionChange(async (session) => {
      const nextUserId = session?.userId ?? null

      const isSwitchingBetweenDifferentUsers = !!nextUserId && !!lastUserId && nextUserId !== lastUserId
      if (isSwitchingBetweenDifferentUsers) {
        invalidateBillingStatusCache()
        try {
          await deleteDirectory("CoachScribe")
        } catch {}
        try {
          await deleteDirectory("coachees")
        } catch {}
      }

      if (nextUserId && !lastUserId) {
        lastUserId = nextUserId
      }

      try {
        await syncRevenueCatIdentity(nextUserId)
      } catch {}
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const linking = {
    prefixes: [prefix],
    config,
  }

  const containerHeight = useMemo(() => 86 + safeAreaBottom, [])

  const showTabBar = useMemo(() => {
    if (!currentRouteName) return false
    return currentRouteName === "Welcome" || currentRouteName === "CoacheeDetail" || currentRouteName === "Settings"
  }, [currentRouteName])

  const activeBottomTab = useMemo<"coachees" | "settings">(() => {
    if (currentRouteName === "Settings") return "settings"
    if (currentRouteName === "Welcome" || currentRouteName === "CoacheeDetail") return "coachees"
    return "coachees"
  }, [currentRouteName])

  const offsetY = useSharedValue(showTabBar ? 0 : containerHeight)
  const barAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offsetY.value }] }))

  useEffect(() => {
    offsetY.value = withTiming(showTabBar ? 0 : containerHeight, { duration: 220, easing: Easing.out(Easing.quad) })
  }, [showTabBar, containerHeight])

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color.
  // In iOS: application:didFinishLaunchingWithOptions:
  // In Android: https://stackoverflow.com/a/45838109/204044
  // You can replace with your own loading component if you wish.
  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  // otherwise, we're ready to render the app
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <KeyboardProvider>
        <ThemeProvider initialContext="light">
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingBottom: showTabBar ? tabBarTotalHeight : 0 }}>
              <AppNavigator
                linking={linking}
                initialState={initialNavigationState}
                onReady={() => {
                  const state = navigationRef.getRootState()
                  if (state) {
                    const name = getActiveRouteName(state as any)
                    setCurrentRouteName(name)
                  }
                }}
                onStateChange={(state) => {
                  onNavigationStateChange(state)
                  if (state) {
                    const name = getActiveRouteName(state as any)
                    setCurrentRouteName(name)
                  }
                }}
              />
            </View>
            <Animated.View pointerEvents="box-none" style={[{ position: "absolute", left: 0, right: 0, bottom: 0, height: containerHeight }, barAnimatedStyle]}>
              <TabBar
                active={activeBottomTab}
                onChange={(t) => {
                  if (t === "coachees") {
                    if (currentRouteName === "Settings" && navigationRef.canGoBack()) {
                      goBack()
                    } else {
                      navigate("Welcome")
                    }
                  } else {
                    if (currentRouteName !== "Settings") {
                      navigate("Settings")
                    }
                  }
                }}
              />
              <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 22 + safeAreaBottom, alignItems: "center" }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    vibrate()
                    function getActiveRoute(state: any): any {
                      const route = state?.routes?.[state.index ?? 0]
                      if (!route?.state) return route
                      return getActiveRoute(route.state)
                    }
                    let coacheeNameParam: string | undefined = undefined
                    try {
                      const root = navigationRef.getRootState?.()
                      const route = root ? getActiveRoute(root) : undefined
                      if (route?.name === "CoacheeDetail") {
                        const p = route?.params || {}
                        if (typeof p?.coacheeName === "string" && p.coacheeName.trim()) {
                          coacheeNameParam = p.coacheeName
                        }
                      }
                    } catch {}
                    if (coacheeNameParam) {
                      navigate("Recording", { mode: "conversation", coacheeName: coacheeNameParam })
                    } else {
                      navigate("Recording", { mode: "conversation" })
                    }
                  }}
                  style={({ pressed }) => [
                    {
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: colors.orange,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    pressed && { backgroundColor: colors.orange + "CC" },
                  ]}
                >
                  <Icon name="microphone" color={colors.white} />
                </Pressable>
              </View>
            </Animated.View>
          </GestureHandlerRootView>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}
