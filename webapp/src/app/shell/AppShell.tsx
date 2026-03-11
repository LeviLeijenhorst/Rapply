import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../../design/theme/colors'
import { MainContainer } from '../../ui/animated/MainContainer'
import { Navbar } from './components/Navbar'
import { Sidebar, SidebarItemKey } from './components/Sidebar'
import { Text } from '../../ui/Text'
import type { ClientLeftTabKey } from '../../screens/client/clientScreen.types'
import { NewInputModal } from '../../screens/record/NewInputModal'
import { FeedbackModal } from './modals/FeedbackModal'
import { SettingsMenu } from './menus/SettingsMenu'
import { MyAccountModal } from './modals/MyAccountModal'
import { MySubscriptionModal } from './modals/MySubscriptionModal'
import { ShareCoachscribeModal } from './modals/ShareCoachscribeModal'
import { ContactModal } from './modals/ContactModal'
import { DeleteAccountConfirmModal } from './modals/DeleteAccountConfirmModal'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import {
  fetchCurrentUserProfile,
  fetchSubscriptionAccess,
  requestDeleteAccount,
  resumePendingPreviewAudioTasks,
  submitFeedbackMessage,
} from './appShellBackend'
import { useBillingUsage } from './useBillingUsage'
import { useAudioUploadQueue } from '../../audio/upload/useAudioUploadQueue'
import { useE2ee } from '../../security/providers/E2eeProvider'
import { toUserFriendlyErrorMessage } from '../../utils/text/userFriendlyError'
import { useToast } from '../../toast/ToastProvider'
import { consumeSubscriptionReturnResumeRequest } from '../../screens/record/state/subscriptionReturnDraft'
import { CoachscribeLogo } from '../../components/brand/CoachscribeLogo'
import { MonitorIcon } from '../../icons/MonitorIcon'
import { AppShellRouteView } from './AppShellRouteView'
import {
  type RouteState,
  buildPathFromRoute,
  normalizeRouteForAvailability,
  parseRouteFromPath,
  resolveRouteEntityId,
  routeFromSidebarItemKey,
} from './routeHelpers'
import { getMainContentKey } from './navigationHelpers'
import { applyRouteToShell } from './applyRoute'
import { buildBreadcrumbItems } from './breadcrumbHelpers'

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
  const { data, createInput, isAppDataLoaded, updateInput } = useLocalAppData()
  const e2ee = useE2ee()
  const { usedMinutes, totalMinutes, isLoading: isUsageLoading } = useBillingUsage()
  useAudioUploadQueue(true)
  const hasResumedPendingAudioRef = useRef(false)

  const [selectedSidebarItemKey, setSelectedSidebarItemKey] = useState<SidebarItemKey>('clients')
  const [selectedSessieId, setSelectedSessieId] = useState<string | null>(null)
  const [sessionIdPendingTemplatePicker, setInputIdPendingTemplatePicker] = useState<string | null>(null)
  const [rapportageOnlyInputId, setRapportageOnlyInputId] = useState<string | null>(null)
  const [rapportageScreenMode, setRapportageScreenMode] = useState<'controleren' | 'bewerken'>('controleren')
  const [rapportageEditInputId, setRapportageEditInputId] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string | null>(null)
  const [sessionOriginRoute, setInputOriginRoute] = useState<RouteState | null>(null)
  const [clientTabById, setClientTabById] = useState<Record<string, ClientLeftTabKey>>({})
  const [isNewInputModalOpen, setIsNewInputModalOpen] = useState(false)
  const [mobileInputInitialOption, setMobileInputInitialOption] = useState<'gesprek' | 'gespreksverslag' | null>(null)
  const [newInputClientId, setNewInputClientId] = useState<string | null>(null)
  const [newInputTrajectoryId, setNewInputTrajectoryId] = useState<string | null>(null)
  const [isNieuweRapportageOpen, setIsNieuweRapportageOpen] = useState(false)
  const [isRecordPageOpen, setIsRecordPageOpen] = useState(false)
  const [isNewClientPageOpen, setIsNewClientPageOpen] = useState(false)
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
  const [isEndToEndEncryptiePageOpen, setIsEndToEndEncryptiePageOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isDeleteAccountConfirmModalOpen, setIsDeleteAccountConfirmModalOpen] = useState(false)
  const [restoreNewInputDraftFromSubscriptionReturn, setRestoreNewInputDraftFromSubscriptionReturn] = useState(false)
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
          inputs: data.inputs,
          e2ee,
          updateInput,
        })
        if (isCancelled) return
      } catch (error) {
        console.error('[AppShell] Failed to load pending audio tasks', error)
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [data.inputs, e2ee, isAppDataLoaded, updateInput])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const tryRestoreNewInputDraft = () => {
      const shouldRestore = consumeSubscriptionReturnResumeRequest()
      if (!shouldRestore) return
      setRestoreNewInputDraftFromSubscriptionReturn(true)
      setIsNewInputModalOpen(true)
    }

    tryRestoreNewInputDraft()
    window.addEventListener('pageshow', tryRestoreNewInputDraft)
    return () => window.removeEventListener('pageshow', tryRestoreNewInputDraft)
  }, [])

  const applyRoute = useCallback(
    (routeInput: RouteState) => {
      applyRouteToShell({
        isCurrentUserAdmin,
        routeInput,
        setIsNieuweRapportageOpen,
        setIsRecordPageOpen,
        setIsNewClientPageOpen,
        setRapportageScreenMode,
        setRapportageEditInputId,
        setIsEndToEndEncryptiePageOpen,
        setSelectedSidebarItemKey,
        setIsAdminScreenOpen,
        setIsAdminContactScreenOpen,
        setIsAdminWachtlijstScreenOpen,
        setOverlayScreenKey,
        setSelectedSessieId,
        setInputIdPendingTemplatePicker,
        setSelectedClientId,
        setSelectedTrajectoryId,
        setInputOriginRoute,
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

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
      return
    }
    if (sessionOriginRoute && selectedSessieId) {
      navigateTo(sessionOriginRoute)
      setInputOriginRoute(null)
      return
    }
    if (selectedSidebarItemKey === 'clients' && selectedClientId) {
      navigateTo({ kind: 'clients' })
      return
    }
    if (selectedSidebarItemKey === 'clients' && selectedTrajectoryId && selectedClientId) {
      navigateTo({ kind: 'client', clientId: selectedClientId })
      return
    }
    navigateTo({ kind: 'clients' })
  }, [navigateTo, selectedClientId, selectedSidebarItemKey, selectedTrajectoryId, sessionOriginRoute, selectedSessieId, setInputOriginRoute])

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
      const nextPath = buildPathFromRoute({ kind: 'clients' })
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
        isNieuweRapportageOpen,
        rapportageScreenMode,
        isRecordPageOpen,
        isNewClientPageOpen,
        overlayScreenKey,
        selectedClientId,
        selectedSessieId,
        selectedSidebarItemKey,
        selectedTrajectoryId,
      }),
    [isAdminContactScreenOpen, isAdminScreenOpen, isAdminWachtlijstScreenOpen, isNieuweRapportageOpen, rapportageScreenMode, isRecordPageOpen, isNewClientPageOpen, overlayScreenKey, selectedClientId, selectedSessieId, selectedSidebarItemKey, selectedTrajectoryId],
  )

  const [newlyCreatedClientId, setNewlyCreatedClientId] = useState<string | null>(null)
  const [newlyCreatedClientName, setNewlyCreatedClientName] = useState<string | null>(null)

  useEffect(() => {
    if (!isAppDataLoaded) return

    if (selectedSessieId) {
      const resolvedSessieId = resolveRouteEntityId(
        selectedSessieId,
        'session',
        data.inputs.map((item) => item.id),
      )
      if (resolvedSessieId && resolvedSessieId !== selectedSessieId) {
        setSelectedSessieId(resolvedSessieId)
        if (typeof window !== 'undefined') {
          const nextPath =
            selectedClientId && selectedTrajectoryId
              ? buildPathFromRoute({ kind: 'item', clientId: selectedClientId, trajectoryId: selectedTrajectoryId, itemId: resolvedSessieId })
              : buildPathFromRoute({ kind: 'sessie', sessieId: resolvedSessieId })
          if (window.location.pathname !== nextPath) {
            window.history.replaceState({ path: nextPath }, '', nextPath)
          }
        }
        return
      }
    }

    if (selectedClientId) {
      const resolvedClientId = resolveRouteEntityId(
        selectedClientId,
        'client',
        data.clients.map((item) => item.id),
      )
      if (resolvedClientId && resolvedClientId !== selectedClientId) {
        setSelectedClientId(resolvedClientId)
        if (typeof window !== 'undefined') {
          const nextPath = buildPathFromRoute({ kind: 'client', clientId: resolvedClientId })
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
      if (resolvedTrajectoryId && resolvedTrajectoryId !== selectedTrajectoryId && selectedClientId) {
        setSelectedTrajectoryId(resolvedTrajectoryId)
        if (typeof window !== 'undefined') {
          const nextPath = buildPathFromRoute({ kind: 'trajectory', clientId: selectedClientId, trajectoryId: resolvedTrajectoryId })
          if (window.location.pathname !== nextPath) {
            window.history.replaceState({ path: nextPath }, '', nextPath)
          }
        }
      }
    }
  }, [data.clients, data.inputs, data.trajectories, isAppDataLoaded, selectedClientId, selectedSessieId, selectedTrajectoryId])

  const openNewClientModal = useCallback(() => {
    navigateTo({ kind: 'new-client' })
  }, [navigateTo])

  const openNewInputModal = useCallback(
    (clientId: string | null, trajectoryId: string | null = null, initialOption: 'gesprek' | 'gespreksverslag' | null = null) => {
      if (isRecordingBusy) return
      setMobileInputInitialOption(initialOption)
      setNewInputClientId(clientId)
      setNewInputTrajectoryId(trajectoryId)
      setIsNewInputModalOpen(true)
    },
    [isRecordingBusy],
  )

  const openMobileLimitedInput = useCallback((option: 'gesprek' | 'gespreksverslag') => {
    if (isRecordingBusy) return
    setMobileInputInitialOption(option)
    setNewInputClientId(null)
    setNewInputTrajectoryId(null)
    setIsNewInputModalOpen(true)
  }, [isRecordingBusy])

  useEffect(() => {
    if (newlyCreatedClientId) {
      const client = data.clients.find((c) => c.id === newlyCreatedClientId && !c.isArchived)
      if (client) {
        setNewlyCreatedClientName(client.name)
      }
    }
  }, [data.clients, newlyCreatedClientId])

  const breadcrumbItems = useMemo(
    () =>
      buildBreadcrumbItems({
        clients: data.clients,
        inputs: data.inputs,
        trajectories: data.trajectories,
        isNieuweRapportageOpen,
        isRecordPageOpen,
        isNewClientPageOpen,
        rapportageScreenMode,
        selectedClientId,
        selectedSessieId,
        selectedSidebarItemKey,
        selectedTrajectoryId,
        navigateTo,
      }),
    [data.clients, data.inputs, data.trajectories, isNieuweRapportageOpen, isRecordPageOpen, isNewClientPageOpen, navigateTo, rapportageScreenMode, selectedClientId, selectedSessieId, selectedSidebarItemKey, selectedTrajectoryId],
  )

  const hasBreadcrumbs = breadcrumbItems.length >= 2 && !isEndToEndEncryptiePageOpen
  const isClientOverviewPage = selectedSidebarItemKey === 'clients' && !!selectedClientId && !selectedTrajectoryId && !selectedSessieId
  const isClientDetailPage = selectedSidebarItemKey === 'clients' && !!selectedClientId
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
            source={require('../../../assets/mobile-limited/desktop-illustration.png')}
            resizeMode="contain"
            style={styles.mobileLimitedDesktopImage}
          />
        </View>
        <View style={styles.mobileLimitedFooter}>
          <Pressable
            onPress={() => openMobileLimitedInput('gesprek')}
            style={({ hovered }) => [styles.mobileLimitedPrimaryButton, hovered ? styles.mobileLimitedPrimaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.mobileLimitedPrimaryButtonText}>Gesprek opnemen</Text>
          </Pressable>
          <Pressable
            onPress={() => openMobileLimitedInput('gespreksverslag')}
            style={({ hovered }) => [styles.mobileLimitedPrimaryButton, hovered ? styles.mobileLimitedPrimaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.mobileLimitedPrimaryButtonText}>Verslag opnemen</Text>
          </Pressable>
        </View>

        <NewInputModal
          visible={isNewInputModalOpen}
          limitedMode
          initialOption={mobileInputInitialOption}
          onRecordingBusyChange={setIsRecordingBusy}
          initialClientId={null}
          initialTrajectoryId={null}
          onOpenGeschrevenGespreksverslag={() => undefined}
          restoreDraftFromSubscriptionReturn={restoreNewInputDraftFromSubscriptionReturn}
          onRestoreDraftHandled={() => setRestoreNewInputDraftFromSubscriptionReturn(false)}
          onClose={() => {
            setIsRecordingBusy(false)
            setIsNewInputModalOpen(false)
            setMobileInputInitialOption(null)
            setNewlyCreatedClientId(null)
            setNewInputClientId(null)
            setNewInputTrajectoryId(null)
          }}
          onOpenMySubscription={() => {
            if (!canOpenSubscription) return
            setIsMySubscriptionModalOpen(true)
          }}
          onOpenNewClient={() => {
              setIsNewInputModalOpen(false)
              setMobileInputInitialOption(null)
              setNewInputClientId(null)
              setNewInputTrajectoryId(null)
              openNewClientModal()
            }}
          newlyCreatedClientId={newlyCreatedClientId}
          onNewlyCreatedClientHandled={() => setNewlyCreatedClientId(null)}
          onOpenInput={(sessionId: string) => {
            const openedInput = data.inputs.find((item) => item.id === sessionId)
            const nextRoute =
              openedInput?.clientId && openedInput?.trajectoryId
                ? ({ kind: 'item', clientId: openedInput.clientId, trajectoryId: openedInput.trajectoryId, itemId: sessionId } as const)
                : ({ kind: 'sessie', sessieId: sessionId } as const)
            setIsNewInputModalOpen(false)
            setMobileInputInitialOption(null)
            setNewInputTrajectoryId(null)
            setInputOriginRoute(null)
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
        onPressRecord={() => openNewInputModal(null, null, null)}
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
              usedMinutes={usedMinutes}
              totalMinutes={totalMinutes}
              userName={currentUserName}
              userRole="Re-integratiecoach"
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
                isClientDetailPage || isNieuweRapportageOpen || isRecordPageOpen || isNewClientPageOpen || !!selectedSessieId || selectedSidebarItemKey === 'mijnPraktijk'
                  ? styles.mainContentNoFrame
                  : undefined,
                hasBreadcrumbs && !isClientOverviewPage && !isNieuweRapportageOpen && !isRecordPageOpen && !isNewClientPageOpen && !selectedSessieId ? styles.mainContentWithBreadcrumbs : undefined,
                isE2eeSetupBannerVisible
                  ? (hasBreadcrumbs && !isClientOverviewPage && !isNieuweRapportageOpen && !isRecordPageOpen && !isNewClientPageOpen && !selectedSessieId ? styles.mainContentWithE2eeBarAndBreadcrumbs : styles.mainContentWithE2eeBar)
                  : undefined,
              ]}
            >
              <MainContainer contentKey={mainContentKey}>
                <AppShellRouteView
                  canOpenSubscription={canOpenSubscription}
                  clientTabById={clientTabById}
                  data={data}
                  goBack={goBack}
                  isAdminContactScreenOpen={isAdminContactScreenOpen}
                  isAdminScreenOpen={isAdminScreenOpen}
                  isAdminWachtlijstScreenOpen={isAdminWachtlijstScreenOpen}
                  isAppDataLoaded={isAppDataLoaded}
                  isEndToEndEncryptiePageOpen={isEndToEndEncryptiePageOpen}
                  isNieuweRapportageOpen={isNieuweRapportageOpen}
                  isRecordPageOpen={isRecordPageOpen}
                  isNewClientPageOpen={isNewClientPageOpen}
                  isRecordingBusy={isRecordingBusy}
                  mainContentTextStyle={styles.mainContentText}
                  navigateTo={navigateTo}
                  newlyCreatedClientName={newlyCreatedClientName}
                  onClearNewlyCreatedClient={() => {
                    setNewlyCreatedClientId(null)
                    setNewlyCreatedClientName(null)
                  }}
                  onOpenNewClient={() => {
              setIsNewInputModalOpen(false)
              setMobileInputInitialOption(null)
              setNewInputClientId(null)
              setNewInputTrajectoryId(null)
              openNewClientModal()
            }}
                  onOpenNewInputModal={openNewInputModal}
                  onSetClientTabById={(clientId, tabKey) => {
                    setClientTabById((previous) => {
                      if (previous[clientId] === tabKey) return previous
                      return { ...previous, [clientId]: tabKey }
                    })
                  }}
                  onSetRapportageEditInputId={setRapportageEditInputId}
                  onSetRapportageOnlyInputId={setRapportageOnlyInputId}
                  onSetRapportageScreenMode={setRapportageScreenMode}
                  onSetSelectedSidebarItemKey={setSelectedSidebarItemKey}
                  onSetInputIdPendingTemplatePicker={setInputIdPendingTemplatePicker}
                  onSetInputOriginRoute={setInputOriginRoute}
                  onToggleE2eePage={setIsEndToEndEncryptiePageOpen}
                  overlayScreenKey={overlayScreenKey}
                  rapportageEditInputId={rapportageEditInputId}
                  rapportageOnlyInputId={rapportageOnlyInputId}
                  rapportageScreenMode={rapportageScreenMode}
                  selectedClientId={selectedClientId}
                  selectedSidebarItemKey={selectedSidebarItemKey}
                  selectedSessieId={selectedSessieId}
                  selectedTrajectoryId={selectedTrajectoryId}
                  sessionIdPendingTemplatePicker={sessionIdPendingTemplatePicker}
                />
              </MainContainer>
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

          <NewInputModal
            visible={isNewInputModalOpen}
            onRecordingBusyChange={setIsRecordingBusy}
            initialClientId={newInputClientId}
            initialTrajectoryId={newInputTrajectoryId}
            onOpenGeschrevenGespreksverslag={(clientId: string | null) => {
              setIsNewInputModalOpen(false)
              setMobileInputInitialOption(null)
              setNewInputClientId(null)
              setNewInputTrajectoryId(null)
              setRapportageOnlyInputId(null)
              setSelectedClientId(clientId)
              setRapportageScreenMode('controleren')
              setRapportageEditInputId(null)
              navigateTo({ kind: 'nieuwe-rapportage' })
            }}
            restoreDraftFromSubscriptionReturn={restoreNewInputDraftFromSubscriptionReturn}
            onRestoreDraftHandled={() => setRestoreNewInputDraftFromSubscriptionReturn(false)}
            onClose={() => {
              setIsRecordingBusy(false)
              setIsNewInputModalOpen(false)
              setMobileInputInitialOption(null)
              setNewlyCreatedClientId(null)
              setNewInputClientId(null)
              setNewInputTrajectoryId(null)
            }}
            onOpenMySubscription={() => {
              if (!canOpenSubscription) return
              setIsMySubscriptionModalOpen(true)
            }}
            onOpenNewClient={() => {
              setIsNewInputModalOpen(false)
              setMobileInputInitialOption(null)
              setNewInputClientId(null)
              setNewInputTrajectoryId(null)
              openNewClientModal()
            }}
            newlyCreatedClientId={newlyCreatedClientId}
            onNewlyCreatedClientHandled={() => setNewlyCreatedClientId(null)}
            onOpenInput={(sessionId: string) => {
              const openedInput = data.inputs.find((item) => item.id === sessionId)
              const nextRoute =
                openedInput?.clientId && openedInput?.trajectoryId
                  ? ({ kind: 'item', clientId: openedInput.clientId, trajectoryId: openedInput.trajectoryId, itemId: sessionId } as const)
                  : ({ kind: 'sessie', sessieId: sessionId } as const)
              setIsNewInputModalOpen(false)
              setMobileInputInitialOption(null)
              setNewInputClientId(null)
              setNewInputTrajectoryId(null)
              setRapportageOnlyInputId(null)
              setInputOriginRoute(null)
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



















