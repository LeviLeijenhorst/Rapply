import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { ConversationCard } from '../components/ConversationCard'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { PlusIcon } from '../components/icons/PlusIcon'
import { SearchIcon } from '../components/icons/SearchIcon'

export const dummyConversations = [
  { id: '1', title: 'Intake gesprek', timeLabel: '12:04', durationLabel: '34 minuten' },
  { id: '2', title: 'Voortgang coachingsessie', timeLabel: '10:22', durationLabel: '52 minuten' },
  { id: '3', title: 'Terugblik week 3', timeLabel: '08:47', durationLabel: '28 minuten' },
  { id: '4', title: 'Plan van aanpak', timeLabel: '16:15', durationLabel: '41 minuten' },
]

type Props = {
  onSelectConversation: (conversationId: string) => void
}

export function GesprekkenScreen({ onSelectConversation }: Props) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchVisible = isSearchOpen || normalizedQuery.length > 0

  const filteredConversations = dummyConversations.filter((item) => item.title.toLowerCase().includes(normalizedQuery))

  const searchInputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  useEffect(() => {
    if (!isSearchOpen) return
    const id = setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [isSearchOpen])

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerRow}>
        {/* Page title */}
        <Text style={styles.headerTitle}>Gesprekken</Text>
        {/* Header actions */}
        <View style={styles.headerActions}>
          {isSearchVisible ? (
            <View style={styles.searchInputContainer}>
              {/* Search icon */}
              <SearchIcon color="#656565" size={18} />
              {/* Search input */}
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Zoeken..."
                placeholderTextColor="#656565"
                onBlur={() => {
                  setIsSearchOpen(false)
                }}
                style={[styles.searchInput, searchInputWebStyle]}
              />
            </View>
          ) : (
            <Pressable style={[styles.headerButton, styles.searchButton]} onPress={() => setIsSearchOpen(true)}>
              {/* Search icon */}
              <SearchIcon color="#656565" size={18} />
              {/* Search label */}
              <Text isBold style={styles.searchButtonText}>
                Zoeken
              </Text>
            </Pressable>
          )}
          <Pressable style={[styles.headerButton, styles.addButton]} onPress={() => undefined}>
            {/* Add icon */}
            <PlusIcon color="#FFFFFF" size={20} />
            {/* Add label */}
            <Text isBold style={styles.addButtonText}>
              Toevoegen
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Conversations list */}
      <View style={styles.list}>
        {filteredConversations.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <ConversationCard
              title={item.title}
              timeLabel={item.timeLabel}
              durationLabel={item.durationLabel}
              onPress={() => onSelectConversation(item.id)}
            />
          </View>
        ))}
      </View>
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
    backgroundColor: colors.selected,
  },
  searchButton: {
    backgroundColor: '#E0E0E0',
  },
  addButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  searchButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },    
  searchInputContainer: {
    width: 315,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
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

