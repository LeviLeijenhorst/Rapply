import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { SessieListItemCard } from '../components/sessies/SessieListItemCard'
import { PopoverMenu } from '../components/PopoverMenu'
import { ArchiveIcon } from '../components/icons/ArchiveIcon'
import { SearchIcon } from '../components/icons/SearchIcon'
import { StandaardVerslagIcon } from '../components/icons/StandaardVerslagIcon'
import { TrashIcon } from '../components/icons/TrashIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { webTransitionSmooth } from '../theme/webTransitions'
import { typography } from '../theme/typography'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { getCoacheeDisplayName, unassignedCoacheeLabel } from '../utils/coachee'
import { ConfirmSessieDeleteModal } from '../components/sessies/ConfirmSessieDeleteModal'

type Props = {
  onSelectSessie: (sessieId: string) => void
  onPressCreateSession: () => void
}

type TabKey = 'alleSessies' | 'losseSessies'

export function SessiesScreen({ onSelectSessie, onPressCreateSession }: Props) {
  const { data, deleteSession } = useLocalAppData()
  const [activeTabKey, setActiveTabKey] = useState<TabKey>('alleSessies')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0

  const filteredSessies = useMemo(() => {
    return data.sessions
      .filter((session) => session.kind !== 'notes')
      .map((session) => {
        const coacheeName = getCoacheeDisplayName(data.coachees, session.coacheeId)
        return {
          id: session.id,
          title: session.title,
          coacheeName,
          dateLabel: new Date(session.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' }),
          timeLabel: new Date(session.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          transcriptionStatus: session.transcriptionStatus,
        }
      })
      .filter((item) => {
        if (activeTabKey === 'losseSessies' && item.coacheeName !== unassignedCoacheeLabel) return false
        return item.title.toLowerCase().includes(normalizedQuery)
      })
  }, [activeTabKey, data.coachees, data.sessions, normalizedQuery])

  const searchInputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const isMenuVisible = !!menuSessionId && !!menuAnchorPoint
  const pendingDeleteSessionTitle = pendingDeleteSessionId ? data.sessions.find((item) => item.id === pendingDeleteSessionId)?.title : null

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
        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TabButton
            label="Alle sessies"
            isSelected={activeTabKey === 'alleSessies'}
            icon={(color) => <ArchiveIcon color={color} size={18} />}
            onPress={() => setActiveTabKey('alleSessies')}
          />
          <TabButton
            label="Losse sessies"
            isSelected={activeTabKey === 'losseSessies'}
            icon={(color) => <StandaardVerslagIcon color={color} size={18} />}
            onPress={() => setActiveTabKey('losseSessies')}
          />
        </View>
        {/* Header actions */}
        <View style={styles.headerActions}>
          <AnimatedWidthContainer width={isSearchExpanded ? 315 : 138} style={styles.searchWidthContainer}>
            {isSearchExpanded ? (
              <View style={styles.searchControl}>
                {/* Search */}
                <SearchIcon color="#656565" size={18} />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Zoek sessie..."
                  placeholderTextColor="#656565"
                  onBlur={() => setIsSearchOpen(false)}
                  style={[styles.searchInput, searchInputWebStyle]}
                />
              </View>
            ) : (
              <Pressable onPress={() => setIsSearchOpen(true)} style={({ hovered }) => [styles.searchControl, hovered ? styles.searchControlHovered : undefined]}>
                {/* Search */}
                <SearchIcon color="#656565" size={18} />
                <Text isBold style={styles.searchButtonText}>
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
            <Text numberOfLines={1} isBold style={styles.addButtonText}>
              + Nieuwe sessie
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Sessions list */}
      <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.animatedList}>
        <ScrollView style={styles.sessionsScroll} contentContainerStyle={styles.sessionsScrollContent} showsVerticalScrollIndicator={false}>
          {filteredSessies.length === 0 ? (
            <View style={styles.emptySessionsContainer}>
              {/* Empty sessions message */}
              <Text style={styles.emptySessionsText}>Nog geen sessies.</Text>
            </View>
          ) : null}
          {filteredSessies.map((item) => {
            const isReport = item.title.toLowerCase().includes('verslag')
            return (
              <View key={item.id} style={styles.listItem}>
                <SessieListItemCard
                  title={item.title}
                  dateTimeLabel={`${item.dateLabel}, ${item.timeLabel}`}
                  coacheeName={item.coacheeName}
                  isReport={isReport}
                  transcriptionStatus={item.transcriptionStatus}
                  onPress={() => onSelectSessie(item.id)}
                  onPressEdit={() => onSelectSessie(item.id)}
                  onPressMore={(anchorPoint) => {
                    setMenuAnchorPoint(anchorPoint)
                    setMenuSessionId(item.id)
                  }}
                />
              </View>
            )
          })}
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
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  tabButton: {
    height: 40,
    borderRadius: 12,
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
  searchWidthContainer: {
    height: 40,
  },
  searchControl: {
    width: '100%',
    height: 40,
    borderRadius: 12,
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
  },
  addButton: {
    width: 138,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyMedium,
    color: '#656565',
    padding: 0,
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
})

