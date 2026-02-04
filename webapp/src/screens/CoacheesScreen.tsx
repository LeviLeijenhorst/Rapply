import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { CoacheeCard } from '../components/CoacheeCard'
import { CoacheeEditMenu } from '../components/CoacheeEditMenu'
import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { SearchIcon } from '../components/icons/SearchIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { CoacheeUpsertModal } from '../components/coachees/CoacheeUpsertModal'
import { ConfirmCoacheeDeleteModal } from '../components/coachees/ConfirmCoacheeDeleteModal'
import { useLocalAppData } from '../local/LocalAppDataProvider'

type Props = {
  onSelectCoachee: (coacheeId: string) => void
}

export function CoacheesScreen({ onSelectCoachee }: Props) {
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

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
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

  const pendingDeleteCoacheeName = pendingDeleteCoacheeId ? data.coachees.find((item) => item.id === pendingDeleteCoacheeId)?.name : null

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerRow}>
        {/* Page title */}
        <Text isSemibold style={styles.headerTitle}>
          Coachees
        </Text>
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
                  placeholder="Zoek tussen coachees..."
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
                <Text isBold style={styles.searchButtonText}>
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
            <Text numberOfLines={1} isBold style={styles.addButtonText}>
              + Toevoegen
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Coachees list */}
      <View style={styles.list}>
        {filteredCoachees.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <CoacheeCard
              name={item.name}
              detailLabel={`${coacheeSessionCounts.get(item.id) ?? 0} sessies`}
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
        {coachees.length === 0 ? (
          <View style={styles.emptySessionsContainer}>
            {/* Empty coachees message */}
            <Text style={styles.emptySessionsText}>Nog geen coachees.</Text>
          </View>
        ) : null}
      </View>

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
  headerButton: {
    width: 138,
    height: 40,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
  },
  addButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  searchButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyMedium,
    color: '#656565',
    padding: 0,
  },
  list: {
    gap: 12,
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
})

