import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { PlusIcon } from '../components/icons/PlusIcon'
import { SearchIcon } from '../components/icons/SearchIcon'
import { TemplateSavedIcon } from '../components/icons/TemplateSavedIcon'
import { TemplatesIcon } from '../components/icons/TemplatesIcon'
import { ConfirmTemplateDeleteModal } from '../components/templates/ConfirmTemplateDeleteModal'
import { TemplateEditModal } from '../components/templates/TemplateEditModal'
import { Text } from '../components/Text'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { webTransitionSmooth } from '../theme/webTransitions'
import { TemplateNotSavedIcon } from '../components/icons/TemplateNotSavedIcon'

type SavedFilterKey = 'all' | 'saved'

// Renders the templates overview, filters, and create/edit/delete modal flows.
export function TemplatesScreen() {
  const { width: windowWidth } = useWindowDimensions()
  const { data, createTemplate, updateTemplate, deleteTemplate, toggleTemplateSaved } = useLocalAppData()
  const [searchText, setSearchText] = useState('')
  const [activeSavedFilter, setActiveSavedFilter] = useState<SavedFilterKey>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<TextInput | null>(null)

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const templates = data.templates ?? []
  const isSearchExpanded = isSearchOpen || searchText.trim().length > 0
  const isCompactHeader = windowWidth <= 820
  const compactSearchExpandedWidth = Math.min(240, Math.max(140, windowWidth - 380))
  const expandedSearchWidth = isCompactHeader ? compactSearchExpandedWidth : 315

  const editingTemplate = useMemo(() => {
    if (!editingTemplateId) return null
    return templates.find((template) => template.id === editingTemplateId) ?? null
  }, [editingTemplateId, templates])

  const pendingDeleteTemplate = useMemo(() => {
    if (!pendingDeleteTemplateId) return null
    return templates.find((template) => template.id === pendingDeleteTemplateId) ?? null
  }, [pendingDeleteTemplateId, templates])

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase()
    return templates
      .filter((template) => (activeSavedFilter === 'saved' ? template.isSaved : true))
      .filter((template) => {
        if (normalizedQuery.length === 0) return true
        return template.name.toLowerCase().includes(normalizedQuery) || template.description.toLowerCase().includes(normalizedQuery)
      })
  }, [activeSavedFilter, searchText, templates])
  const hasSearchQuery = searchText.trim().length > 0
  const isSavedFilter = activeSavedFilter === 'saved'
  const emptyTemplatesText = hasSearchQuery
    ? 'Geen templates gevonden.'
    : isSavedFilter
      ? 'Er zijn nog geen opgeslagen templates.'
      : 'Er zijn nog geen templates.'

  useEffect(() => {
    if (!isSearchOpen) return
    const id = setTimeout(() => searchInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [isSearchOpen])

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          {isCompactHeader ? null : (
            <Text isSemibold style={styles.headerTitle}>
              Templates
            </Text>
          )}
          <View style={[styles.headerActions, isCompactHeader ? styles.headerActionsCompact : undefined]}>
            {isCompactHeader ? (
              <Text isSemibold style={styles.headerTitle}>
                Templates
              </Text>
            ) : null}
            <AnimatedWidthContainer width={isSearchExpanded ? expandedSearchWidth : 138} style={styles.searchWidthContainer}>
              {isSearchExpanded ? (
                <View style={styles.searchInputContainer}>
                  <SearchIcon color="#656565" size={18} />
                  <TextInput
                    ref={searchInputRef}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Zoek templates..."
                    placeholderTextColor="#656565"
                    onBlur={() => setIsSearchOpen(false)}
                    style={[styles.searchInput, inputWebStyle]}
                  />
                </View>
              ) : (
                <Pressable onPress={() => setIsSearchOpen(true)} style={({ hovered }) => [styles.searchInputContainer, hovered ? styles.searchInputContainerHovered : undefined]}>
                  <SearchIcon color="#656565" size={18} />
                  <Text style={styles.searchCollapsedText}>
                    Zoeken
                  </Text>
                </Pressable>
              )}
            </AnimatedWidthContainer>
            <Pressable
              style={({ hovered }) => [styles.addButton, webTransitionSmooth, hovered ? styles.addButtonHovered : undefined]}
              onPress={() => setIsCreateModalOpen(true)}
            >
              <PlusIcon color="#FFFFFF" size={22} />
              <Text numberOfLines={1} style={styles.addButtonText}>
                Template maken
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.tabsRow, styles.tabsRowWeb]}>
          <TabButton
            label="Alle templates"
            isSelected={activeSavedFilter === 'all'}
            icon={(color) => <TemplatesIcon color={color} size={18} />}
            onPress={() => setActiveSavedFilter('all')}
          />
          <TabButton
            label="Opgeslagen"
            isSelected={activeSavedFilter === 'saved'}
            icon={(color) => <TemplateSavedIcon color={color} size={18} />}
            onPress={() => setActiveSavedFilter('saved')}
          />
        </View>
      </View>

      <View style={styles.gridArea}>
        <AnimatedMainContent contentKey={activeSavedFilter}>
          {visibleTemplates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{emptyTemplatesText}</Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {visibleTemplates.map((template) => (
                <View key={template.id} style={styles.gridItem}>
                  <TemplateCard
                    title={template.name}
                    description={template.description}
                    isSaved={template.isSaved}
                    onPress={() => setEditingTemplateId(template.id)}
                    onToggleSaved={() => toggleTemplateSaved(template.id)}
                  />
                </View>
              ))}
            </View>
          )}
        </AnimatedMainContent>
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
                description: editingTemplate.description,
                sections: editingTemplate.sections,
              }
            : undefined
        }
        onClose={() => setEditingTemplateId(null)}
        onDelete={() => {
          if (!editingTemplateId) return
          setPendingDeleteTemplateId(editingTemplateId)
        }}
        onSave={(template) => {
          if (!editingTemplateId) return
          updateTemplate(editingTemplateId, {
            name: template.name,
            description: template.description,
            sections: template.sections,
          })
          setEditingTemplateId(null)
        }}
      />

      <ConfirmTemplateDeleteModal
        visible={Boolean(pendingDeleteTemplateId)}
        templateName={pendingDeleteTemplate?.name ?? null}
        onClose={() => setPendingDeleteTemplateId(null)}
        onConfirm={() => {
          if (!pendingDeleteTemplateId) return
          deleteTemplate(pendingDeleteTemplateId)
          setPendingDeleteTemplateId(null)
          setEditingTemplateId(null)
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

// Renders one template-filter tab button.
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
      <View style={styles.tabButtonContent}>
        {icon(iconColor)}
        <Text isSemibold style={[styles.tabButtonText, { color: textColor }]}>
          {label}
        </Text>
      </View>
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

// Renders one template preview card in the grid.
function TemplateCard({ title, description, isSaved, onPress, onToggleSaved }: TemplateCardProps) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.templateCard, hovered ? styles.templateCardHovered : undefined]}>
      <View style={styles.templateCardContent}>
        <View style={styles.templateCardHeader}>
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
            {isSaved ? <TemplateSavedIcon color={colors.selected} size={22} /> : <TemplateNotSavedIcon color={colors.textStrong} size={22} />}
          </Pressable>
        </View>
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
    flexWrap: 'wrap',
    gap: 12,
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
  searchWidthContainer: {
    height: 40,
  },
  searchInputContainer: {
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
  searchInputContainerHovered: {
    backgroundColor: colors.hoverBackground,
  },
  searchCollapsedText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyRegular,
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
  tabsRow: {
    width: 460,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabsRowWeb: {
    ...( { overflowX: 'auto', overflowY: 'hidden' } as any ),
    ...( { scrollbarWidth: 'none' } as any ),
    ...( { msOverflowStyle: 'none' } as any ),
  },
  tabButton: {
    flex: 1,
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
  tabButtonText: {
    fontSize: 14,
    lineHeight: 18,
  },
  gridArea: {
    flex: 1,
  },
  emptyState: {
    width: '100%',
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
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: 320,
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
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
    flex: 1,
  },
  templateCardDescription: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
})
