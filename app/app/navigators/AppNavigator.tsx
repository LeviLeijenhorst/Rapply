import { NavigationContainer, NavigationState, PartialState } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import React, { useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"

import Config from "@/config"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import CoacheesScreen from "@/screens/CoacheesScreen"
import SettingsScreen from "@/screens/SettingsScreen"
import { useAppTheme } from "@/theme/context"
import AddCoacheeScreen from "@/screens/AddCoacheeScreen"
import CoacheeEditScreen from "@/screens/CoacheeEditScreen"
import RecordingScreen from "@/screens/RecordingScreen"
import TranscriptionDetailsScreen from "@/screens/TranscriptionDetailsScreen"
import CoacheeScreen from "@/screens/CoacheeScreen"
import WrittenReportScreen from "@/screens/WrittenReportScreen"
import ConversationScreen from "@/screens/ConversationScreen"
import LoginScreen from "@/screens/LoginScreen"
import SignupScreen from "@/screens/SignupScreen"
import ResetPasswordScreen from "@/screens/ResetPasswordScreen"
import AuthWelcomeScreen from "@/screens/AuthWelcomeScreen"
import LoadingScreen from "@/screens/LoadingScreen"
import KeyCustodySetupScreen from "@/screens/KeyCustodySetupScreen"
import VerifyEmailScreen from "@/screens/VerifyEmailScreen"
import ContactFeedbackScreen from "@/screens/ContactFeedbackScreen"
import SettingsAccountScreen from "@/screens/SettingsAccountScreen"
import ChangePasswordScreen from "@/screens/ChangePasswordScreen"
import SubscriptionScreen from "@/screens/SubscriptionScreen"
import SubscriptionCancelScreen from "@/screens/SubscriptionCancelScreen"
import SubscriptionTipsScreen from "@/screens/SubscriptionTipsScreen"
import SubscriptionPraktijkScreen from "@/screens/SubscriptionPraktijkScreen"

import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler, getActiveRouteName } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: "#ffffff",
        contentStyle: {
          backgroundColor: "#ffffff",
        },
      }}
      initialRouteName="Loading"
    >
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="KeyCustodySetup" component={KeyCustodySetupScreen} />
      <Stack.Screen name="AuthWelcome" component={AuthWelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Welcome" component={CoacheesScreen} options={{ animation: "default" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "default" }} />
      <Stack.Screen name="AddCoachee" component={AddCoacheeScreen} />
      <Stack.Screen name="CoacheeEdit" component={CoacheeEditScreen} />
      <Stack.Screen name="Recording" component={RecordingScreen} />
      <Stack.Screen name="TranscriptionDetails" component={TranscriptionDetailsScreen} />
      <Stack.Screen name="CoacheeDetail" component={CoacheeScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="WrittenReport" component={WrittenReportScreen} />
      <Stack.Screen name="ContactFeedback" component={ContactFeedbackScreen} />
      <Stack.Screen name="SettingsAccount" component={SettingsAccountScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="SubscriptionCancel" component={SubscriptionCancelScreen} />
      <Stack.Screen name="SubscriptionTips" component={SubscriptionTipsScreen} />
      <Stack.Screen name="SubscriptionPraktijk" component={SubscriptionPraktijkScreen} />
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { onReady, onStateChange, ...navigationContainerProps } = props
  const { navigationTheme, theme } = useAppTheme()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const previousRouteNameRef = useRef<string | undefined>(undefined)

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  function handleStateChange(state: NavigationState | PartialState<NavigationState> | undefined) {
    if (!state) return
    const currentRouteName = getActiveRouteName(state as NavigationState)
    if (previousRouteNameRef.current !== currentRouteName) {
      setIsTransitioning(true)
      requestAnimationFrame(() => {
        setIsTransitioning(false)
      })
      previousRouteNameRef.current = currentRouteName
    }
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        const state = navigationRef.getRootState()
        if (state) previousRouteNameRef.current = getActiveRouteName(state)
        onReady?.()
      }}
      onStateChange={(state) => {
        handleStateChange(state)
        onStateChange?.(state)
      }}
      {...navigationContainerProps}
    >
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
        {isTransitioning && (
          <View pointerEvents="none" style={[styles.loaderOverlay, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        )}
      </ErrorBoundary>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loaderOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
})
