import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { TemplateEditModal } from '../components/templates/TemplateEditModal'
import { SearchIcon } from '../components/icons/SearchIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { TemplateNotSavedIcon } from '../components/icons/TemplateNotSavedIcon'
import { TemplateSavedIcon } from '../components/icons/TemplateSavedIcon'
import { useLocalAppData } from '../local/LocalAppDataProvider'

type SavedFilterKey = 'all' | 'saved'

export function TemplatesScreen() {
  const { data, createTemplate, updateTemplate, toggleTemplateSaved } = useLocalAppData()
  const [searchText, setSearchText] = useState('')
  const [activeSavedFilter, setActiveSavedFilter] = useState<SavedFilterKey>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const templates = data.templates ?? []

  const editingTemplate = useMemo(() => {
    if (!editingTemplateId) return null
    return templates.find((template) => template.id === editingTemplateId) ?? null
  }, [editingTemplateId, templates])

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase()
    return templates
      .filter((template) => (activeSavedFilter === 'saved' ? template.isSaved : true))
      .filter((template) => (normalizedQuery.length === 0 ? true : template.name.toLowerCase().includes(normalizedQuery)))
  }, [activeSavedFilter, searchText, templates])

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          {/* Page title */}
          <Text isSemibold style={styles.headerTitle}>
            Templates
          </Text>
          {/* Header actions */}
          <View style={styles.headerActions}>
            {/* Search input */}
            <View style={styles.searchInputContainer}>
              <SearchIcon color="#656565" size={18} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Zoek templates..."
                placeholderTextColor="#656565"
                style={[styles.searchInput, inputWebStyle]}
              />
            </View>
            <Pressable
              style={({ hovered }) => [styles.headerButton, styles.addButton, hovered ? styles.addButtonHovered : undefined]}
              onPress={() => setIsCreateModalOpen(true)}
            >
              {/* Create template */}
              <Text numberOfLines={1} isBold style={styles.addButtonText}>
                + Template maken
              </Text>
            </Pressable>
          </View>
        </View>
        {/* Template filters */}
        <View style={styles.filtersRow}>
          <FilterChip label="Alle templates" isSelected={activeSavedFilter === 'all'} onPress={() => setActiveSavedFilter('all')} />
          <FilterChip label="Opgeslagen" isSelected={activeSavedFilter === 'saved'} onPress={() => setActiveSavedFilter('saved')} />
        </View>
      </View>

      {/* Templates grid */}
      <View style={styles.gridArea}>
        <View style={styles.gridRow}>
          {visibleTemplates.map((template) => (
            <View key={template.id} style={styles.gridItem}>
              {(() => {
                const sections = Array.isArray(template.sections) ? template.sections : []
                const description = sections[0]?.description ?? ''
                return (
              <TemplateCard
                title={template.name}
                description={description}
                isSaved={template.isSaved}
                onPress={() => setEditingTemplateId(template.id)}
                onToggleSaved={() => toggleTemplateSaved(template.id)}
              />
                )
              })()}
            </View>
          ))}
        </View>
      </View>

      <TemplateEditModal
        visible={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(template) => {
          createTemplate(template)
          setIsCreateModalOpen(false)
        }}
      />

      <TemplateEditModal
        visible={editingTemplateId !== null}
        mode="edit"
        template={
          editingTemplate
            ? {
                name: editingTemplate.name,
                sections: editingTemplate.sections,
              }
            : undefined
        }
        onClose={() => setEditingTemplateId(null)}
        onSave={(template) => {
          if (!editingTemplateId) return
          updateTemplate(editingTemplateId, { name: template.name, sections: template.sections })
          setEditingTemplateId(null)
        }}
      />
    </View>
  )
}

type FilterChipProps = {
  label: string
  isSelected: boolean
  onPress: () => void
}

function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.filterChip,
        isSelected ? styles.filterChipSelected : styles.filterChipUnselected,
        hovered ? (isSelected ? styles.filterChipSelectedHovered : styles.filterChipHovered) : undefined,
      ]}
    >
      {/* Filter chip */}
      <Text isSemibold style={[styles.filterChipText, isSelected ? styles.filterChipTextSelected : styles.filterChipTextUnselected]}>
        {label}
      </Text>
    </Pressable>
  )
}

type TemplateCardProps = {
  title: string
  description: string
  isSaved: boolean
  onPress: () => void
  onToggleSaved: () => void
}

function TemplateCard({ title, description, isSaved, onPress, onToggleSaved }: TemplateCardProps) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.templateCard, hovered ? styles.templateCardHovered : undefined]}>
      {/* Template card */}
      <View style={styles.templateCardContent}>
        {/* Template header */}
        <View style={styles.templateCardHeader}>
          {/* Template title */}
          <Text isBold style={styles.templateCardTitle}>
            {title}
          </Text>
          <Pressable
            onPress={(event) => {
              ;(event as any)?.stopPropagation?.()
              onToggleSaved()
            }}
            style={({ hovered }) => [styles.templateCardSaveButton, hovered ? styles.templateCardSaveButtonHovered : undefined]}
          >
            {/* Template saved toggle */}
            {isSaved ? <TemplateSavedIcon color={colors.selected} size={22} /> : <TemplateNotSavedIcon color={colors.textStrong} size={22} />}
          </Pressable>
        </View>
        {/* Template description */}
        <Text style={styles.templateCardDescription}>{description}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  headerArea: {
    width: '100%',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchInputContainer: {
    width: 315,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  headerButton: {
    height: 40,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterChip: {
    height: 36,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
  },
  filterChipUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipHovered: {
    backgroundColor: colors.hoverBackground,
  },
  filterChipSelectedHovered: {
    backgroundColor: '#A50058',
  },
  filterChipText: {
    fontSize: 14,
    lineHeight: 18,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  filterChipTextUnselected: {
    color: colors.textStrong,
  },
  gridArea: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    ...( { width: 'min(360px, 100%)' } as any ),
    flexGrow: 1,
    flexBasis: 320,
  },
  templateCard: {
    width: '100%',
    minHeight: 140,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  templateCardHovered: {
    backgroundColor: colors.hoverBackground,
  },
  templateCardContent: {
    width: '100%',
    gap: 8,
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  templateCardSaveButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCardSaveButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  templateCardTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  templateCardDescription: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
})

