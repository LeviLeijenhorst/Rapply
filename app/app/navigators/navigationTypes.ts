import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Demo Tab Navigator types
export type DemoTabParamList = {
  DemoCommunity: undefined
  DemoShowroom: { queryIndex?: string; itemIndex?: string }
  DemoDebug: undefined
  DemoPodcastList: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  Welcome: { newCoacheeName?: string; newCoacheeNames?: string[] } | undefined
  Settings: { showSaved?: boolean } | undefined
  AddCoachee: undefined
  CoacheeEdit: { coacheeName: string }
  Recording: { coacheeName?: string; mode?: "conversation" | "spoken_report" } | undefined
  TranscriptionDetails: {
    coacheeName?: string
    title?: string
    sessionType?: "audio" | "written_report" | "spoken_report"
    sourceUri?: string
    encryptedRecordingPath?: string
    recordingId?: string
  } | undefined
  CoacheeDetail: { coacheeName: string; newSessionTitle?: string; newSessionType?: "audio" | "written_report" | "spoken_report"; newSessionId?: string }
  WrittenReport: { coacheeName?: string } | undefined
  Conversation: { coacheeName?: string; title?: string; conversationId?: string; durationSeconds?: number; sessionType?: "audio" | "written_report"; spokenReport?: boolean } | undefined
  Login: undefined
  Signup: undefined
  VerifyEmail: { message?: string } | undefined
  ResetPassword: undefined
  AuthWelcome: undefined
  Loading: undefined
  ContactFeedback: undefined
  SettingsAccount: undefined
  ChangePassword: undefined
  Subscription: { selectedPlan?: import("../screens/subscriptionFlowData").SubscriptionPlanKey } | undefined
  SubscriptionCancel:
    | {
        selectedPlan?: import("../screens/subscriptionFlowData").SubscriptionPlanKey
        selectedReason?: import("../screens/subscriptionFlowData").SubscriptionCancelReasonKey
        otherReasonText?: string
      }
    | undefined
  SubscriptionTips:
    | {
        selectedPlan?: import("../screens/subscriptionFlowData").SubscriptionPlanKey
        selectedReason?: import("../screens/subscriptionFlowData").SubscriptionCancelReasonKey
        otherReasonText?: string
        tipsText?: string
      }
    | undefined
  SubscriptionPraktijk: undefined
  Demo: NavigatorScreenParams<DemoTabParamList>
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type DemoTabScreenProps<T extends keyof DemoTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<DemoTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}
