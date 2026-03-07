import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { AnimatedWidthContainer } from '../ui/AnimatedWidthContainer'
import { ArchivedCoacheeCard } from '../components/ArchivedCoacheeCard'
import { SearchIcon } from '../icons/SearchIcon'
import { Text } from '../ui/Text'
import { colors } from '../design/theme/colors'
import { typography } from '../design/theme/typography'
import { ConfirmCoacheeDeleteModal } from '../components/coachees/ConfirmCoacheeDeleteModal'
import { useLocalAppData } from '../local/LocalAppDataProvider'

export function ArchiefScreen() {
  const { width: windowWidth } = useWindowDimensions()
  const { data, restoreCoachee, deleteCoachee } = useLocalAppData()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteCoacheeId, setPendingDeleteCoacheeId] = useState<string | null>(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchExpanded = isSearchOpen || normalizedQuery.length > 0
  const isCompactHeader = windowWidth <= 760
  const compactSearchExpandedWidth = Math.min(240, Math.max(140, windowWidth - 360))
  const expandedSearchWidth = isCompactHeader ? compactSearchExpandedWidth : 315
  const archivedCoachees = data.coachees.filter((c) => c.isArchived)
  const filteredItems = useMemo(() => {
    if (normalizedQuery.length === 0) return archivedCoachees
    return archivedCoachees.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
  }, [archivedCoachees, normalizedQuery])

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const pendingDeleteCoacheeName = pendingDeleteCoacheeId ? data.coachees.find((item) => item.id === pendingDeleteCoacheeId)?.name : null

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

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerRow}>
        {isCompactHeader ? null : (
          <Text isSemibold style={styles.headerTitle}>
            Archief
          </Text>
        )}
        <View style={[styles.headerActions, isCompactHeader ? styles.headerActionsCompact : undefined]}>
          {isCompactHeader ? (
            <Text isSemibold style={styles.headerTitle}>
              Archief
            </Text>
          ) : null}
          <AnimatedWidthContainer width={isSearchExpanded ? expandedSearchWidth : 138} style={styles.searchWidthContainer}>
            {isSearchExpanded ? (
              <View style={styles.searchControl}>
                <SearchIcon color="#656565" size={18} />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Zoek cliënt..."
                  placeholderTextColor="#656565"
                  onBlur={() => setIsSearchOpen(false)}
                  style={[styles.searchInput, inputWebStyle]}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setIsSearchOpen(true)}
                style={({ hovered }) => [styles.searchControl, hovered ? styles.searchControlHovered : undefined]}
              >
                <SearchIcon color="#656565" size={18} />
                <Text isBold style={styles.searchButtonText}>
                  Zoeken
                </Text>
              </Pressable>
            )}
          </AnimatedWidthContainer>
        </View>
      </View>

      {/* Archived list */}
      <View style={styles.list}>
        {archivedCoachees.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Nog geen gearchiveerde cliënten.</Text>
          </View>
        ) : null}
        {archivedCoachees.length > 0 && filteredItems.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Geen cliënten gevonden in het archief.</Text>
          </View>
        ) : null}
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <ArchivedCoacheeCard
              name={item.name}
              onRestore={() => restoreCoachee(item.id)}
              onDelete={() => {
                setPendingDeleteCoacheeId(item.id)
                setIsDeleteModalOpen(true)
              }}
            />
          </View>
        ))}
      </View>
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
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
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
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})




