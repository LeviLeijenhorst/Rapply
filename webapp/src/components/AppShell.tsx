import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../theme/colors'
import { AnimatedMainContent } from './AnimatedMainContent'
import { Navbar } from './Navbar'
import { Sidebar, SidebarItemKey } from './Sidebar'
import { Text } from './Text'
import { BreadcrumbBar } from './BreadcrumbBar'
import { getCoacheeDisplayName } from '../utils/coachee'
import { CoacheeDetailScreen } from '../screens/CoacheeDetailScreen'
import { CoacheesScreen } from '../screens/CoacheesScreen'
import { SessieDetailScreen } from '../screens/SessieDetailScreen'
import { SessiesScreen } from '../screens/SessiesScreen'
import { NewSessionModal } from './newSession/NewSessionModal'
import { GeschrevenVerslagScreen } from '../screens/GeschrevenVerslagScreen'
import { TemplatesScreen } from '../screens/TemplatesScreen'
import { MijnPraktijkScreen } from '../screens/MijnPraktijkScreen'
import { FeedbackModal } from './help/FeedbackModal'
import { SettingsMenu } from './settings/SettingsMenu'
import { MyAccountModal } from './settings/MyAccountModal'
import { MySubscriptionModal } from './settings/MySubscriptionModal'
import { DeleteAccountConfirmModal } from './settings/DeleteAccountConfirmModal'
import { DeleteAccountErrorModal } from './settings/DeleteAccountErrorModal'
import { ArchiefScreen } from '../screens/ArchiefScreen'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { CoacheeUpsertModal } from './coachees/CoacheeUpsertModal'
import { EmptyPageMessage } from './EmptyPageMessage'
import { AppLoadingScreen } from './AppLoadingScreen'
import { useBillingUsage } from '../hooks/useBillingUsage'
import { useAudioUploadQueue } from '../audio/useAudioUploadQueue'
import { callSecureApi } from '../services/secureApi'
import { useE2ee } from '../e2ee/E2eeProvider'
import { clearPendingPreviewAudio, clearPendingPreviewAudioIfEligible, listPendingPreviewAudioTasks } from '../audio/pendingPreviewStore'
import { processSessionAudio } from '../audio/processSessionAudio'
import { AdminFeedbackScreen } from '../screens/AdminFeedbackScreen'
import { ChevronRightIcon } from './icons/ChevronRightIcon'
import { CircleCloseIcon } from './icons/CircleCloseIcon'

type AnchorPoint = { x: number; y: number }
type OverlayScreenKey = 'archief'
type RouteState =
  | { kind: 'sessies' }
  | { kind: 'sessie'; sessieId: string }
  | { kind: 'coachees' }
  | { kind: 'coachee'; coacheeId: string }
  | { kind: 'templates' }
  | { kind: 'mijn-praktijk' }
  | { kind: 'geschrevenVerslag' }
  | { kind: 'archief' }
  | { kind: 'admin' }

function stripPrefix(value: string, prefix: string) {
  return value.startsWith(`${prefix}-`) ? value.slice(prefix.length + 1) : value
}

function ensurePrefix(value: string, prefix: string) {
  return value.startsWith(`${prefix}-`) ? value : `${prefix}-${value}`
}

function parseRouteFromPath(pathname: string): RouteState {
  const cleanedPath = pathname.startsWith('/inloggen') ? pathname.slice('/inloggen'.length) : pathname
  const path = cleanedPath.startsWith('/') ? cleanedPath.slice(1) : cleanedPath
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'coachees') {
    if (parts[1]) return { kind: 'coachee', coacheeId: ensurePrefix(parts[1], 'coachee') }
    return { kind: 'coachees' }
  }
  if (parts[0] === 'sessies') {
    if (parts[1]) return { kind: 'sessie', sessieId: ensurePrefix(parts[1], 'session') }
    return { kind: 'sessies' }
  }
  if (parts[0] === 'templates') return { kind: 'templates' }
  if (parts[0] === 'mijn-praktijk') return { kind: 'mijn-praktijk' }
  if (parts[0] === 'geschreven-verslag') return { kind: 'geschrevenVerslag' }
  if (parts[0] === 'archief') return { kind: 'archief' }
  if (parts[0] === 'admin') return { kind: 'admin' }
  return { kind: 'coachees' }
}

function buildPathFromRoute(route: RouteState): string {
  if (route.kind === 'sessies') return '/sessies'
  if (route.kind === 'sessie') return `/sessies/${stripPrefix(route.sessieId, 'session')}`
  if (route.kind === 'coachees') return '/coachees'
  if (route.kind === 'coachee') return `/coachees/${stripPrefix(route.coacheeId, 'coachee')}`
  if (route.kind === 'templates') return '/templates'
  if (route.kind === 'mijn-praktijk') return '/mijn-praktijk'
  if (route.kind === 'geschrevenVerslag') return '/geschreven-verslag'
  if (route.kind === 'admin') return '/admin'
  return '/archief'
}

type Props = {
  onLogout: () => void
}

const PRIVACY_BELEID_URL = 'https://www.coachscribe.nl/privacybeleid'

function parseDeleteAccountErrorMessage(error: unknown): string {
  const fallback = 'Verwijderen mislukt. Probeer het alsjeblieft later opnieuw.'
  if (!(error instanceof Error)) return fallback

  const rawMessage = String(error.message || '').trim()
  if (!rawMessage) return fallback

  const jsonStartIndex = rawMessage.indexOf('{')
  if (jsonStartIndex >= 0) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStartIndex))
      if (typeof parsed?.error === 'string' && parsed.error.trim()) {
        return parsed.error.trim()
      }
    } catch {
      // ignore parse errors and continue with fallback parsing
    }
  }

  const apiErrorMatch = rawMessage.match(/^API error:\s*\d+\s*(.+)$/)
  if (apiErrorMatch?.[1]?.trim()) return apiErrorMatch[1].trim()

  return fallback
}

export function AppShell({ onLogout }: Props) {
  const { width } = useWindowDimensions()
  const isTooSmall = width < 320
  const isSidebarCompact = width < 700
  const { data, createCoachee, isAppDataLoaded, updateSession } = useLocalAppData()
  const e2ee = useE2ee()
  const { usedMinutes, totalMinutes, isLoading: isUsageLoading } = useBillingUsage()
  useAudioUploadQueue(true)
  const hasResumedPendingAudioRef = useRef(false)

  const [selectedSidebarItemKey, setSelectedSidebarItemKey] = useState<SidebarItemKey>('coachees')
  const [selectedSessieId, setSelectedSessieId] = useState<string | null>(null)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [sessionOriginRoute, setSessionOriginRoute] = useState<RouteState | null>(null)
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [newSessionCoacheeId, setNewSessionCoacheeId] = useState<string | null>(null)
  const [isGeschrevenVerslagOpen, setIsGeschrevenVerslagOpen] = useState(false)
  const [overlayScreenKey, setOverlayScreenKey] = useState<OverlayScreenKey | null>(null)
  const [isAdminScreenOpen, setIsAdminScreenOpen] = useState(false)

  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [settingsMenuAnchorPoint, setSettingsMenuAnchorPoint] = useState<AnchorPoint | null>(null)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

  const [isMyAccountModalOpen, setIsMyAccountModalOpen] = useState(false)
  const [isMySubscriptionModalOpen, setIsMySubscriptionModalOpen] = useState(false)
  const [isCoacheeModalOpen, setIsCoacheeModalOpen] = useState(false)
  const [previousRoute, setPreviousRoute] = useState<RouteState | null>(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isDeleteAccountConfirmModalOpen, setIsDeleteAccountConfirmModalOpen] = useState(false)
  const [deleteAccountErrorMessage, setDeleteAccountErrorMessage] = useState<string | null>(null)
  const [isE2eeSetupBannerDismissed, setIsE2eeSetupBannerDismissed] = useState(false)

  useEffect(() => {
    if (!isAppDataLoaded) return
    if (hasResumedPendingAudioRef.current) return
    hasResumedPendingAudioRef.current = true

    let isCancelled = false
    void (async () => {
      try {
        const tasks = await listPendingPreviewAudioTasks()
        for (const task of tasks) {
          if (isCancelled) return
          const session = data.sessions.find((item) => item.id === task.sessionId)
          if (!session) {
            await clearPendingPreviewAudio(task.sessionId)
            continue
          }
          if (session.transcriptionStatus === 'done' && (!task.shouldSaveAudio || Boolean(session.audioBlobId))) {
            await clearPendingPreviewAudioIfEligible(task.sessionId)
            continue
          }

          try {
            await processSessionAudio({
              sessionId: task.sessionId,
              audioBlob: task.blob,
              mimeType: task.mimeType,
              shouldSaveAudio: task.shouldSaveAudio,
              summaryTemplate: task.summaryTemplate,
              initialAudioBlobId: session.audioBlobId ?? null,
              e2ee,
              updateSession,
            })
          } catch (error) {
            console.error('[AppShell] Pending audio resume failed', { sessionId: task.sessionId, error })
          }
        }
      } catch (error) {
        console.error('[AppShell] Failed to load pending audio tasks', error)
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [data.sessions, e2ee, isAppDataLoaded, updateSession])

  const applyRoute = useCallback(
    (route: RouteState) => {
      if (route.kind === 'archief') {
        setIsAdminScreenOpen(false)
        setOverlayScreenKey('archief')
        setIsGeschrevenVerslagOpen(false)
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }
      if (route.kind === 'geschrevenVerslag') {
        setIsAdminScreenOpen(false)
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(true)
        setSelectedSidebarItemKey('sessies')
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }

      if (route.kind === 'admin') {
        setIsAdminScreenOpen(true)
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(false)
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }

      setIsAdminScreenOpen(false)
      setOverlayScreenKey(null)
      setIsGeschrevenVerslagOpen(false)

      if (route.kind === 'coachees') {
        setSelectedSidebarItemKey('coachees')
        setSelectedCoacheeId(null)
        setSelectedSessieId(null)
        setSessionOriginRoute(null)
        return
      }
      if (route.kind === 'coachee') {
        setSelectedSidebarItemKey('coachees')
        setSelectedCoacheeId(route.coacheeId)
        setSelectedSessieId(null)
        setSessionOriginRoute(null)
        return
      }
      if (route.kind === 'templates') {
        setSelectedSidebarItemKey('templates')
        setSelectedCoacheeId(null)
        setSelectedSessieId(null)
        setSessionOriginRoute(null)
        return
      }
      if (route.kind === 'mijn-praktijk') {
        setSelectedSidebarItemKey('mijnPraktijk')
        setSelectedCoacheeId(null)
        setSelectedSessieId(null)
        setSessionOriginRoute(null)
        return
      }
      if (route.kind === 'sessie') {
        setSelectedSidebarItemKey('sessies')
        setSelectedSessieId(route.sessieId)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }
      setSelectedSidebarItemKey('sessies')
      setSelectedSessieId(null)
      setSelectedCoacheeId(null)
      setSessionOriginRoute(null)
    },
    [
      setIsAdminScreenOpen,
      setOverlayScreenKey,
      setIsGeschrevenVerslagOpen,
      setSelectedCoacheeId,
      setSelectedSessieId,
      setSelectedSidebarItemKey,
      setSessionOriginRoute,
    ],
  )

  const navigateTo = useCallback(
    (route: RouteState) => {
      if (typeof window === 'undefined') {
        applyRoute(route)
        return
      }
      const nextPath = buildPathFromRoute(route)
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ path: nextPath }, '', nextPath)
      }
      applyRoute(route)
    },
    [applyRoute],
  )

  const navigateToReplacingHistory = useCallback(
    (route: RouteState) => {
      if (typeof window === 'undefined') {
        applyRoute(route)
        return
      }
      const nextPath = buildPathFromRoute(route)
      window.history.replaceState({ path: nextPath }, '', nextPath)
      applyRoute(route)
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
    if (selectedSidebarItemKey === 'sessies' && selectedSessieId) {
      navigateTo({ kind: 'sessies' })
      return
    }
    navigateTo({ kind: 'sessies' })
  }, [navigateTo, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey, sessionOriginRoute, setSessionOriginRoute])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = () => {
      const route = parseRouteFromPath(window.location.pathname)
      applyRoute(route)
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

  const mainContentKey = overlayScreenKey
    ? overlayScreenKey
    : isAdminScreenOpen
      ? 'admin'
    : isGeschrevenVerslagOpen
      ? 'geschreven-verslag'
      : selectedSessieId
        ? `sessie-${selectedSessieId}`
        : selectedSidebarItemKey === 'sessies'
          ? 'sessies'
          : selectedSidebarItemKey === 'coachees'
            ? selectedCoacheeId
              ? `coachee-${selectedCoacheeId}`
              : 'coachees'
            : selectedSidebarItemKey

  const [newlyCreatedCoacheeId, setNewlyCreatedCoacheeId] = useState<string | null>(null)
  const [newlyCreatedCoacheeName, setNewlyCreatedCoacheeName] = useState<string | null>(null)

  const openNewCoacheeModal = useCallback(() => {
    setIsCoacheeModalOpen(true)
  }, [])

  const openNewSessionModal = useCallback((coacheeId: string | null) => {
    setNewSessionCoacheeId(coacheeId)
    setIsNewSessionModalOpen(true)
  }, [])

  const openSessionFromCoachee = useCallback(
    (sessionId: string, coacheeId: string) => {
      const nextRoute: RouteState = { kind: 'sessie', sessieId: sessionId }
      if (typeof window !== 'undefined') {
        const nextPath = buildPathFromRoute(nextRoute)
        if (window.location.pathname !== nextPath) {
          window.history.pushState({ path: nextPath }, '', nextPath)
        }
      }
      setOverlayScreenKey(null)
      setIsGeschrevenVerslagOpen(false)
      setSessionOriginRoute({ kind: 'coachee', coacheeId })
      setSelectedSessieId(sessionId)
      setSelectedSidebarItemKey('coachees')
      setSelectedCoacheeId(coacheeId)
    },
    [setIsGeschrevenVerslagOpen, setOverlayScreenKey, setSelectedCoacheeId, setSelectedSessieId, setSelectedSidebarItemKey, setSessionOriginRoute],
  )

  useEffect(() => {
    if (newlyCreatedCoacheeId) {
      const coachee = data.coachees.find((c) => c.id === newlyCreatedCoacheeId && !c.isArchived)
      if (coachee) {
        setNewlyCreatedCoacheeName(coachee.name)
      }
    }
  }, [data.coachees, newlyCreatedCoacheeId])

  const currentRoute = useMemo<RouteState>(() => {
    if (overlayScreenKey === 'archief') return { kind: 'archief' }
    if (isAdminScreenOpen) return { kind: 'admin' }
    if (isGeschrevenVerslagOpen) return { kind: 'geschrevenVerslag' }
    if (selectedSessieId) return { kind: 'sessie', sessieId: selectedSessieId }
    if (selectedSidebarItemKey === 'coachees') {
      return selectedCoacheeId ? { kind: 'coachee', coacheeId: selectedCoacheeId } : { kind: 'coachees' }
    }
    if (selectedSidebarItemKey === 'templates') return { kind: 'templates' }
    if (selectedSidebarItemKey === 'mijnPraktijk') return { kind: 'mijn-praktijk' }
    return { kind: 'sessies' }
  }, [isAdminScreenOpen, isGeschrevenVerslagOpen, overlayScreenKey, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey])

  const breadcrumbItems = useMemo(() => {
    if (selectedSessieId) {
      const session = data.sessions.find((item) => item.id === selectedSessieId)
      if (!session) return []
      const sessionTitle = session.title ?? 'Sessie'
      const coacheeName = getCoacheeDisplayName(data.coachees, session.coacheeId)
      if (sessionOriginRoute?.kind === 'coachee' && session.coacheeId) {
        return [
          { label: 'Coachees', onPress: () => navigateTo({ kind: 'coachees' }) },
          { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: sessionOriginRoute.coacheeId }) },
          { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
        ]
      }
      return [
        { label: 'Sessies', onPress: () => navigateTo({ kind: 'sessies' }) },
        { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
      ]
    }
    if (selectedSidebarItemKey === 'coachees' && selectedCoacheeId) {
      const coacheeName = data.coachees.find((item) => item.id === selectedCoacheeId)?.name ?? 'Coachee'
      return [
        { label: 'Coachees', onPress: () => navigateTo({ kind: 'coachees' }) },
        { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: selectedCoacheeId }) },
      ]
    }
    return []
  }, [data.coachees, data.sessions, navigateTo, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey, sessionOriginRoute])

  const hasBreadcrumbs = breadcrumbItems.length >= 2
  const isE2eeSetupBannerVisible = !e2ee.isEnabled && !isE2eeSetupBannerDismissed

  const deleteAccount = useCallback(async () => {
    if (isDeletingAccount) return

    try {
      setIsDeletingAccount(true)
      await callSecureApi<{ ok: boolean }>('/account/delete', { confirmText: 'VERWIJDEREN' })
      setIsDeleteAccountConfirmModalOpen(false)
      setIsMyAccountModalOpen(false)
      onLogout()
    } catch (error) {
      console.error('[AppShell] Account verwijderen mislukt', error)
      setIsDeleteAccountConfirmModalOpen(false)
      setDeleteAccountErrorMessage(parseDeleteAccountErrorMessage(error))
    } finally {
      setIsDeletingAccount(false)
    }
  }, [isDeletingAccount, onLogout])

  const shareCoachscribe = useCallback(async () => {
    const shareUrl = 'https://www.coachscribe.nl'
    const shareText = 'Bekijk CoachScribe op www.coachscribe.nl'
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'CoachScribe',
          text: shareText,
          url: shareUrl,
        })
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      }

      if (typeof window !== 'undefined') {
        window.alert('Delen is niet beschikbaar op dit apparaat. Link gekopieerd: www.coachscribe.nl')
      }
    } catch (error) {
      console.error('[AppShell] Delen mislukt', error)
    }
  }, [])

  const submitFeedback = useCallback(async (feedback: string) => {
    await callSecureApi<{ ok: true }>('/feedback', { message: feedback })
  }, [])

  function renderMainContent() {
    if (!isAppDataLoaded) {
      return <AppLoadingScreen />
    }
    if (isAdminScreenOpen) {
      return <AdminFeedbackScreen />
    }
    if (overlayScreenKey === 'archief') {
      return <ArchiefScreen />
    }

    if (isGeschrevenVerslagOpen) {
      return (
        <GeschrevenVerslagScreen
          onBack={() => {
            if (previousRoute) {
              navigateTo(previousRoute)
              setPreviousRoute(null)
              return
            }
            goBack()
          }}
          onOpenNewCoachee={openNewCoacheeModal}
          onOpenSession={(sessionId) => {
            setPreviousRoute(null)
            navigateToReplacingHistory({ kind: 'sessie', sessieId: sessionId })
          }}
        />
      )
    }

    if (selectedSessieId) {
      const selectedSessie = data.sessions.find((item) => item.id === selectedSessieId)
      if (!selectedSessie) {
        return (
          <EmptyPageMessage
            message="Deze sessie bestaat niet meer."
            onGoHome={() => navigateTo({ kind: 'sessies' })}
          />
        )
      }
      const sessieTitle = selectedSessie.title ?? 'Sessie'
      const coacheeName = getCoacheeDisplayName(data.coachees, selectedSessie.coacheeId)
      const dateLabel = new Date(selectedSessie.createdAtUnixMs).toLocaleDateString('nl-NL')
      return (
        <SessieDetailScreen
          sessionId={selectedSessieId}
          title={sessieTitle}
          coacheeName={coacheeName}
          dateLabel={dateLabel}
          onBack={goBack}
          onOpenNewCoachee={openNewCoacheeModal}
            onChangeCoachee={(nextCoacheeId) => {
              if (!nextCoacheeId) {
                setSelectedSidebarItemKey('sessies')
                setSessionOriginRoute(null)
              }
            }}
          newlyCreatedCoacheeName={newlyCreatedCoacheeName}
          onNewlyCreatedCoacheeHandled={() => {
            setNewlyCreatedCoacheeId(null)
            setNewlyCreatedCoacheeName(null)
          }}
        />
      )
    }

    if (selectedSidebarItemKey === 'coachees') {
      if (selectedCoacheeId) {
        const selectedCoachee = data.coachees.find((c) => c.id === selectedCoacheeId)
        if (!selectedCoachee) {
          return (
            <EmptyPageMessage
              message="Deze coachee bestaat niet meer."
              onGoHome={() => navigateTo({ kind: 'coachees' })}
            />
          )
        }
        return (
          <CoacheeDetailScreen
            coacheeId={selectedCoacheeId}
            onBack={goBack}
            onSelectSession={(sessionId) => {
              openSessionFromCoachee(sessionId, selectedCoacheeId)
            }}
            onPressCreateSession={() => openNewSessionModal(selectedCoacheeId)}
          />
        )
      }

      return (
        <CoacheesScreen
          onSelectCoachee={(coacheeId) => {
            navigateTo({ kind: 'coachee', coacheeId })
          }}
        />
      )
    }

    if (selectedSidebarItemKey === 'sessies') {
      return (
        <SessiesScreen
          onSelectSessie={(sessieId) => {
            navigateTo({ kind: 'sessie', sessieId })
          }}
          onPressCreateSession={() => openNewSessionModal(null)}
        />
      )
    }

    if (selectedSidebarItemKey === 'templates') {
      return <TemplatesScreen />
    }
    if (selectedSidebarItemKey === 'mijnPraktijk') {
      return <MijnPraktijkScreen />
    }
    return <Text style={styles.mainContentText}>{selectedSidebarItemKey}</Text>
  }

  return (
    <View style={styles.page}>
      {/* Top navigation bar */}
      <Navbar
        onLogout={onLogout}
        usedMinutes={usedMinutes}
        totalMinutes={totalMinutes}
        isUsageLoading={isUsageLoading}
      />
      {isE2eeSetupBannerVisible ? (
        <View style={[styles.e2eeSetupBar, isSidebarCompact ? styles.e2eeSetupBarCompact : undefined]}>
          <View style={styles.e2eeSetupBarContent}>
            <Pressable onPress={e2ee.beginSetup} style={({ hovered }) => [styles.e2eeSetupTrigger, hovered ? styles.e2eeSetupTriggerHovered : undefined]}>
              <Text isSemibold style={styles.e2eeSetupTriggerText}>
                End-to-end encryptie instellen
              </Text>
              <ChevronRightIcon color="#FFFFFF" size={16} />
            </Pressable>
            <Pressable onPress={() => setIsE2eeSetupBannerDismissed(true)} style={({ hovered }) => [styles.e2eeSetupCloseButton, hovered ? styles.e2eeSetupCloseButtonHovered : undefined]}>
              <CircleCloseIcon size={24} />
            </Pressable>
          </View>
        </View>
      ) : null}
      {hasBreadcrumbs ? (
        <View
          style={[
            styles.breadcrumbContainer,
            isSidebarCompact ? styles.breadcrumbContainerCompact : undefined,
            isE2eeSetupBannerVisible ? styles.breadcrumbContainerWithE2eeBar : undefined,
          ]}
        >
          {/* Breadcrumb bar */}
          <BreadcrumbBar items={breadcrumbItems} />
        </View>
      ) : null}
      {isTooSmall ? (
        <View style={styles.tooSmallContainer}>
          <Text style={styles.tooSmallText}>Deze webapp is niet ontworpen voor apparaten smaller dan 320px.</Text>
        </View>
      ) : (
        <>
          {/* Page content */}
          <View style={styles.contentRow}>
            {/* Sidebar */}
            <Sidebar
              selectedSidebarItemKey={selectedSidebarItemKey}
              onSelectSidebarItem={(sidebarItemKey) => {
                navigateTo(
                  sidebarItemKey === 'coachees'
                    ? { kind: 'coachees' }
                    : sidebarItemKey === 'templates'
                      ? { kind: 'templates' }
                      : sidebarItemKey === 'mijnPraktijk'
                        ? { kind: 'mijn-praktijk' }
                      : { kind: 'sessies' },
                )
                setIsSettingsMenuOpen(false)
              }}
              onPressCreateSession={() => openNewSessionModal(null)}
              onOpenFeedback={() => {
                setIsFeedbackModalOpen(true)
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
                hasBreadcrumbs ? styles.mainContentWithBreadcrumbs : undefined,
                isE2eeSetupBannerVisible ? (hasBreadcrumbs ? styles.mainContentWithE2eeBarAndBreadcrumbs : styles.mainContentWithE2eeBar) : undefined,
              ]}
            >
              <AnimatedMainContent contentKey={mainContentKey}>{renderMainContent()}</AnimatedMainContent>
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
            onOpenArchive={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              navigateTo({ kind: 'archief' })
            }}
            onOpenContact={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
            }}
            onOpenShare={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              void shareCoachscribe()
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
          />

          <NewSessionModal
            visible={isNewSessionModalOpen}
            initialCoacheeId={newSessionCoacheeId}
            onClose={() => {
              setIsNewSessionModalOpen(false)
              setNewlyCreatedCoacheeId(null)
              setNewSessionCoacheeId(null)
            }}
            onOpenNewCoachee={openNewCoacheeModal}
            newlyCreatedCoacheeId={newlyCreatedCoacheeId}
            onNewlyCreatedCoacheeHandled={() => setNewlyCreatedCoacheeId(null)}
            onStartWrittenReport={() => {
              setIsNewSessionModalOpen(false)
              setNewSessionCoacheeId(null)
              setPreviousRoute(currentRoute)
              navigateTo({ kind: 'geschrevenVerslag' })
            }}
            onOpenSession={(sessionId) => {
              setIsNewSessionModalOpen(false)
              setNewSessionCoacheeId(null)
              setSessionOriginRoute(null)
              navigateTo({ kind: 'sessie', sessieId: sessionId })
            }}
          />

          <MyAccountModal
            visible={isMyAccountModalOpen}
            onClose={() => setIsMyAccountModalOpen(false)}
            onLogout={() => setIsMyAccountModalOpen(false)}
            onDeleteAccount={() => {
              if (isDeletingAccount) return
              setDeleteAccountErrorMessage(null)
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

          <DeleteAccountErrorModal
            visible={Boolean(deleteAccountErrorMessage)}
            message={deleteAccountErrorMessage || ''}
            onClose={() => setDeleteAccountErrorMessage(null)}
          />

          <MySubscriptionModal visible={isMySubscriptionModalOpen} onClose={() => setIsMySubscriptionModalOpen(false)} />
          <FeedbackModal
            visible={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onContinue={submitFeedback}
          />
          <CoacheeUpsertModal
            visible={isCoacheeModalOpen}
            mode="create"
            initialName=""
            onClose={() => setIsCoacheeModalOpen(false)}
            onSave={(name) => {
              const trimmedName = name.trim()
              if (!trimmedName) {
                setIsCoacheeModalOpen(false)
                return
              }
              const createdCoacheeId = createCoachee(trimmedName)
              if (createdCoacheeId) {
                setNewlyCreatedCoacheeId(createdCoacheeId)
              }
              setIsCoacheeModalOpen(false)
            }}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    ...( { height: '100vh', overflow: 'hidden' } as any ),
  },
  breadcrumbContainer: {
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'absolute',
    top: 80,
    ...( { left: 264, right: 24 } as any ),
    zIndex: 2,
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
    ...( { overflow: 'hidden' } as any ),
  },
  mainContent: {
    flex: 1,
    padding: 24,
    ...( { overflow: 'auto' } as any ),
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
  tooSmallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tooSmallText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
})
