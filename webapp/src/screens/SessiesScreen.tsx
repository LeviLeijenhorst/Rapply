import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { SessieListItemCard } from '../components/sessies/SessieListItemCard'
import { PopoverMenu } from '../components/PopoverMenu'
import { ArchiveIcon } from '../components/icons/ArchiveIcon'
import { SearchIcon } from '../components/icons/SearchIcon'
import { PlusIcon } from '../components/icons/PlusIcon'
import { StandaardVerslagIcon } from '../components/icons/StandaardVerslagIcon'
import { TrashIcon } from '../components/icons/TrashIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { webTransitionSmooth } from '../theme/webTransitions'
import { typography } from '../theme/typography'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { getCoacheeDisplayName, unassignedCoacheeLabel } from '../utils/coachee'
import { ConfirmSessieDeleteModal } from '../components/sessies/ConfirmSessieDeleteModal'
import { SessieRenameModal } from '../components/sessies/SessieRenameModal'

type Props = {
  onSelectSessie: (sessieId: string) => void
  onPressCreateSession: () => void
}

type TabKey = 'alleSessies' | 'losseSessies'
let persistedSessiesScrollY = 0

function formatDurationLabel(durationSeconds: number | null): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds === null || durationSeconds <= 0) return ''
  const roundedSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const seconds = roundedSeconds % 60
  const paddedMinutes = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${minutes}:${paddedSeconds}`
}

export function SessiesScreen({ onSelectSessie, onPressCreateSession }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const { data, deleteSession, updateSession } = useLocalAppData()
  const [activeTabKey, setActiveTabKey] = useState<TabKey>('alleSessies')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null)
  const [renameInitialTitle, setRenameInitialTitle] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const sessionsScrollRef = useRef<ScrollView | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
  const isCompactHeader = windowWidth <= 980
  const compactSearchExpandedWidth = Math.min(260, Math.max(150, windowWidth - 470))
  const expandedSearchWidth = isCompactHeader ? compactSearchExpandedWidth : 315

  const filteredSessies = useMemo(() => {
    return data.sessions
      .filter((session) => session.kind !== 'notes')
      .map((session) => {
        const coacheeName = getCoacheeDisplayName(data.coachees, session.coacheeId)
        return {
          id: session.id,
          title: session.title,
          coacheeName,
          isReport: session.kind === 'written',
          dateLabel: new Date(session.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' }),
          timeLabel: new Date(session.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          durationLabel: formatDurationLabel(session.audioDurationSeconds),
          transcriptionStatus: session.transcriptionStatus,
        }
      })
      .filter((item) => {
        if (activeTabKey === 'losseSessies' && item.coacheeName !== unassignedCoacheeLabel) return false
        return item.title.toLowerCase().includes(normalizedQuery)
      })
  }, [activeTabKey, data.coachees, data.sessions, normalizedQuery])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredSessies.length / pageSize))
  const paginatedSessies = filteredSessies.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [activeTabKey, normalizedQuery])

  const searchInputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const isMenuVisible = !!menuSessionId && !!menuAnchorPoint
  const pendingDeleteSessionTitle = pendingDeleteSessionId ? data.sessions.find((item) => item.id === pendingDeleteSessionId)?.title : null
  const headerTabsRow = (
    <View style={[styles.tabsRow, isCompactHeader ? styles.tabsRowCompact : undefined]}>
        <TabButton
        label="Alle verslagen"
        isSelected={activeTabKey === 'alleSessies'}
        icon={(color) => <ArchiveIcon color={color} size={18} />}
        onPress={() => setActiveTabKey('alleSessies')}
      />
      <TabButton
        label="Losse verslagen"
        isSelected={activeTabKey === 'losseSessies'}
        icon={(color) => <StandaardVerslagIcon color={color} size={18} />}
        onPress={() => setActiveTabKey('losseSessies')}
      />
    </View>
  )
  const headerActionsRow = (
    <View style={[styles.headerActions, isCompactHeader ? styles.headerActionsCompact : undefined]}>
      <AnimatedWidthContainer width={isSearchExpanded ? expandedSearchWidth : 138} style={styles.searchWidthContainer}>
        {isSearchExpanded ? (
          <View style={styles.searchControl}>
            {/* Search */}
            <SearchIcon color="#656565" size={18} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Zoek verslag..."
              placeholderTextColor="#656565"
              onBlur={() => setIsSearchOpen(false)}
              style={[styles.searchInput, searchInputWebStyle]}
            />
          </View>
        ) : (
          <Pressable onPress={() => setIsSearchOpen(true)} style={({ hovered }) => [styles.searchControl, hovered ? styles.searchControlHovered : undefined]}>
            {/* Search */}
            <SearchIcon color="#656565" size={18} />
            <Text style={styles.searchButtonText}>
              Zoeken
            </Text>
          </Pressable>
        )}
      </AnimatedWidthContainer>
      <Pressable
        style={({ hovered }) => [styles.addButton, webTransitionSmooth, hovered ? styles.addButtonHovered : undefined]}
        onPress={onPressCreateSession}
      >
        {/* Add label */}
        <PlusIcon color="#FFFFFF" size={22} />
        <Text numberOfLines={1} style={styles.addButtonText}>
          Nieuw verslag
        </Text>
      </Pressable>
    </View>
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isSearchExpanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      ;(searchInputRef.current as any)?.blur?.()
      if (searchQuery.trim().length === 0) {
        setIsSearchOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSearchExpanded, searchQuery])

  useEffect(() => {
    if (!isSearchOpen) return
    const id = setTimeout(() => searchInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [isSearchOpen])

  useEffect(() => {
    const id = setTimeout(() => {
      sessionsScrollRef.current?.scrollTo({ y: persistedSessiesScrollY, animated: false })
    }, 0)
    return () => clearTimeout(id)
  }, [])

  return (
    <View style={styles.container}>
      {isSearchExpanded ? (
        <Pressable
          onPress={() => {
            ;(searchInputRef.current as any)?.blur?.()
            if (searchQuery.trim().length === 0) {
              setIsSearchOpen(false)
            }
          }}
          style={styles.searchDismissOverlay}
        />
      ) : null}
      {/* Page header */}
      <View style={styles.headerRow}>
        {isCompactHeader ? headerActionsRow : headerTabsRow}
        {isCompactHeader ? headerTabsRow : headerActionsRow}
      </View>
      {/* Sessions list */}
      <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.animatedList}>
        <ScrollView
          ref={sessionsScrollRef}
          style={styles.sessionsScroll}
          contentContainerStyle={styles.sessionsScrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            persistedSessiesScrollY = event.nativeEvent.contentOffset.y
          }}
          scrollEventThrottle={16}
        >
          {filteredSessies.length === 0 ? (
            <View style={styles.emptySessionsContainer}>
              {/* Empty reports message */}
              <Text style={styles.emptySessionsText}>Nog geen verslagen.</Text>
            </View>
          ) : null}
          {paginatedSessies.map((item) => {
            return (
              <View key={item.id} style={styles.listItem}>
                <SessieListItemCard
                  title={item.title}
                  dateLabel={item.dateLabel}
                  timeLabel={item.timeLabel}
                  durationLabel={item.durationLabel}
                  coacheeName={item.coacheeName}
                  isReport={item.isReport}
                  transcriptionStatus={item.transcriptionStatus}
                  onPress={() => onSelectSessie(item.id)}
                  onPressEdit={() => {
                    setRenameSessionId(item.id)
                    setRenameInitialTitle(item.title)
                    setIsRenameModalOpen(true)
                  }}
                  onPressMore={(anchorPoint) => {
                    setMenuAnchorPoint(anchorPoint)
                    setMenuSessionId(item.id)
                  }}
                />
              </View>
            )
          })}
          {filteredSessies.length > pageSize ? (
            <View style={styles.paginationRow}>
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={({ hovered }) => [styles.paginationButton, page <= 1 ? styles.paginationButtonDisabled : undefined, hovered && page > 1 ? styles.paginationButtonHovered : undefined]}
              >
                <Text style={[styles.paginationButtonText, page <= 1 ? styles.paginationButtonTextDisabled : undefined]}>Vorige</Text>
              </Pressable>
              <Text style={styles.paginationInfo}>
                Pagina {page} van {totalPages}
              </Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={({ hovered }) => [styles.paginationButton, page >= totalPages ? styles.paginationButtonDisabled : undefined, hovered && page < totalPages ? styles.paginationButtonHovered : undefined]}
              >
                <Text style={[styles.paginationButtonText, page >= totalPages ? styles.paginationButtonTextDisabled : undefined]}>Volgende</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </AnimatedMainContent>

      <PopoverMenu
        visible={isMenuVisible}
        anchorPoint={menuAnchorPoint}
        placement="below"
        width={220}
        estimatedHeight={44 + 4 * 2 + 8}
        items={[
          {
            key: 'delete',
            label: 'Verwijderen',
            icon: <TrashIcon color={colors.selected} size={18} />,
            isDanger: true,
            onPress: () => {
              if (!menuSessionId) return
              setPendingDeleteSessionId(menuSessionId)
              setIsDeleteModalOpen(true)
              setMenuSessionId(null)
              setMenuAnchorPoint(null)
            },
          },
        ]}
        onClose={() => {
          setMenuSessionId(null)
          setMenuAnchorPoint(null)
        }}
      />

      <ConfirmSessieDeleteModal
        visible={isDeleteModalOpen}
        sessieTitle={pendingDeleteSessionTitle}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setPendingDeleteSessionId(null)
        }}
        onConfirm={() => {
          if (!pendingDeleteSessionId) return
          deleteSession(pendingDeleteSessionId)
          setIsDeleteModalOpen(false)
          setPendingDeleteSessionId(null)
        }}
      />
      <SessieRenameModal
        visible={isRenameModalOpen}
        initialName={renameInitialTitle}
        onClose={() => {
          setIsRenameModalOpen(false)
          setRenameSessionId(null)
        }}
        onSave={(name) => {
          if (!renameSessionId) {
            setIsRenameModalOpen(false)
            return
          }
          const trimmedName = name.trim()
          if (trimmedName.length === 0) {
            setIsRenameModalOpen(false)
            setRenameSessionId(null)
            return
          }
          updateSession(renameSessionId, { title: trimmedName })
          setIsRenameModalOpen(false)
          setRenameSessionId(null)
        }}
      />
    </View>
  )
}

type TabButtonProps = {
  label: string
  isSelected: boolean
  icon: (color: string) => React.ReactNode
  onPress: () => void
}

function TabButton({ label, isSelected, icon, onPress }: TabButtonProps) {
  const iconColor = isSelected ? '#FFFFFF' : colors.selected
  const textColor = isSelected ? '#FFFFFF' : colors.selected

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
        hovered ? (isSelected ? styles.tabButtonSelectedHovered : styles.tabButtonHovered) : undefined,
      ]}
    >
      {/* Tab button */}
      <View style={styles.tabButtonContent}>
        {/* Tab icon */}
        {icon(iconColor)}
        {/* Tab label */}
        <Text isSemibold style={[styles.tabLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  searchDismissOverlay: {
    ...( { position: 'absolute', inset: 0, zIndex: 9999 } as any ),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    ...( { overflowX: 'auto', overflowY: 'hidden' } as any ),
    ...( { scrollbarWidth: 'none' } as any ),
    ...( { msOverflowStyle: 'none' } as any ),
  },
  tabsRowCompact: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  tabButton: {
    height: 40,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tabButtonSelected: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  tabButtonSelectedHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  tabButtonUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tabButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionsCompact: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  searchWidthContainer: {
    height: 40,
  },
  searchControl: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...( { overflow: 'hidden' } as any ),
  },
  searchControlHovered: {
    backgroundColor: colors.hoverBackground,
  },
  searchButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  addButton: {
    width: 162,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonHovered: {
    backgroundColor: '#A50058',
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyRegular,
    color: '#656565',
    padding: 0,
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  animatedList: {
    flex: 1,
  },
  listItem: {
    width: '100%',
  },
  sessionsScroll: {
    flex: 1,
  },
  sessionsScrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  emptySessionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptySessionsText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paginationButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  paginationButtonTextDisabled: {
    color: colors.textSecondary,
  },
  paginationInfo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
})

