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
import { ShareCoachscribeModal } from './settings/ShareCoachscribeModal'
import { ContactModal } from './settings/ContactModal'
import { DeleteAccountConfirmModal } from './settings/DeleteAccountConfirmModal'
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
import { AdminRevenueScreen } from '../screens/AdminRevenueScreen'
import { AdminContactSubmissionsScreen } from '../screens/AdminContactSubmissionsScreen'
import { AdminWachtlijstScreen } from '../screens/AdminWachtlijstScreen'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'
import { EndToEndEncryptieScreen } from '../screens/EndToEndEncryptieScreen'
import { useToast } from '../toast/ToastProvider'
import { consumeSubscriptionReturnResumeRequest } from './newSession/subscriptionReturnDraftStore'
import { getCoacheeUpsertValues, serializeCoacheeUpsertValues } from '../utils/coacheeProfile'

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
  | { kind: 'admin-contact' }
  | { kind: 'admin-wachtlijst' }

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
  if (parts[0] === 'admin-contact') return { kind: 'admin-contact' }
  if (parts[0] === 'admin-wachtlijst') return { kind: 'admin-wachtlijst' }
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
  if (route.kind === 'admin-contact') return '/admin-contact'
  if (route.kind === 'admin-wachtlijst') return '/admin-wachtlijst'
  return '/archief'
}

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

function normalizeOptionalName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase()
  if (normalized === 'unknown' || normalized === 'onbekend' || normalized === 'n/a' || normalized === 'na') return null
  return trimmed
}

export function AppShell({ onLogout }: Props) {
  const { width } = useWindowDimensions()
  const isTooSmall = width < 1100
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
  const [writtenReportInitialCoacheeId, setWrittenReportInitialCoacheeId] = useState<string | null>(null)
  const [isGeschrevenVerslagOpen, setIsGeschrevenVerslagOpen] = useState(false)
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
      const response = await callSecureApi<{ planId?: string | null; canSeePricingPage?: boolean }>('/pricing/me-visibility', {})
      const canSeePricingPage = Boolean(response?.canSeePricingPage)
      setCanOpenSubscription(canSeePricingPage)
      setCurrentPlanId(typeof response?.planId === 'string' ? response.planId : null)
    } catch (error) {
      console.warn('[pricing] failed to refresh subscription access; keeping pricing page available', error)
      setCanOpenSubscription(true)
      setCurrentPlanId(null)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    void callSecureApi<{
      email: string | null
      name?: string | null
      displayName?: string | null
      givenName?: string | null
      surname?: string | null
      accountType?: 'admin' | 'paid' | 'test' | null
    }>('/auth/me', {})
      .then((response) => {
        if (isCancelled) return
        const email = typeof response?.email === 'string' ? response.email : null
        setCurrentUserEmail(email)
        const accountType = response?.accountType === 'admin' || response?.accountType === 'paid' || response?.accountType === 'test'
          ? response.accountType
          : null
        setCurrentUserAccountType(accountType)
        const givenName = normalizeOptionalName(response?.givenName)
        const surname = normalizeOptionalName(response?.surname)
        setCurrentUserGivenName(givenName)
        setCurrentUserSurname(surname)
        const fullNameFromEntra = [givenName, surname].filter(Boolean).join(' ').trim()
        const preferredName =
          fullNameFromEntra.length > 0
            ? fullNameFromEntra
            : normalizeOptionalName(response?.name) ??
              normalizeOptionalName(response?.displayName)
        setCurrentUserName(preferredName)
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
        const tasks = await listPendingPreviewAudioTasks()
        for (const task of tasks) {
          if (isCancelled) return
          const session = data.sessions.find((item) => item.id === task.sessionId)
          if (!session) {
            await clearPendingPreviewAudio(task.sessionId)
            continue
          }
          if (session.transcriptionStatus === 'done' && !task.shouldSaveAudio) {
            await clearPendingPreviewAudio(task.sessionId)
            continue
          }
          if (session.transcriptionStatus === 'done' && Boolean(session.audioBlobId)) {
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
    (route: RouteState) => {
      if (route.kind === 'archief') {
        setIsEndToEndEncryptiePageOpen(false)
        setSelectedSidebarItemKey('archief')
        setIsAdminScreenOpen(false)
        setIsAdminContactScreenOpen(false)
        setIsAdminWachtlijstScreenOpen(false)
        setOverlayScreenKey('archief')
        setIsGeschrevenVerslagOpen(false)
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }
      if (route.kind === 'geschrevenVerslag') {
        setIsEndToEndEncryptiePageOpen(false)
        setIsAdminScreenOpen(false)
        setIsAdminContactScreenOpen(false)
        setIsAdminWachtlijstScreenOpen(false)
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(true)
        setSelectedSidebarItemKey('sessies')
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }

      if (route.kind === 'admin') {
        if (!isCurrentUserAdmin) {
          setIsEndToEndEncryptiePageOpen(false)
          setIsAdminScreenOpen(false)
          setIsAdminContactScreenOpen(false)
          setIsAdminWachtlijstScreenOpen(false)
          setOverlayScreenKey(null)
          setIsGeschrevenVerslagOpen(false)
          setSelectedSidebarItemKey('coachees')
          setSelectedSessieId(null)
          setSelectedCoacheeId(null)
          setSessionOriginRoute(null)
          return
        }
        setIsEndToEndEncryptiePageOpen(false)
        setIsAdminScreenOpen(true)
        setIsAdminContactScreenOpen(false)
        setIsAdminWachtlijstScreenOpen(false)
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(false)
        setSelectedSidebarItemKey('admin')
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }

      if (route.kind === 'admin-contact') {
        if (!isCurrentUserAdmin) {
          setIsEndToEndEncryptiePageOpen(false)
          setIsAdminScreenOpen(false)
          setIsAdminContactScreenOpen(false)
          setIsAdminWachtlijstScreenOpen(false)
          setOverlayScreenKey(null)
          setIsGeschrevenVerslagOpen(false)
          setSelectedSidebarItemKey('coachees')
          setSelectedSessieId(null)
          setSelectedCoacheeId(null)
          setSessionOriginRoute(null)
          return
        }
        setIsEndToEndEncryptiePageOpen(false)
        setIsAdminScreenOpen(false)
        setIsAdminContactScreenOpen(true)
        setIsAdminWachtlijstScreenOpen(false)
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(false)
        setSelectedSidebarItemKey('adminContact')
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }

      if (route.kind === 'admin-wachtlijst') {
        if (!isCurrentUserAdmin) {
          setIsEndToEndEncryptiePageOpen(false)
          setIsAdminScreenOpen(false)
          setIsAdminContactScreenOpen(false)
          setIsAdminWachtlijstScreenOpen(false)
          setOverlayScreenKey(null)
          setIsGeschrevenVerslagOpen(false)
          setSelectedSidebarItemKey('coachees')
          setSelectedSessieId(null)
          setSelectedCoacheeId(null)
          setSessionOriginRoute(null)
          return
        }
        setIsEndToEndEncryptiePageOpen(false)
        setIsAdminScreenOpen(false)
        setIsAdminContactScreenOpen(false)
        setIsAdminWachtlijstScreenOpen(true)
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(false)
        setSelectedSidebarItemKey('adminWachtlijst')
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        setSessionOriginRoute(null)
        return
      }

      setIsAdminScreenOpen(false)
      setIsAdminContactScreenOpen(false)
      setIsAdminWachtlijstScreenOpen(false)
      setIsEndToEndEncryptiePageOpen(false)
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
      isCurrentUserAdmin,
      setIsAdminContactScreenOpen,
      setIsAdminScreenOpen,
      setIsEndToEndEncryptiePageOpen,
      setOverlayScreenKey,
      setIsGeschrevenVerslagOpen,
      setSelectedCoacheeId,
      setSelectedSessieId,
      setSelectedSidebarItemKey,
      setSessionOriginRoute,
      setIsAdminWachtlijstScreenOpen,
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

  const mainContentKey = useMemo(() => {
    if (overlayScreenKey) return overlayScreenKey
    if (isAdminScreenOpen) return 'admin'
    if (isAdminContactScreenOpen) return 'admin-contact'
    if (isAdminWachtlijstScreenOpen) return 'admin-wachtlijst'
    if (isGeschrevenVerslagOpen) return 'geschreven-verslag'
    if (selectedSessieId) return `sessie-${selectedSessieId}`
    if (selectedSidebarItemKey === 'sessies') return 'sessies'
    if (selectedSidebarItemKey === 'coachees') {
      return selectedCoacheeId ? `coachee-${selectedCoacheeId}` : 'coachees'
    }
    return selectedSidebarItemKey
  }, [isAdminContactScreenOpen, isAdminScreenOpen, isAdminWachtlijstScreenOpen, isGeschrevenVerslagOpen, overlayScreenKey, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey])

  const [newlyCreatedCoacheeId, setNewlyCreatedCoacheeId] = useState<string | null>(null)
  const [newlyCreatedCoacheeName, setNewlyCreatedCoacheeName] = useState<string | null>(null)

  const openNewCoacheeModal = useCallback(() => {
    setIsCoacheeModalOpen(true)
  }, [])

  const openNewSessionModal = useCallback(
    (coacheeId: string | null) => {
      if (isRecordingBusy) return
      setNewSessionCoacheeId(coacheeId)
      setIsNewSessionModalOpen(true)
    },
    [isRecordingBusy],
  )

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
    if (isAdminContactScreenOpen) return { kind: 'admin-contact' }
    if (isAdminWachtlijstScreenOpen) return { kind: 'admin-wachtlijst' }
    if (isGeschrevenVerslagOpen) return { kind: 'geschrevenVerslag' }
    if (selectedSessieId) return { kind: 'sessie', sessieId: selectedSessieId }
    if (selectedSidebarItemKey === 'coachees') {
      return selectedCoacheeId ? { kind: 'coachee', coacheeId: selectedCoacheeId } : { kind: 'coachees' }
    }
    if (selectedSidebarItemKey === 'templates') return { kind: 'templates' }
    if (selectedSidebarItemKey === 'mijnPraktijk') return { kind: 'mijn-praktijk' }
    if (selectedSidebarItemKey === 'admin') return { kind: 'admin' }
    if (selectedSidebarItemKey === 'adminContact') return { kind: 'admin-contact' }
    if (selectedSidebarItemKey === 'adminWachtlijst') return { kind: 'admin-wachtlijst' }
    return { kind: 'sessies' }
  }, [isAdminContactScreenOpen, isAdminScreenOpen, isAdminWachtlijstScreenOpen, isGeschrevenVerslagOpen, overlayScreenKey, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey])

  const breadcrumbItems = useMemo(() => {
    if (selectedSessieId) {
      const session = data.sessions.find((item) => item.id === selectedSessieId)
      if (!session) return []
      const sessionTitle = session.title ?? 'Verslag'
      const coacheeName = getCoacheeDisplayName(data.coachees, session.coacheeId)
      if (sessionOriginRoute?.kind === 'coachee' && session.coacheeId) {
        return [
          { label: 'Cliënten', onPress: () => navigateTo({ kind: 'coachees' }) },
          { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: sessionOriginRoute.coacheeId }) },
          { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
        ]
      }
      return [
        { label: 'Verslagen', onPress: () => navigateTo({ kind: 'sessies' }) },
        { label: sessionTitle, onPress: () => navigateTo({ kind: 'sessie', sessieId: selectedSessieId }) },
      ]
    }
    if (selectedSidebarItemKey === 'coachees' && selectedCoacheeId) {
      const coacheeName = data.coachees.find((item) => item.id === selectedCoacheeId)?.name ?? 'Cliënt'
      return [
        { label: 'Cliënten', onPress: () => navigateTo({ kind: 'coachees' }) },
        { label: coacheeName, onPress: () => navigateTo({ kind: 'coachee', coacheeId: selectedCoacheeId }) },
      ]
    }
    return []
  }, [data.coachees, data.sessions, navigateTo, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey, sessionOriginRoute])

  const hasBreadcrumbs = breadcrumbItems.length >= 2 && !isEndToEndEncryptiePageOpen
  const isE2eeSetupBannerVisible = false
  const isSettingsSelected = isEndToEndEncryptiePageOpen

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
      showErrorToast(parseDeleteAccountErrorMessage(error), 'Verwijderen mislukt. Probeer het later opnieuw.')
    } finally {
      setIsDeletingAccount(false)
    }
  }, [isDeletingAccount, onLogout, showErrorToast])

  const submitFeedback = useCallback(async (feedback: string) => {
    await callSecureApi<{ ok: true }>('/feedback', { message: feedback })
    showToast('Feedback verzonden! Bedankt voor je hulp.')
  }, [showToast])

  function renderMainContent() {
    if (!isAppDataLoaded) {
      return <AppLoadingScreen />
    }
    if (isEndToEndEncryptiePageOpen) {
      return <EndToEndEncryptieScreen onBack={() => setIsEndToEndEncryptiePageOpen(false)} />
    }
    if (isAdminScreenOpen) {
      return <AdminRevenueScreen />
    }
    if (isAdminContactScreenOpen) {
      return <AdminContactSubmissionsScreen />
    }
    if (isAdminWachtlijstScreenOpen) {
      return <AdminWachtlijstScreen />
    }
    if (overlayScreenKey === 'archief') {
      return <ArchiefScreen />
    }

    if (isGeschrevenVerslagOpen) {
      return (
        <GeschrevenVerslagScreen
          initialCoacheeId={writtenReportInitialCoacheeId}
          onBack={() => {
            setWrittenReportInitialCoacheeId(null)
            if (previousRoute) {
              navigateTo(previousRoute)
              setPreviousRoute(null)
              return
            }
            goBack()
          }}
          onOpenNewCoachee={openNewCoacheeModal}
          onOpenSession={(sessionId) => {
            setWrittenReportInitialCoacheeId(null)
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
            message="Dit verslag bestaat niet meer."
            onGoHome={() => navigateTo({ kind: 'sessies' })}
          />
        )
      }
      const sessieTitle = selectedSessie.title ?? 'Verslag'
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
          onOpenMySubscription={() => setIsMySubscriptionModalOpen(true)}
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
              message="Deze cliënt bestaat niet meer."
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
            isCreateSessionDisabled={isRecordingBusy}
            onPressCreateSession={() => openNewSessionModal(selectedCoacheeId)}
            onOpenMySubscription={() => {
              if (!canOpenSubscription) return
              setIsMySubscriptionModalOpen(true)
            }}
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
          isCreateSessionDisabled={isRecordingBusy}
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

  if (isTooSmall) {
    return (
      <View style={styles.page}>
        <View style={styles.tooSmallContainer}>
          <Text style={styles.tooSmallText}>Deze webapp is niet zichtbaar op schermen smaller dan 1100px.</Text>
        </View>
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
      />
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
      <>
        {/* Page content */}
        <View style={styles.contentRow}>
            {/* Sidebar */}
            <Sidebar
              selectedSidebarItemKey={selectedSidebarItemKey}
              isSettingsSelected={isSettingsSelected}
              isAdminUser={isCurrentUserAdmin}
              onSelectSidebarItem={(sidebarItemKey) => {
                navigateTo(
                  sidebarItemKey === 'coachees'
                    ? { kind: 'coachees' }
                    : sidebarItemKey === 'templates'
                      ? { kind: 'templates' }
                      : sidebarItemKey === 'admin'
                        ? { kind: 'admin' }
                      : sidebarItemKey === 'adminContact'
                        ? { kind: 'admin-contact' }
                      : sidebarItemKey === 'adminWachtlijst'
                        ? { kind: 'admin-wachtlijst' }
                      : sidebarItemKey === 'mijnPraktijk'
                        ? { kind: 'mijn-praktijk' }
                      : sidebarItemKey === 'archief'
                        ? { kind: 'archief' }
                      : { kind: 'sessies' },
                )
                setIsSettingsMenuOpen(false)
              }}
              onPressCreateSession={() => openNewSessionModal(null)}
              isCreateSessionDisabled={isRecordingBusy}
              onOpenContact={() => {
                setIsSettingsMenuOpen(false)
                setSettingsMenuAnchorPoint(null)
                setIsContactModalOpen(true)
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
            restoreDraftFromSubscriptionReturn={restoreNewSessionDraftFromSubscriptionReturn}
            onRestoreDraftHandled={() => setRestoreNewSessionDraftFromSubscriptionReturn(false)}
            onClose={() => {
              setIsRecordingBusy(false)
              setIsNewSessionModalOpen(false)
              setNewlyCreatedCoacheeId(null)
              setNewSessionCoacheeId(null)
            }}
            onOpenMySubscription={() => {
              if (!canOpenSubscription) return
              setIsMySubscriptionModalOpen(true)
            }}
            onOpenNewCoachee={openNewCoacheeModal}
            newlyCreatedCoacheeId={newlyCreatedCoacheeId}
            onNewlyCreatedCoacheeHandled={() => setNewlyCreatedCoacheeId(null)}
            onStartWrittenReport={() => {
              setIsNewSessionModalOpen(false)
              setWrittenReportInitialCoacheeId(newSessionCoacheeId)
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
            onClose={() => setIsCoacheeModalOpen(false)}
            onSave={(values) => {
              const serialized = serializeCoacheeUpsertValues(values)
              const trimmedName = serialized.name.trim()
              if (!trimmedName) {
                setIsCoacheeModalOpen(false)
                return
              }
              const createdCoacheeId = createCoachee(serialized)
              if (createdCoacheeId) {
                setNewlyCreatedCoacheeId(createdCoacheeId)
              }
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
    backgroundColor: '#FFFFFF',
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
