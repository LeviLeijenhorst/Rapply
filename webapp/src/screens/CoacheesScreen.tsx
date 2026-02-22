import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { CoacheeCard } from '../components/CoacheeCard'
import { CoacheeEditMenu } from '../components/CoacheeEditMenu'
import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { SearchIcon } from '../components/icons/SearchIcon'
import { PlusIcon } from '../components/icons/PlusIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { CoacheeUpsertModal } from '../components/coachees/CoacheeUpsertModal'
import { ConfirmCoacheeDeleteModal } from '../components/coachees/ConfirmCoacheeDeleteModal'
import { useLocalAppData } from '../local/LocalAppDataProvider'

type Props = {
  onSelectCoachee: (coacheeId: string) => void
}
let persistedCoacheesScrollY = 0

export function CoacheesScreen({ onSelectCoachee }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const { data, createCoachee, updateCoacheeName, archiveCoachee, deleteCoachee } = useLocalAppData()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)

  const [editMenuCoacheeId, setEditMenuCoacheeId] = useState<string | null>(null)
  const [editMenuAnchorPoint, setEditMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [isUpsertModalOpen, setIsUpsertModalOpen] = useState(false)
  const [upsertMode, setUpsertMode] = useState<'create' | 'edit'>('create')
  const [upsertCoacheeId, setUpsertCoacheeId] = useState<string | null>(null)
  const [upsertInitialName, setUpsertInitialName] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteCoacheeId, setPendingDeleteCoacheeId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const coacheesScrollRef = useRef<ScrollView | null>(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
  const isCompactHeader = windowWidth <= 760
  const compactSearchExpandedWidth = Math.min(240, Math.max(140, windowWidth - 360))
  const expandedSearchWidth = isCompactHeader ? compactSearchExpandedWidth : 315
  const coachees = data.coachees.filter((c) => !c.isArchived)
  const coacheeSessionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const session of data.sessions) {
      if (session.kind === 'notes') continue
      if (!session.coacheeId) continue
      counts.set(session.coacheeId, (counts.get(session.coacheeId) ?? 0) + 1)
    }
    return counts
  }, [data.sessions])
  const filteredCoachees = useMemo(() => coachees.filter((item) => item.name.toLowerCase().includes(normalizedQuery)), [coachees, normalizedQuery])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredCoachees.length / pageSize))
  const paginatedCoachees = filteredCoachees.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [normalizedQuery])

  const searchInputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  useEffect(() => {
    if (!isSearchOpen) return
    const id = setTimeout(() => searchInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [isSearchOpen])

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
    const id = setTimeout(() => {
      coacheesScrollRef.current?.scrollTo({ y: persistedCoacheesScrollY, animated: false })
    }, 0)
    return () => clearTimeout(id)
  }, [])

  const pendingDeleteCoacheeName = pendingDeleteCoacheeId ? data.coachees.find((item) => item.id === pendingDeleteCoacheeId)?.name : null

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerRow}>
        {isCompactHeader ? null : (
          <Text isSemibold style={styles.headerTitle}>
            Cliënten
          </Text>
        )}
        {/* Header actions */}
        <View style={[styles.headerActions, isCompactHeader ? styles.headerActionsCompact : undefined]}>
          {isCompactHeader ? (
              <Text isSemibold style={styles.headerTitle}>
                Cliënten
              </Text>
          ) : null}
          <AnimatedWidthContainer width={isSearchExpanded ? expandedSearchWidth : 138} style={styles.searchWidthContainer}>
            {isSearchExpanded ? (
              <View style={styles.searchControl}>
                {/* Search */}
                <SearchIcon color="#656565" size={18} />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Zoek cliënt..."
                  placeholderTextColor="#656565"
                  onBlur={() => {
                    setIsSearchOpen(false)
                  }}
                  style={[styles.searchInput, searchInputWebStyle]}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setIsSearchOpen(true)}
                style={({ hovered }) => [styles.searchControl, hovered ? styles.searchControlHovered : undefined]}
              >
                {/* Search */}
                <SearchIcon color="#656565" size={18} />
                <Text style={styles.searchButtonText}>
                  Zoeken
                </Text>
              </Pressable>
            )}
          </AnimatedWidthContainer>
          <Pressable
            style={({ hovered }) => [styles.headerButton, styles.addButton, hovered ? styles.addButtonHovered : undefined]}
            onPress={() => {
              setUpsertMode('create')
              setUpsertCoacheeId(null)
              setUpsertInitialName('')
              setIsUpsertModalOpen(true)
            }}
          >
            {/* Add label */}
            <PlusIcon color="#FFFFFF" size={22} />
            <Text numberOfLines={1} style={styles.addButtonText}>
              Nieuwe cliënt
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Coachees list */}
      <ScrollView
        ref={coacheesScrollRef}
        style={styles.listScroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          persistedCoacheesScrollY = event.nativeEvent.contentOffset.y
        }}
        scrollEventThrottle={16}
      >
        {paginatedCoachees.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <CoacheeCard
              name={item.name}
              detailLabel={`${coacheeSessionCounts.get(item.id) ?? 0} verslagen`}
              onPress={() => {
                onSelectCoachee(item.id)
              }}
              onPressEdit={() => {
                setUpsertMode('edit')
                setUpsertCoacheeId(item.id)
                setUpsertInitialName(item.name)
                setIsUpsertModalOpen(true)
              }}
              onPressMore={(anchorPoint) => {
                setEditMenuAnchorPoint(anchorPoint)
                setEditMenuCoacheeId((current) => (current === item.id ? null : item.id))
              }}
            />
          </View>
        ))}
        {filteredCoachees.length > pageSize ? (
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
        {coachees.length === 0 ? (
          <View style={styles.emptySessionsContainer}>
            {/* Empty clients message */}
            <Text style={styles.emptySessionsText}>Nog geen cliënten.</Text>
          </View>
        ) : null}
      </ScrollView>

      <CoacheeEditMenu
        visible={!!editMenuCoacheeId}
        anchorPoint={editMenuAnchorPoint}
        onClose={() => {
          setEditMenuCoacheeId(null)
          setEditMenuAnchorPoint(null)
        }}
        onArchive={() => {
          if (!editMenuCoacheeId) return
          archiveCoachee(editMenuCoacheeId)
          setEditMenuCoacheeId(null)
          setEditMenuAnchorPoint(null)
        }}
        onDelete={() => {
          if (!editMenuCoacheeId) return
          setPendingDeleteCoacheeId(editMenuCoacheeId)
          setIsDeleteModalOpen(true)
          setEditMenuCoacheeId(null)
          setEditMenuAnchorPoint(null)
        }}
      />

      <CoacheeUpsertModal
        visible={isUpsertModalOpen}
        mode={upsertMode}
        initialName={upsertInitialName}
        onClose={() => {
          setIsUpsertModalOpen(false)
          setUpsertCoacheeId(null)
        }}
        onSave={(name) => {
          if (upsertMode === 'create') {
            const trimmedName = name.trim()
            if (trimmedName.length === 0) {
              setIsUpsertModalOpen(false)
              return
            }
            createCoachee(trimmedName)
            setIsUpsertModalOpen(false)
            return
          }

          if (!upsertCoacheeId) {
            setIsUpsertModalOpen(false)
            return
          }

          const trimmedName = name.trim()
          if (trimmedName.length === 0) {
            setIsUpsertModalOpen(false)
            return
          }

          updateCoacheeName(upsertCoacheeId, trimmedName)
          setIsUpsertModalOpen(false)
          setUpsertCoacheeId(null)
        }}
      />
      <ConfirmCoacheeDeleteModal
        visible={isDeleteModalOpen}
        coacheeName={pendingDeleteCoacheeName}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setPendingDeleteCoacheeId(null)
        }}
        onConfirm={() => {
          if (!pendingDeleteCoacheeId) return
          deleteCoachee(pendingDeleteCoacheeId)
          setIsDeleteModalOpen(false)
          setPendingDeleteCoacheeId(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionsCompact: {
    width: '100%',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  headerButton: {
    width: 162,
    height: 40,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButton: {
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
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
  searchButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    ...( { transform: [{ translateY: 1 }] } as any ),
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyRegular,
    color: '#656565',
    padding: 0,
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  listScroll: {
    flex: 1,
  },
  listItem: {
    width: '100%',
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

