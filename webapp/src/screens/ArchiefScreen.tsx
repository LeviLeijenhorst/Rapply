import React, { useMemo, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { ArchivedCoacheeCard } from '../components/ArchivedCoacheeCard'
import { SearchIcon } from '../components/icons/SearchIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { ConfirmCoacheeDeleteModal } from '../components/coachees/ConfirmCoacheeDeleteModal'
import { useLocalAppData } from '../local/LocalAppDataProvider'

export function ArchiefScreen() {
  const { data, restoreCoachee, deleteCoachee } = useLocalAppData()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteCoacheeId, setPendingDeleteCoacheeId] = useState<string | null>(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const archivedCoachees = data.coachees.filter((c) => c.isArchived)
  const filteredItems = useMemo(() => {
    if (normalizedQuery.length === 0) return archivedCoachees
    return archivedCoachees.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
  }, [archivedCoachees, normalizedQuery])

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const pendingDeleteCoacheeName = pendingDeleteCoacheeId ? data.coachees.find((item) => item.id === pendingDeleteCoacheeId)?.name : null

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerRow}>
        {/* Page title */}
        <Text isSemibold style={styles.headerTitle}>
          Archief
        </Text>
        {/* Search */}
        <AnimatedWidthContainer width={315} style={styles.searchWidthContainer}>
          <View style={styles.searchControl}>
            {/* Search icon */}
            <SearchIcon color="#656565" size={18} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Zoek coachee..."
              placeholderTextColor="#656565"
              style={[styles.searchInput, inputWebStyle]}
            />
          </View>
        </AnimatedWidthContainer>
      </View>

      {/* Archived list */}
      <View style={styles.list}>
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
    marginBottom: 16,
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
})

