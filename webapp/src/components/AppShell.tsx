import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../theme/colors'
import { AnimatedMainContent } from './AnimatedMainContent'
import { Navbar } from './Navbar'
import { Sidebar, SidebarItemKey } from './Sidebar'
import { Text } from './Text'
import { getCoacheeDisplayName } from '../utils/coachee'
import { CoacheeDetailScreen } from '../screens/CoacheeDetailScreen'
import { CoacheesScreen } from '../screens/CoacheesScreen'
import { SessieDetailScreen } from '../screens/SessieDetailScreen'
import { SessiesScreen } from '../screens/SessiesScreen'
import { NewSessionModal } from './newSession/NewSessionModal'
import { GeschrevenVerslagScreen } from '../screens/GeschrevenVerslagScreen'
import { TemplatesScreen } from '../screens/TemplatesScreen'
import { HelpMenu } from './help/HelpMenu'
import { SettingsMenu } from './settings/SettingsMenu'
import { MyAccountModal } from './settings/MyAccountModal'
import { MySubscriptionModal } from './settings/MySubscriptionModal'
import { ArchiefScreen } from '../screens/ArchiefScreen'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { config } from '../config'
import { CoacheeUpsertModal } from './coachees/CoacheeUpsertModal'
import { EmptyPageMessage } from './EmptyPageMessage'

type AnchorPoint = { x: number; y: number }
type OverlayScreenKey = 'archief'
type RouteState =
  | { kind: 'sessies' }
  | { kind: 'sessie'; sessieId: string }
  | { kind: 'coachees' }
  | { kind: 'coachee'; coacheeId: string }
  | { kind: 'templates' }
  | { kind: 'geschrevenVerslag' }
  | { kind: 'archief' }

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
  if (parts[0] === 'geschreven-verslag') return { kind: 'geschrevenVerslag' }
  if (parts[0] === 'archief') return { kind: 'archief' }
  return { kind: 'sessies' }
}

function buildPathFromRoute(route: RouteState): string {
  if (route.kind === 'sessies') return '/sessies'
  if (route.kind === 'sessie') return `/sessies/${stripPrefix(route.sessieId, 'session')}`
  if (route.kind === 'coachees') return '/coachees'
  if (route.kind === 'coachee') return `/coachees/${stripPrefix(route.coacheeId, 'coachee')}`
  if (route.kind === 'templates') return '/templates'
  if (route.kind === 'geschrevenVerslag') return '/geschreven-verslag'
  return '/archief'
}

type Props = {
  onLogout: () => void
}

export function AppShell({ onLogout }: Props) {
  const { width } = useWindowDimensions()
  const isTooSmall = width < 420
  const { data, createCoachee } = useLocalAppData()

  const [selectedSidebarItemKey, setSelectedSidebarItemKey] = useState<SidebarItemKey>('sessies')
  const [selectedSessieId, setSelectedSessieId] = useState<string | null>(null)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [isGeschrevenVerslagOpen, setIsGeschrevenVerslagOpen] = useState(false)
  const [overlayScreenKey, setOverlayScreenKey] = useState<OverlayScreenKey | null>(null)

  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false)
  const [helpMenuAnchorPoint, setHelpMenuAnchorPoint] = useState<AnchorPoint | null>(null)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [settingsMenuAnchorPoint, setSettingsMenuAnchorPoint] = useState<AnchorPoint | null>(null)

  const [isMyAccountModalOpen, setIsMyAccountModalOpen] = useState(false)
  const [isMySubscriptionModalOpen, setIsMySubscriptionModalOpen] = useState(false)
  const [isCoacheeModalOpen, setIsCoacheeModalOpen] = useState(false)
  const [previousRoute, setPreviousRoute] = useState<RouteState | null>(null)

  const applyRoute = useCallback(
    (route: RouteState) => {
      if (route.kind === 'archief') {
        setOverlayScreenKey('archief')
        setIsGeschrevenVerslagOpen(false)
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        return
      }
      if (route.kind === 'geschrevenVerslag') {
        setOverlayScreenKey(null)
        setIsGeschrevenVerslagOpen(true)
        setSelectedSidebarItemKey('sessies')
        setSelectedSessieId(null)
        setSelectedCoacheeId(null)
        return
      }

      setOverlayScreenKey(null)
      setIsGeschrevenVerslagOpen(false)

      if (route.kind === 'coachees') {
        setSelectedSidebarItemKey('coachees')
        setSelectedCoacheeId(null)
        setSelectedSessieId(null)
        return
      }
      if (route.kind === 'coachee') {
        setSelectedSidebarItemKey('coachees')
        setSelectedCoacheeId(route.coacheeId)
        setSelectedSessieId(null)
        return
      }
      if (route.kind === 'templates') {
        setSelectedSidebarItemKey('templates')
        setSelectedCoacheeId(null)
        setSelectedSessieId(null)
        return
      }
      if (route.kind === 'sessie') {
        setSelectedSidebarItemKey('sessies')
        setSelectedSessieId(route.sessieId)
        setSelectedCoacheeId(null)
        return
      }
      setSelectedSidebarItemKey('sessies')
      setSelectedSessieId(null)
      setSelectedCoacheeId(null)
    },
    [setOverlayScreenKey, setIsGeschrevenVerslagOpen, setSelectedCoacheeId, setSelectedSessieId, setSelectedSidebarItemKey],
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
    if (selectedSidebarItemKey === 'coachees' && selectedCoacheeId) {
      navigateTo({ kind: 'coachees' })
      return
    }
    if (selectedSidebarItemKey === 'sessies' && selectedSessieId) {
      navigateTo({ kind: 'sessies' })
      return
    }
    navigateTo({ kind: 'sessies' })
  }, [navigateTo, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = () => {
      const route = parseRouteFromPath(window.location.pathname)
      applyRoute(route)
    }
    if (!window.location.pathname || window.location.pathname === '/' || window.location.pathname === '/inloggen') {
      const nextPath = buildPathFromRoute({ kind: 'sessies' })
      window.history.replaceState({ path: nextPath }, '', nextPath)
    }
    handlePopState()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [applyRoute])

  const mainContentKey = overlayScreenKey
    ? overlayScreenKey
    : isGeschrevenVerslagOpen
      ? 'geschreven-verslag'
      : selectedSidebarItemKey === 'sessies'
        ? selectedSessieId
          ? `sessie-${selectedSessieId}`
          : 'sessies'
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
    if (isGeschrevenVerslagOpen) return { kind: 'geschrevenVerslag' }
    if (selectedSidebarItemKey === 'coachees') {
      return selectedCoacheeId ? { kind: 'coachee', coacheeId: selectedCoacheeId } : { kind: 'coachees' }
    }
    if (selectedSidebarItemKey === 'templates') return { kind: 'templates' }
    if (selectedSessieId) return { kind: 'sessie', sessieId: selectedSessieId }
    return { kind: 'sessies' }
  }, [isGeschrevenVerslagOpen, overlayScreenKey, selectedCoacheeId, selectedSessieId, selectedSidebarItemKey])

  function renderMainContent() {
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
              navigateTo({ kind: 'sessie', sessieId: sessionId })
            }}
            onPressCreateSession={() => setIsNewSessionModalOpen(true)}
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
            newlyCreatedCoacheeName={newlyCreatedCoacheeName}
            onNewlyCreatedCoacheeHandled={() => {
              setNewlyCreatedCoacheeId(null)
              setNewlyCreatedCoacheeName(null)
            }}
          />
        )
      }
      return (
        <SessiesScreen
          onSelectSessie={(sessieId) => {
            navigateTo({ kind: 'sessie', sessieId })
          }}
          onPressCreateSession={() => setIsNewSessionModalOpen(true)}
        />
      )
    }

    if (selectedSidebarItemKey === 'templates') {
      return <TemplatesScreen />
    }
    return <Text style={styles.mainContentText}>{selectedSidebarItemKey}</Text>
  }

  return (
    <View style={styles.page}>
      {/* Top navigation bar */}
      <Navbar
        onLogout={onLogout}
        onOpenSubscription={() => {
          setIsMySubscriptionModalOpen(true)
          setIsSettingsMenuOpen(false)
          setSettingsMenuAnchorPoint(null)
        }}
      />
      {isTooSmall ? (
        <View style={styles.tooSmallContainer}>
          <Text style={styles.tooSmallText}>Deze webapp is niet ontworpen voor apparaten smaller dan 420px.</Text>
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
                      : { kind: 'sessies' },
                )
                setIsHelpMenuOpen(false)
                setIsSettingsMenuOpen(false)
              }}
              onPressCreateSession={() => setIsNewSessionModalOpen(true)}
              onOpenHelpMenu={(anchorPoint) => {
                setHelpMenuAnchorPoint(anchorPoint)
                setIsHelpMenuOpen(true)
                setIsSettingsMenuOpen(false)
              }}
              onOpenSettingsMenu={(anchorPoint) => {
                setSettingsMenuAnchorPoint(anchorPoint)
                setIsSettingsMenuOpen(true)
                setIsHelpMenuOpen(false)
              }}
            />
            {/* Main content */}
            <View style={styles.mainContent}>
              <AnimatedMainContent contentKey={mainContentKey}>{renderMainContent()}</AnimatedMainContent>
            </View>
          </View>

          <HelpMenu
            visible={isHelpMenuOpen}
            anchorPoint={helpMenuAnchorPoint}
            onClose={() => {
              setIsHelpMenuOpen(false)
              setHelpMenuAnchorPoint(null)
            }}
            onOpenHelpCenter={() => {
              setIsHelpMenuOpen(false)
              setHelpMenuAnchorPoint(null)
            }}
            onOpenFeedback={() => {
              setIsHelpMenuOpen(false)
              setHelpMenuAnchorPoint(null)
            }}
          />

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
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
              setIsMySubscriptionModalOpen(true)
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
            }}
            onOpenPrivacy={() => {
              setIsSettingsMenuOpen(false)
              setSettingsMenuAnchorPoint(null)
            }}
          />

          <NewSessionModal
            visible={isNewSessionModalOpen}
            onClose={() => {
              setIsNewSessionModalOpen(false)
              setNewlyCreatedCoacheeId(null)
            }}
            onOpenNewCoachee={openNewCoacheeModal}
            newlyCreatedCoacheeId={newlyCreatedCoacheeId}
            onNewlyCreatedCoacheeHandled={() => setNewlyCreatedCoacheeId(null)}
            onStartWrittenReport={() => {
              setIsNewSessionModalOpen(false)
              setPreviousRoute(currentRoute)
              navigateTo({ kind: 'geschrevenVerslag' })
            }}
            onOpenSession={(sessionId) => {
              setIsNewSessionModalOpen(false)
              navigateTo({ kind: 'sessie', sessieId: sessionId })
            }}
          />

          <MyAccountModal
            visible={isMyAccountModalOpen}
            initialName="Sarah Brouwer"
            initialEmail="Sarah@coaching.nl"
            onClose={() => setIsMyAccountModalOpen(false)}
            onSave={() => setIsMyAccountModalOpen(false)}
            onLogout={() => setIsMyAccountModalOpen(false)}
            onDeleteAccount={() => setIsMyAccountModalOpen(false)}
            isManagedByEntra
            entraAccountUrl={config.entra.accountPortalUrl}
          />

          <MySubscriptionModal visible={isMySubscriptionModalOpen} onClose={() => setIsMySubscriptionModalOpen(false)} />
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

