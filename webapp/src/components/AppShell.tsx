import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { AnimatedMainContent } from '../ui/AnimatedMainContent'
import { Navbar } from './Navbar'
import { Sidebar, SidebarItemKey } from './Sidebar'
import { Text } from '../ui/Text'
import type { CoacheeTabKey } from './coacheeDetail/CoacheeTabs'
import { NewSessionModal } from './newSession/NewSessionModal'
import { FeedbackModal } from './help/FeedbackModal'
import { SettingsMenu } from './settings/SettingsMenu'
import { MyAccountModal } from './settings/MyAccountModal'
import { MySubscriptionModal } from './settings/MySubscriptionModal'
import { ShareCoachscribeModal } from './settings/ShareCoachscribeModal'
import { ContactModal } from './settings/ContactModal'
import { DeleteAccountConfirmModal } from './settings/DeleteAccountConfirmModal'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { CoacheeUpsertModal } from './coachees/CoacheeUpsertModal'
import { saveCoacheeFromUpsert } from '../logic/coachees/coacheesScreenFunctionality'
import {
  fetchCurrentUserProfile,
  fetchSubscriptionAccess,
  requestDeleteAccount,
  resumePendingPreviewAudioTasks,
  submitFeedbackMessage,
} from '../logic/appShell/appShellBackend'
import { useBillingUsage } from '../hooks/useBillingUsage'
import { useAudioUploadQueue } from '../audio/useAudioUploadQueue'
import { useE2ee } from '../e2ee/E2eeProvider'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'
import { useToast } from '../toast/ToastProvider'
import { consumeSubscriptionReturnResumeRequest } from './newSession/subscriptionReturnDraftStore'
import { getCoacheeUpsertValues } from '../utils/coacheeProfile'
import { CoachscribeLogo } from './CoachscribeLogo'
import { MonitorIcon } from '../icons/MonitorIcon'
import { AppShellRouteView } from './appShell/AppShellRouteView'
import {
  type RouteState,
  buildPathFromRoute,
  normalizeRouteForAvailability,
  parseRouteFromPath,
  resolveRouteEntityId,
  routeFromSidebarItemKey,
} from './appShell/routeHelpers'
import { getCurrentRouteFromSelection, getMainContentKey } from './appShell/navigationHelpers'
import { applyRouteToShell } from './appShell/applyRoute'
import { buildBreadcrumbItems } from './appShell/breadcrumbHelpers'

type AnchorPoint = { x: number; y: number }
type OverlayScreenKey = 'archief'

type Props = {
  onLogout: () => void
}

const PRIVACY_BELEID_URL = 'https://www.coachscribe.nl/privacybeleid'
function parseDeleteAccountErrorMessage(error: unknown): string {
  return toUserFriendlyErrorMessage(error, {
    fallback: 'Verwijderen mislukt. Probeer het alsjeblieft later opnieuw.',
    forbiddenMessage: 'Je hebt geen toegang om een account te verwijderen.',
  })
}

export function AppShell({ onLogout }: Props) {
  const { width } = useWindowDimensions()
  const isTooSmall = width < 1100
  const isSidebarCompact = width < 700
  const { data, createCoachee, createSession, createTrajectory, isAppDataLoaded, updateSession } = useLocalAppData()
  const e2ee = useE2ee()
  const { usedMinutes, totalMinutes, isLoading: isUsageLoading } = useBillingUsage()
  useAudioUploadQueue(true)
  const hasResumedPendingAudioRef = useRef(false)

  const [selectedSidebarItemKey, setSelectedSidebarItemKey] = useState<SidebarItemKey>('coachees')
  const [selectedSessieId, setSelectedSessieId] = useState<string | null>(null)
  const [sessionIdPendingTemplatePicker, setSessionIdPendingTemplatePicker] = useState<string | null>(null)
  const [rapportageOnlySessionId, setRapportageOnlySessionId] = useState<string | null>(null)
  const [rapportageScreenMode, setRapportageScreenMode] = useState<'controleren' | 'bewerken'>('controleren')
  const [rapportageEditSessionId, setRapportageEditSessionId] = useState<string | null>(null)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string | null>(null)
  const [sessionOriginRoute, setSessionOriginRoute] = useState<RouteState | null>(null)
  const [coacheeTabById, setCoacheeTabById] = useState<Record<string, CoacheeTabKey>>({})
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [mobileSessionInitialOption, setMobileSessionInitialOption] = useState<'gesprek' | 'gespreksverslag' | null>(null)
  const [newSessionCoacheeId, setNewSessionCoacheeId] = useState<string | null>(null)
  const [newSessionTrajectoryId, setNewSessionTrajectoryId] = useState<string | null>(null)
  const [writtenReportInitialCoacheeId, setWrittenReportInitialCoacheeId] = useState<string | null>(null)
  const [isGeschrevenVerslagOpen, setIsGeschrevenVerslagOpen] = useState(false)
  const [isNieuweRapportageOpen, setIsNieuweRapportageOpen] = useState(false)
  const [overlayScreenKey, setOverlayScreenKey] = useState<OverlayScreenKey | null>(null)
  const [isAdminScreenOpen, setIsAdminScreenOpen] = useState(false)
  const [isAdminContactScreenOpen, setIsAdminContactScreenOpen] = useState(false)
  const [isAdminWachtlijstScreenOpen, setIsAdminWachtlijstScreenOpen] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [currentUserAccountType, setCurrentUserAccountType] = useState<'admin' | 'paid' | 'test' | null>(null)
  const [currentUserGivenName, setCurrentUserGivenName] = useState<string | null>(null)
  const [currentUserSurname, setCurrentUserSurname] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)

  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [settingsMenuAnchorPoint, setSettingsMenuAnchorPoint] = useState<AnchorPoint | null>(null)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

  const [isMyAccountModalOpen, setIsMyAccountModalOpen] = useState(false)
  const [isMySubscriptionModalOpen, setIsMySubscriptionModalOpen] = useState(false)
  const [canOpenSubscription, setCanOpenSubscription] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isCoacheeModalOpen, setIsCoacheeModalOpen] = useState(false)
  const [isEndToEndEncryptiePageOpen, setIsEndToEndEncryptiePageOpen] = useState(false)
  const [previousRoute, setPreviousRoute] = useState<RouteState | null>(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isDeleteAccountConfirmModalOpen, setIsDeleteAccountConfirmModalOpen] = useState(false)
  const [restoreNewSessionDraftFromSubscriptionReturn, setRestoreNewSessionDraftFromSubscriptionReturn] = useState(false)
  const [isRecordingBusy, setIsRecordingBusy] = useState(false)
  const { showToast, showErrorToast } = useToast()
  const isCurrentUserAdmin = currentUserAccountType === 'admin'

  const refreshSubscriptionAccess = useCallback(async () => {
    try {
      const response = await fetchSubscriptionAccess()
      setCanOpenSubscription(response.canOpenSubscription)
      setCurrentPlanId(response.currentPlanId)
    } catch (error) {
      console.warn('[pricing] failed to refresh subscription access; keeping pricing page available', error)
      setCanOpenSubscription(true)
      setCurrentPlanId(null)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    void fetchCurrentUserProfile()
      .then((response) => {
        if (isCancelled) return
        setCurrentUserEmail(response.email)
        setCurrentUserAccountType(response.accountType)
        setCurrentUserGivenName(response.givenName)
        setCurrentUserSurname(response.surname)
        setCurrentUserName(response.displayName)
      })
      .catch(() => {
        if (isCancelled) return
        setCurrentUserEmail(null)
        setCurrentUserAccountType(null)
        setCurrentUserGivenName(null)
        setCurrentUserSurname(null)
        setCurrentUserName(null)
      })
    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    void refreshSubscriptionAccess()
  }, [refreshSubscriptionAccess])

  useEffect(() => {
    if (!isSettingsMenuOpen) return
    void refreshSubscriptionAccess()
  }, [isSettingsMenuOpen, refreshSubscriptionAccess])

  useEffect(() => {
    if (!isAppDataLoaded) return
    if (hasResumedPendingAudioRef.current) return
    hasResumedPendingAudioRef.current = true

    let isCancelled = false
    void (async () => {
      try {
        await resumePendingPreviewAudioTasks({
          sessions: data.sessions,
          e2ee,
          updateSession,
        })
        if (isCancelled) return
      } catch (error) {
        console.error('[AppShell] Failed to load pending audio tasks', error)
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [data.sessions, e2ee, isAppDataLoaded, updateSession])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const tryRestoreNewSessionDraft = () => {
      const shouldRestore = consumeSubscriptionReturnResumeRequest()
      if (!shouldRestore) return
      setRestoreNewSessionDraftFromSubscriptionReturn(true)
      setIsNewSessionModalOpen(true)
    }

    tryRestoreNewSessionDraft()
    window.addEventListener('pageshow', tryRestoreNewSessionDraft)
    return () => window.removeEventListener('pageshow', tryRestoreNewSessionDraft)
  }, [])

  const applyRoute = useCallback(
    (routeInput: RouteState) => {
      applyRouteToShell({
        isCurrentUserAdmin,
        routeInput,
        setIsNieuweRapportageOpen,
        setRapportageScreenMode,
        setRapportageEditSessionId,
        setIsEndToEndEncryptiePageOpen,
        setSelectedSidebarItemKey,
        setIsAdminScreenOpen,
        setIsAdminContactScreenOpen,
        setIsAdminWachtlijstScreenOpen,
        setOverlayScreenKey,
        setIsGeschrevenVerslagOpen,
        setSelectedSessieId,
        setSessionIdPendingTemplatePicker,
        setSelectedCoacheeId,
        setSelectedTrajectoryId,
        setSessionOriginRoute,
      })
    },
    [isCurrentUserAdmin],
  )

  const navigateTo = useCallback(
    (route: RouteState) => {
      const normalizedRoute = normalizeRouteForAvailability(route)
      if (typeof window === 'undefined') {
        applyRoute(normalizedRoute)
        return
      }
      const nextPath = buildPathFromRoute(normalizedRoute)
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ path: nextPath }, '', nextPath)
      }
      applyRoute(normalizedRoute)
    },
    [applyRoute],
  )

  const navigateToReplacingHistory = useCallback(
    (route: RouteState) => {
      const normalizedRoute = normalizeRouteForAvailability(route)
      if (typeof window === 'undefined') {
        applyRoute(normalizedRoute)
        return
      }
      const nextPath = buildPathFromRoute(normalizedRoute)
      window.history.replaceState({ path: nextPath }, '', nextPath)
      applyRoute(normalizedRoute)
    },
    [applyRoute],
  )

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
      return
    }
    if (sessionOriginRoute && selectedSessieId) {
      navigateTo(sessionOriginRoute)
      setSessionOriginRoute(null)
      return
    }
    if (selectedSidebarItemKey === 'coachees' && selectedCoacheeId) {
      navigateTo({ kind: 'coachees' })
      return
    }
    if (selectedSidebarItemKey === 'coachees' && selectedTrajectoryId && selectedCoacheeId) {
      navigateTo({ kind: 'coachee', coacheeId: selectedCoacheeId })
      return
    }
    navigateTo({ kind: 'coachees' })
  }, [navigateTo, selectedCoacheeId, selectedSidebarItemKey, selectedTrajectoryId, sessionOriginRoute, selectedSessieId, setSessionOriginRoute])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = () => {
      const rawRoute = parseRouteFromPath(window.location.pathname)
      const normalizedRoute = normalizeRouteForAvailability(rawRoute)
      const normalizedPath = buildPathFromRoute(normalizedRoute)
      if (window.location.pathname !== normalizedPath) {
        window.history.replaceState({ path: normalizedPath }, '', normalizedPath)
      }
      applyRoute(normalizedRoute)
    }
    if (
      !window.location.pathname ||
      window.location.pathname === '/' ||
      window.location.pathname === '/inloggen' ||
      window.location.pathname === '/sessies' ||
      window.location.pathname === '/sessies/'
    ) {
      const nextPath = buildPathFromRoute({ kind: 'coachees' })
      window.history.replaceState({ path: nextPath }, '', nextPath)
    }
    handlePopState()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [applyRoute])

  const mainContentKey = useMemo(
    () =>
      getMainContentKey({
        isAdminContactScreenOpen,
        isAdminScreenOpen,
        isAdminWachtlijstScreenOpen,
        isGeschrevenVerslagOpen,
        isNieuweRapportageOpen,
        overlayScreenKey,
        selectedCoacheeId,
        selectedSessieId,
        selectedSidebarItemKey,
        selectedTrajectoryId,
      }),
    [isAdminContactScreenOpen, isAdminScreenOpen, isAdminWachtlijstScreenOpen, isGeschrevenVerslagOpen, isNieuweRapportageOpen, overlayScreenKey, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey, selectedTrajectoryId],
  )

  const [newlyCreatedCoacheeId, setNewlyCreatedCoacheeId] = useState<string | null>(null)
  const [newlyCreatedCoacheeName, setNewlyCreatedCoacheeName] = useState<string | null>(null)

  useEffect(() => {
    if (!isAppDataLoaded) return

    if (selectedSessieId) {
      const resolvedSessieId = resolveRouteEntityId(
        selectedSessieId,
        'session',
        data.sessions.map((item) => item.id),
      )
      if (resolvedSessieId && resolvedSessieId !== selectedSessieId) {
        setSelectedSessieId(resolvedSessieId)
        if (typeof window !== 'undefined') {
          const nextPath =
            selectedCoacheeId && selectedTrajectoryId
              ? buildPathFromRoute({ kind: 'item', coacheeId: selectedCoacheeId, trajectoryId: selectedTrajectoryId, itemId: resolvedSessieId })
              : buildPathFromRoute({ kind: 'sessie', sessieId: resolvedSessieId })
          if (window.location.pathname !== nextPath) {
            window.history.replaceState({ path: nextPath }, '', nextPath)
          }
        }
        return
      }
    }

    if (selectedCoacheeId) {
      const resolvedCoacheeId = resolveRouteEntityId(
        selectedCoacheeId,
        'coachee',
        data.coachees.map((item) => item.id),
      )
      if (resolvedCoacheeId && resolvedCoacheeId !== selectedCoacheeId) {
        setSelectedCoacheeId(resolvedCoacheeId)
        if (typeof window !== 'undefined') {
          const nextPath = buildPathFromRoute({ kind: 'coachee', coacheeId: resolvedCoacheeId })
          if (window.location.pathname !== nextPath) {
            window.history.replaceState({ path: nextPath }, '', nextPath)
          }
        }
      }
    }
    if (selectedTrajectoryId) {
      const resolvedTrajectoryId = resolveRouteEntityId(
        selectedTrajectoryId,
        'trajectory',
        data.trajectories.map((item) => item.id),
      )
      if (resolvedTrajectoryId && resolvedTrajectoryId !== selectedTrajectoryId && selectedCoacheeId) {
        setSelectedTrajectoryId(resolvedTrajectoryId)
        if (typeof window !== 'undefined') {
          const nextPath = buildPathFromRoute({ kind: 'trajectory', coacheeId: selectedCoacheeId, trajectoryId: resolvedTrajectoryId })
          if (window.location.pathname !== nextPath) {
            window.history.replaceState({ path: nextPath }, '', nextPath)
          }
        }
      }
    }
  }, [data.coachees, data.sessions, data.trajectories, isAppDataLoaded, selectedCoacheeId, selectedSessieId, selectedTrajectoryId])

  const openNewCoacheeModal = useCallback(() => {
    setIsCoacheeModalOpen(true)
  }, [])

  const openNewSessionModal = useCallback(
    (coacheeId: string | null, trajectoryId: string | null = null, initialOption: 'gesprek' | 'gespreksverslag' | null = null) => {
      if (isRecordingBusy) return
      setMobileSessionInitialOption(initialOption)
      setNewSessionCoacheeId(coacheeId)
      setNewSessionTrajectoryId(trajectoryId)
      setIsNewSessionModalOpen(true)
    },
    [isRecordingBusy],
  )

  const openMobileLimitedSession = useCallback((option: 'gesprek' | 'gespreksverslag') => {
    if (isRecordingBusy) return
    setMobileSessionInitialOption(option)
    setNewSessionCoacheeId(null)
    setNewSessionTrajectoryId(null)
    setIsNewSessionModalOpen(true)
  }, [isRecordingBusy])

  useEffect(() => {
    if (newlyCreatedCoacheeId) {
      const coachee = data.coachees.find((c) => c.id === newlyCreatedCoacheeId && !c.isArchived)
      if (coachee) {
        setNewlyCreatedCoacheeName(coachee.name)
      }
    }
  }, [data.coachees, newlyCreatedCoacheeId])

  const currentRoute = useMemo<RouteState>(
    () =>
      getCurrentRouteFromSelection({
        isAdminContactScreenOpen,
        isAdminScreenOpen,
        isAdminWachtlijstScreenOpen,
        isGeschrevenVerslagOpen,
        isNieuweRapportageOpen,
        overlayScreenKey,
        selectedCoacheeId,
        selectedSessieId,
        selectedSidebarItemKey,
        selectedTrajectoryId,
      }),
    [isAdminContactScreenOpen, isAdminScreenOpen, isAdminWachtlijstScreenOpen, isGeschrevenVerslagOpen, isNieuweRapportageOpen, overlayScreenKey, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey, selectedTrajectoryId],
  )
  const breadcrumbItems = useMemo(
    () =>
      buildBreadcrumbItems({
        coachees: data.coachees,
        sessions: data.sessions,
        trajectories: data.trajectories,
        isNieuweRapportageOpen,
        rapportageScreenMode,
        selectedCoacheeId,
        selectedSessieId,
        selectedSidebarItemKey,
        selectedTrajectoryId,
        writtenReportInitialCoacheeId,
        navigateTo,
      }),
    [data.coachees, data.sessions, data.trajectories, isNieuweRapportageOpen, navigateTo, rapportageScreenMode, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey, selectedTrajectoryId, writtenReportInitialCoacheeId],
  )

  const hasBreadcrumbs = breadcrumbItems.length >= 2 && !isEndToEndEncryptiePageOpen
  const isCoacheeOverviewPage = selectedSidebarItemKey === 'coachees' && !!selectedCoacheeId && !selectedTrajectoryId && !selectedSessieId
  const isCoacheeDetailPage = selectedSidebarItemKey === 'coachees' && !!selectedCoacheeId
  const isE2eeSetupBannerVisible = false
  const isSettingsSelected = isEndToEndEncryptiePageOpen

  const deleteAccount = useCallback(async () => {
    if (isDeletingAccount) return

    try {
      setIsDeletingAccount(true)
      await requestDeleteAccount()
      setIsDeleteAccountConfirmModalOpen(false)
      setIsMyAccountModalOpen(false)
      onLogout()
    } catch (error) {
      console.error('[AppShell] Account verwijderen mislukt', error)
      setIsDeleteAccountConfirmModalOpen(false)
      showErrorToast(parseDeleteAccountErrorMessage(error), 'Verwijderen mislukt. Probeer het later opnieuw.')
    } finally {
      setIsDeletingAccount(false)
    }
  }, [isDeletingAccount, onLogout, showErrorToast])

  const submitFeedback = useCallback(async (feedback: string) => {
    await submitFeedbackMessage(feedback)
    showToast('Feedback verzonden! Bedankt voor je hulp.')
  }, [showToast])


  if (isTooSmall) {
    return (
      <View style={styles.mobileLimitedPage}>
        <View style={styles.mobileLimitedTop}>
          <CoachscribeLogo />
        </View>
        <View style={styles.mobileLimitedCenter}>
          <View style={styles.mobileLimitedMonitorIcon}>
            <MonitorIcon size={26} />
          </View>
          <Text isBold style={styles.mobileLimitedDesktopMessage}>
            Gebruik de desktop versie{'\n'}voor alle functies
          </Text>
          <Image
            source={require('../../assets/mobile-limited/desktop-illustration.png')}
            resizeMode="contain"
            style={styles.mobileLimitedDesktopImage}
          />
        </View>
        <View style={styles.mobileLimitedFooter}>
          <Pressable
            onPress={() => openMobileLimitedSession('gesprek')}
            style={({ hovered }) => [styles.mobileLimitedPrimaryButton, hovered ? styles.mobileLimitedPrimaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.mobileLimitedPrimaryButtonText}>Gesprek opnemen</Text>
          </Pressable>
          <Pressable
            onPress={() => openMobileLimitedSession('gespreksverslag')}
            style={({ hovered }) => [styles.mobileLimitedPrimaryButton, hovered ? styles.mobileLimitedPrimaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.mobileLimitedPrimaryButtonText}>Verslag opnemen</Text>
          </Pressable>
        </View>

        <NewSessionModal
          visible={isNewSessionModalOpen}
          limitedMode
          initialOption={mobileSessionInitialOption}
          onRecordingBusyChange={setIsRecordingBusy}
          initialCoacheeId={null}
          initialTrajectoryId={null}
          onOpenGeschrevenGespreksverslag={() => undefined}
          restoreDraftFromSubscriptionReturn={restoreNewSessionDraftFromSubscriptionReturn}
          onRestoreDraftHandled={() => setRestoreNewSessionDraftFromSubscriptionReturn(false)}
          onClose={() => {
            setIsRecordingBusy(false)
            setIsNewSessionModalOpen(false)
            setMobileSessionInitialOption(null)
            setNewlyCreatedCoacheeId(null)
            setNewSessionCoacheeId(null)
            setNewSessionTrajectoryId(null)
          }}
          onOpenMySubscription={() => {
            if (!canOpenSubscription) return
            setIsMySubscriptionModalOpen(true)
          }}
          onOpenNewCoachee={openNewCoacheeModal}
          newlyCreatedCoacheeId={newlyCreatedCoacheeId}
          onNewlyCreatedCoacheeHandled={() => setNewlyCreatedCoacheeId(null)}
          onOpenSession={(sessionId) => {
            const openedSession = data.sessions.find((item) => item.id === sessionId)
            const nextRoute =
              openedSession?.coacheeId && openedSession?.trajectoryId
                ? ({ kind: 'item', coacheeId: openedSession.coacheeId, trajectoryId: openedSession.trajectoryId, itemId: sessionId } as const)
                : ({ kind: 'sessie', sessieId: sessionId } as const)
            setIsNewSessionModalOpen(false)
            setMobileSessionInitialOption(null)
            setNewSessionTrajectoryId(null)
            setSessionOriginRoute(null)
            navigateTo(nextRoute)
          }}
        />

        <MySubscriptionModal
          visible={isMySubscriptionModalOpen}
          onClose={() => {
            setIsMySubscriptionModalOpen(false)
            void refreshSubscriptionAccess()
          }}
        />
      </View>
    )
  }

  return (
    <View style={styles.page}>
      {/* Top navigation bar */}
      <Navbar
        usedMinutes={usedMinutes}
        totalMinutes={totalMinutes}
        isUsageLoading={isUsageLoading}
        isUsageClickable={canOpenSubscription}
        onPressUsage={() => {
          if (!canOpenSubscription) return
          setIsMySubscriptionModalOpen(true)
        }}
        breadcrumbItems={breadcrumbItems}
        onPressNieuweRapportage={() => navigateTo({ kind: 'nieuwe-rapportage' })}
        isNieuweRapportageDisabled
        onPressRecord={() => openNewSessionModal(selectedCoacheeId ?? null, null, 'gesprek')}
        isRecordDisabled={isRecordingBusy}
      />
      <>
        {/* Page content */}
        <View style={styles.contentRow}>
            {/* Sidebar */}
            <Sidebar
              selectedSidebarItemKey={selectedSidebarItemKey}
              isSettingsSelected={isSettingsSelected}
              isAdminUser={isCurrentUserAdmin}
              onSelectSidebarItem={(sidebarItemKey) => {
                navigateTo(routeFromSidebarItemKey(sidebarItemKey))
                setIsSettingsMenuOpen(false)
              }}
              onOpenSettingsMenu={(anchorPoint) => {
                setSettingsMenuAnchorPoint(anchorPoint)
                setIsSettingsMenuOpen(true)
              }}
            />
            {/* Main content */}
            <View
              style={[
                styles.mainContent,
                isCoacheeDetailPage || isNieuweRapportageOpen ? styles.mainContentNoFrame : undefined,
                hasBreadcrumbs && !isCoacheeOverviewPage && !isNieuweRapportageOpen ? styles.mainContentWithBreadcrumbs : undefined,
                isE2eeSetupBannerVisible
                  ? (hasBreadcrumbs && !isCoacheeOverviewPage && !isNieuweRapportageOpen ? styles.mainContentWithE2eeBarAndBreadcrumbs : styles.mainContentWithE2eeBar)
                  : undefined,
              ]}
            >
              <AnimatedMainContent contentKey={mainContentKey}>
                <AppShellRouteView
                  canOpenSubscription={canOpenSubscription}
                  coacheeTabById={coacheeTabById}
                  data={data}
                  goBack={goBack}
                  isAdminContactScreenOpen={isAdminContactScreenOpen}
                  isAdminScreenOpen={isAdminScreenOpen}
                  isAdminWachtlijstScreenOpen={isAdminWachtlijstScreenOpen}
                  isAppDataLoaded={isAppDataLoaded}
                  isEndToEndEncryptiePageOpen={isEndToEndEncryptiePageOpen}
                  isGeschrevenVerslagOpen={isGeschrevenVerslagOpen}
                  isNieuweRapportageOpen={isNieuweRapportageOpen}
                  isRecordingBusy={isRecordingBusy}
                  mainContentTextStyle={styles.mainContentText}
                  navigateTo={navigateTo}
                  navigateToReplacingHistory={navigateToReplacingHistory}
                  newlyCreatedCoacheeName={newlyCreatedCoacheeName}
                  onClearNewlyCreatedCoachee={() => {
                    setNewlyCreatedCoacheeId(null)
                    setNewlyCreatedCoacheeName(null)
                  }}
                  onOpenMySubscription={() => {
                    if (!canOpenSubscription) return
                    setIsMySubscriptionModalOpen(true)
                  }}
                  onOpenNewCoachee={openNewCoacheeModal}
                  onOpenNewSessionModal={openNewSessionModal}
                  onSetCoacheeTabById={(coacheeId, tabKey) => {
                    setCoacheeTabById((previous) => {
                      if (previous[coacheeId] === tabKey) return previous
                      return { ...previous, [coacheeId]: tabKey }
                    })
                  }}
                  onSetPreviousRoute={setPreviousRoute}
                  onSetRapportageEditSessionId={setRapportageEditSessionId}
                  onSetRapportageOnlySessionId={setRapportageOnlySessionId}
                  onSetRapportageScreenMode={setRapportageScreenMode}
                  onSetSelectedSidebarItemKey={setSelectedSidebarItemKey}
                  onSetSessionIdPendingTemplatePicker={setSessionIdPendingTemplatePicker}
                  onSetSessionOriginRoute={setSessionOriginRoute}
                  onSetWrittenReportInitialCoacheeId={setWrittenReportInitialCoacheeId}
                  onToggleE2eePage={setIsEndToEndEncryptiePageOpen}
                  overlayScreenKey={overlayScreenKey}
                  previousRoute={previousRoute}
                  rapportageEditSessionId={rapportageEditSessionId}
                  rapportageOnlySessionId={rapportageOnlySessionId}
                  rapportageScreenMode={rapportageScreenMode}
                  selectedCoacheeId={selectedCoacheeId}
                  selectedSidebarItemKey={selectedSidebarItemKey}
                  selectedSessieId={selectedSessieId}
                  selectedTrajectoryId={selectedTrajectoryId}
                  sessionIdPendingTemplatePicker={sessionIdPendingTemplatePicker}
                  writtenReportInitialCoacheeId={writtenReportInitialCoacheeId}
                />
              </AnimatedMainContent>
            </View>
          </View>

          <SettingsMenu
            visible={isSettingsMenuOpen}
            anchorPoint={settingsMenuAnchorPoint}
            onClose={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
            }}
            onOpenAccount={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              setIsMyAccountModalOpen(true)
            }}
            onOpenSubscription={() => {
              if (!canOpenSubscription) return
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              setIsMySubscriptionModalOpen(true)
            }}
            onOpenArchive={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              navigateTo({ kind: 'archief' })
            }}
            onOpenFeedback={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              setIsFeedbackModalOpen(true)
            }}
            onOpenContact={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              setIsContactModalOpen(true)
            }}
            onOpenShare={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              setIsShareModalOpen(true)
            }}
            onOpenPrivacy={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              if (typeof window !== 'undefined') {
                window.open(PRIVACY_BELEID_URL, '_blank', 'noopener,noreferrer')
                return
              }
              void Linking.openURL(PRIVACY_BELEID_URL)
            }}
            showSubscriptionItem={canOpenSubscription}
          />

          <NewSessionModal
            visible={isNewSessionModalOpen}
            onRecordingBusyChange={setIsRecordingBusy}
            initialCoacheeId={newSessionCoacheeId}
            initialTrajectoryId={newSessionTrajectoryId}
            onOpenGeschrevenGespreksverslag={(coacheeId) => {
              setIsNewSessionModalOpen(false)
              setMobileSessionInitialOption(null)
              setNewSessionCoacheeId(null)
              setNewSessionTrajectoryId(null)
              setRapportageOnlySessionId(null)
              setWrittenReportInitialCoacheeId(coacheeId)
              setPreviousRoute(currentRoute)
              navigateTo({ kind: 'geschrevenVerslag' })
            }}
            restoreDraftFromSubscriptionReturn={restoreNewSessionDraftFromSubscriptionReturn}
            onRestoreDraftHandled={() => setRestoreNewSessionDraftFromSubscriptionReturn(false)}
            onClose={() => {
              setIsRecordingBusy(false)
              setIsNewSessionModalOpen(false)
              setMobileSessionInitialOption(null)
              setNewlyCreatedCoacheeId(null)
              setNewSessionCoacheeId(null)
              setNewSessionTrajectoryId(null)
            }}
            onOpenMySubscription={() => {
              if (!canOpenSubscription) return
              setIsMySubscriptionModalOpen(true)
            }}
            onOpenNewCoachee={openNewCoacheeModal}
            newlyCreatedCoacheeId={newlyCreatedCoacheeId}
            onNewlyCreatedCoacheeHandled={() => setNewlyCreatedCoacheeId(null)}
            onOpenSession={(sessionId) => {
              const openedSession = data.sessions.find((item) => item.id === sessionId)
              const nextRoute =
                openedSession?.coacheeId && openedSession?.trajectoryId
                  ? ({ kind: 'item', coacheeId: openedSession.coacheeId, trajectoryId: openedSession.trajectoryId, itemId: sessionId } as const)
                  : ({ kind: 'sessie', sessieId: sessionId } as const)
              setIsNewSessionModalOpen(false)
              setMobileSessionInitialOption(null)
              setNewSessionCoacheeId(null)
              setNewSessionTrajectoryId(null)
              setRapportageOnlySessionId(null)
              setSessionOriginRoute(null)
              navigateTo(nextRoute)
            }}
          />

          <MyAccountModal
            visible={isMyAccountModalOpen}
            accountName={currentUserName}
            accountEmail={currentUserEmail}
            onClose={() => setIsMyAccountModalOpen(false)}
            onLogout={() => {
              setIsMyAccountModalOpen(false)
              onLogout()
            }}
            onDeleteAccount={() => {
              if (isDeletingAccount) return
              setIsDeleteAccountConfirmModalOpen(true)
            }}
            isDeleteAccountBusy={isDeletingAccount}
          />

          <DeleteAccountConfirmModal
            visible={isDeleteAccountConfirmModalOpen}
            isBusy={isDeletingAccount}
            onClose={() => {
              if (isDeletingAccount) return
              setIsDeleteAccountConfirmModalOpen(false)
            }}
            onConfirm={() => {
              void deleteAccount()
            }}
          />

          <MySubscriptionModal
            visible={isMySubscriptionModalOpen}
            onClose={() => {
              setIsMySubscriptionModalOpen(false)
              void refreshSubscriptionAccess()
            }}
          />
          <ShareCoachscribeModal
            visible={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
          <ContactModal
            visible={isContactModalOpen}
            onClose={() => setIsContactModalOpen(false)}
            onSubmitted={() => showToast('Bericht verzonden! Je hoort snel van ons.')}
          />
          <FeedbackModal
            visible={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onContinue={submitFeedback}
          />
          <CoacheeUpsertModal
            visible={isCoacheeModalOpen}
            mode="create"
            initialValues={getCoacheeUpsertValues(null)}
            trajectoryOptions={data.trajectories.map((trajectory) => ({ id: trajectory.id, label: String(trajectory.name || '').trim() || 'Traject' }))}
            onClose={() => setIsCoacheeModalOpen(false)}
            onSave={(values) => {
              const result = saveCoacheeFromUpsert({
                api: {
                  createCoachee,
                  createTrajectory,
                  updateCoachee: (_coacheeId, _values) => undefined,
                  updateTrajectory: (_trajectoryId, _values) => undefined,
                },
                data,
                mode: 'create',
                editCoacheeId: null,
                values,
              })
              if (result.createdCoacheeId) setNewlyCreatedCoacheeId(result.createdCoacheeId)
              setIsCoacheeModalOpen(false)
            }}
          />
      </>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    ...( { height: '100vh', overflow: 'visible' } as any ),
  },
  breadcrumbContainer: {
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'absolute',
    top: 80,
    ...( { left: 264, right: 24 } as any ),
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  breadcrumbContainerWithE2eeBar: {
    top: 112,
  },
  breadcrumbContainerCompact: {
    ...( { left: 96, right: 12 } as any ),
  },
  e2eeSetupBar: {
    position: 'absolute',
    top: 72,
    ...( { left: 240, right: 0 } as any ),
    zIndex: 2,
    height: 40,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  e2eeSetupBarCompact: {
    ...( { left: 72, right: 0 } as any ),
  },
  e2eeSetupBarContent: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  e2eeSetupTrigger: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  e2eeSetupTriggerHovered: {
    opacity: 0.88,
  },
  e2eeSetupTriggerText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  e2eeSetupCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  e2eeSetupCloseButtonHovered: {
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    ...( { overflow: 'visible' } as any ),
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    padding: 24,
    ...( { overflow: 'visible' } as any ),
  },
  mainContentNoFrame: {
    padding: 0,
  },
  mainContentWithBreadcrumbs: {
    paddingTop: 48,
  },
  mainContentWithE2eeBar: {
    paddingTop: 64,
  },
  mainContentWithE2eeBarAndBreadcrumbs: {
    paddingTop: 88,
  },
  mainContentText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyDashboardContent: {
    flex: 1,
  },
  mobileLimitedPage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileLimitedTop: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 56,
  },
  mobileLimitedCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mobileLimitedMonitorIcon: {
    marginBottom: 12,
  },
  mobileLimitedDesktopMessage: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.textStrong,
    textAlign: 'center',
  },
  mobileLimitedDesktopImage: {
    width: '92%',
    maxWidth: 420,
    height: 300,
    marginTop: 16,
  },
  mobileLimitedFooter: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  mobileLimitedPrimaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileLimitedPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  mobileLimitedPrimaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
    color: '#FFFFFF',
  },
})





