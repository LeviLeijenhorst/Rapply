import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { AnimatedDropdownPanel } from '../components/AnimatedDropdownPanel'
import { AnimatedWidthContainer } from '../components/AnimatedWidthContainer'
import { PlusIcon } from '../components/icons/PlusIcon'
import { SearchIcon } from '../components/icons/SearchIcon'
import { CalendlyModal } from '../components/templates/CalendlyModal'
import { ConfirmTemplateDeleteModal } from '../components/templates/ConfirmTemplateDeleteModal'
import { TemplateEditModal, type TemplateEditModalTemplate } from '../components/templates/TemplateEditModal'
import { Text } from '../components/Text'
import { WebPortal } from '../components/WebPortal'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { TemplateCategory } from '../local/types'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { webTransitionSmooth } from '../theme/webTransitions'
import { parseRichTextMarkdown } from '../utils/richTextFormatting'
import { isGespreksverslagTemplate } from '../utils/templateCategories'

type SavedFilterKey = 'all' | 'saved'

function getTemplateDisplayName(name: string): string {
  const normalized = name.trim().toLowerCase()
  if (normalized === 'voortgangsgespreksverslag') return 'Voortgangsgesprek'
  if (normalized === 'intake' || normalized === 'intakeverslag') return 'Intake'
  return name
}

function createTemplateDraftForCategory(category: TemplateCategory): TemplateEditModalTemplate {
  const sectionId = `section-${Date.now()}`
  if (category === 'gespreksverslag') {
    return {
      name: 'Nieuw gespreksverslag',
      description: '',
      sections: [{ id: sectionId, title: '', description: '' }],
    }
  }
  return {
    name: 'Nieuw verslag',
    description: '',
    sections: [{ id: sectionId, title: '', description: '' }],
  }
}

// Renders the templates overview, filters, and create/edit/delete modal flows.
export function TemplatesScreen() {
  const { width: windowWidth } = useWindowDimensions()
  const { data, createTemplate, updateTemplate, deleteTemplate } = useLocalAppData()
  const [searchText, setSearchText] = useState('')
  const [activeSavedFilter, setActiveSavedFilter] = useState<SavedFilterKey>('all')
  const [createTemplateCategory, setCreateTemplateCategory] = useState<TemplateCategory | null>(null)
  const [createTemplateDraft, setCreateTemplateDraft] = useState<TemplateEditModalTemplate | null>(null)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<string | null>(null)
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [createMenuAnchor, setCreateMenuAnchor] = useState<{ left: number; top: number; width: number } | null>(null)
  const searchInputRef = useRef<TextInput | null>(null)
  const createButtonRef = useRef<any>(null)

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const templates = data.templates ?? []
  const isSearchExpanded = isSearchOpen || searchText.trim().length > 0
  const isCompactHeader = windowWidth <= 820
  const compactSearchExpandedWidth = Math.min(240, Math.max(140, windowWidth - 380))
  const expandedSearchWidth = isCompactHeader ? compactSearchExpandedWidth : 315
  const calendlyUrl = process.env.EXPO_PUBLIC_CALENDLY_URL || 'https://calendly.com'

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
        const normalizedDisplayName = getTemplateDisplayName(template.name).toLowerCase()
        return (
          template.name.toLowerCase().includes(normalizedQuery) ||
          normalizedDisplayName.includes(normalizedQuery) ||
          template.description.toLowerCase().includes(normalizedQuery)
        )
      })
  }, [activeSavedFilter, searchText, templates])
  const visibleConversationTemplates = useMemo(
    () => visibleTemplates.filter((template) => isGespreksverslagTemplate(template)),
    [visibleTemplates],
  )
  const visibleOtherTemplates = useMemo(
    () => visibleTemplates.filter((template) => !isGespreksverslagTemplate(template)),
    [visibleTemplates],
  )
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

  useEffect(() => {
    if (!isCreateMenuOpen) return
    if (typeof window === 'undefined') return

    const updateCreateMenuAnchor = () => {
      const rect = createButtonRef.current?.getBoundingClientRect?.()
      if (!rect) return
      const menuWidth = Math.max(230, rect.width)
      setCreateMenuAnchor({
        left: rect.right - menuWidth,
        top: rect.bottom + 8,
        width: menuWidth,
      })
    }

    updateCreateMenuAnchor()
    window.addEventListener('resize', updateCreateMenuAnchor)
    window.addEventListener('scroll', updateCreateMenuAnchor, true)
    return () => {
      window.removeEventListener('resize', updateCreateMenuAnchor)
      window.removeEventListener('scroll', updateCreateMenuAnchor, true)
    }
  }, [isCreateMenuOpen])

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
              ref={createButtonRef}
              style={({ hovered }) => [styles.addButton, webTransitionSmooth, hovered ? styles.addButtonHovered : undefined]}
              onPress={() => setIsCreateMenuOpen((previous) => !previous)}
            >
              <PlusIcon color="#FFFFFF" size={22} />
              <Text numberOfLines={1} style={styles.addButtonText}>
                Template maken
              </Text>
            </Pressable>
            {/* <Pressable
              style={({ hovered }) => [styles.bookCallButton, webTransitionSmooth, hovered ? styles.bookCallButtonHovered : undefined]}
              onPress={() => setIsCalendlyModalOpen(true)}
            >
              <Text numberOfLines={1} style={styles.bookCallButtonText}>
                Laat ons een template maken
              </Text>
            </Pressable> */}
          </View>
        </View>

        {/* <View style={[styles.tabsRow, styles.tabsRowWeb]}>
          <TabButton
            label=""
            isSelected={activeSavedFilter === 'all'}
            icon={(color) => <TemplatesIcon color={color} size={18} />}
            onPress={() => setActiveSavedFilter('all')}
          />
          <TabButton
            label=""
            isSelected={activeSavedFilter === 'saved'}
            icon={(color) => <TemplateSavedIcon color={color} size={18} />}
            onPress={() => setActiveSavedFilter('saved')}
          />
        </View> */}
      </View>

      {isCreateMenuOpen && createMenuAnchor ? (
        <WebPortal>
          <View style={styles.createMenuLayer as any}>
            <Pressable style={styles.createMenuBackdrop as any} onPress={() => setIsCreateMenuOpen(false)} />
            <AnimatedDropdownPanel
              visible={isCreateMenuOpen}
              style={[
                styles.createMenu,
                {
                  left: createMenuAnchor.left,
                  top: createMenuAnchor.top,
                  width: createMenuAnchor.width,
                } as any,
              ]}
            >
              <Pressable
                onPress={() => {
                  setCreateTemplateCategory('gespreksverslag')
                  setCreateTemplateDraft(createTemplateDraftForCategory('gespreksverslag'))
                  setIsCreateMenuOpen(false)
                }}
                style={({ hovered }) => [styles.createMenuItem, hovered ? styles.createMenuItemHovered : undefined]}
              >
                <Text style={styles.createMenuItemText}>Gespreksverslag</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCreateTemplateCategory('ander-verslag')
                  setCreateTemplateDraft(createTemplateDraftForCategory('ander-verslag'))
                  setIsCreateMenuOpen(false)
                }}
                style={({ hovered }) => [styles.createMenuItem, hovered ? styles.createMenuItemHovered : undefined]}
              >
                <Text style={styles.createMenuItemText}>Ander verslag</Text>
              </Pressable>
            </AnimatedDropdownPanel>
          </View>
        </WebPortal>
      ) : null}

      <View style={styles.gridArea}>
        <AnimatedMainContent contentKey={activeSavedFilter}>
          {visibleTemplates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{emptyTemplatesText}</Text>
            </View>
          ) : (
            <View style={styles.sectionsContainer}>
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text isSemibold style={styles.sectionTitle}>
                    Templates voor gespreksverslagen
                  </Text>
                  <Pressable
                    onPress={() => {
                      setCreateTemplateCategory('gespreksverslag')
                      setCreateTemplateDraft(createTemplateDraftForCategory('gespreksverslag'))
                    }}
                    style={({ hovered }) => [styles.sectionCreateIconButton, hovered ? styles.sectionCreateIconButtonHovered : undefined]}
                  >
                    <PlusIcon color={colors.textStrong} size={16} />
                  </Pressable>
                </View>
                {visibleConversationTemplates.length === 0 ? (
                  <Text style={styles.sectionEmptyText}>Geen gespreksverslagen gevonden.</Text>
                ) : (
                  <View style={styles.gridRow}>
                    {visibleConversationTemplates.map((template) => (
                      <View key={template.id} style={styles.gridItem}>
                        <TemplateCard
                          title={getTemplateDisplayName(template.name)}
                          description={template.description}
                          onPress={() => setEditingTemplateId(template.id)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text isSemibold style={styles.sectionTitle}>
                    Templates voor andere verslagen
                  </Text>
                  <Pressable
                    onPress={() => {
                      setCreateTemplateCategory('ander-verslag')
                      setCreateTemplateDraft(createTemplateDraftForCategory('ander-verslag'))
                    }}
                    style={({ hovered }) => [styles.sectionCreateIconButton, hovered ? styles.sectionCreateIconButtonHovered : undefined]}
                  >
                    <PlusIcon color={colors.textStrong} size={16} />
                  </Pressable>
                </View>
                {visibleOtherTemplates.length === 0 ? (
                  <Text style={styles.sectionEmptyText}>Geen andere verslagen gevonden.</Text>
                ) : (
                  <View style={styles.gridRow}>
                    {visibleOtherTemplates.map((template) => (
                      <View key={template.id} style={styles.gridItem}>
                        <TemplateCard
                          title={getTemplateDisplayName(template.name)}
                          description={template.description}
                          onPress={() => setEditingTemplateId(template.id)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </AnimatedMainContent>
      </View>

      <TemplateEditModal
        visible={Boolean(createTemplateCategory && createTemplateDraft)}
        mode="create"
        template={createTemplateDraft ?? undefined}
        onClose={() => {
          setCreateTemplateCategory(null)
          setCreateTemplateDraft(null)
          setIsCreateMenuOpen(false)
        }}
        onSave={(template) => {
          if (!createTemplateCategory) return
          createTemplate({ ...template, category: createTemplateCategory })
          setCreateTemplateCategory(null)
          setCreateTemplateDraft(null)
        }}
      />

      <TemplateEditModal
        visible={editingTemplateId !== null}
        mode="edit"
        readOnly={Boolean(editingTemplate?.isDefault)}
        template={
          editingTemplate
            ? {
                name: editingTemplate.isDefault ? getTemplateDisplayName(editingTemplate.name) : editingTemplate.name,
                description: editingTemplate.description,
                sections: editingTemplate.sections,
              }
            : undefined
        }
        onClose={() => setEditingTemplateId(null)}
        onDelete={
          editingTemplate?.isDefault
            ? undefined
            : () => {
                if (!editingTemplateId) return
                setPendingDeleteTemplateId(editingTemplateId)
              }
        }
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
      <CalendlyModal visible={isCalendlyModalOpen} onClose={() => setIsCalendlyModalOpen(false)} calendlyUrl={calendlyUrl} />

      <ConfirmTemplateDeleteModal
        visible={Boolean(pendingDeleteTemplateId)}
        templateName={pendingDeleteTemplate ? getTemplateDisplayName(pendingDeleteTemplate.name) : null}
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

type TemplateCardProps = {
  title: string
  description: string
  onPress: () => void
}

function getTemplateDescriptionPreview(description: string): string {
  const lines = parseRichTextMarkdown(description)
  const plain = lines
    .map((line) => ('text' in line ? line.text.trim() : ''))
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain || 'Geen beschrijving beschikbaar.'
}

// Renders one template preview card in the grid.
function TemplateCard({ title, description, onPress }: TemplateCardProps) {
  const preview = getTemplateDescriptionPreview(description)
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.templateCard, hovered ? styles.templateCardHovered : undefined]}>
      <View style={styles.templateCardContent}>
        <Text isBold style={styles.templateCardTitle}>
          {title}
        </Text>
        <Text numberOfLines={3} style={styles.templateCardDescription}>
          {preview}
        </Text>
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
  createMenu: {
    position: 'fixed',
    minWidth: 230,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 4,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 10001 } as any ),
  },
  createMenuLayer: {
    ...( { position: 'fixed', inset: 0, zIndex: 10000 } as any ),
  },
  createMenuBackdrop: {
    ...( { position: 'absolute', inset: 0 } as any ),
  },
  createMenuItem: {
    height: 38,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  createMenuItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  createMenuItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  bookCallButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCallButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  bookCallButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
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
  sectionsContainer: {
    width: '100%',
    gap: 22,
  },
  sectionBlock: {
    width: '100%',
    gap: 12,
  },
  sectionHeaderRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  sectionCreateIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCreateIconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  sectionEmptyText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
    paddingHorizontal: 2,
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
    width: '100%',
    justifyContent: 'flex-start',
    gap: 16,
  },
  gridItem: {
    width: '32%',
    minWidth: 0,
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
