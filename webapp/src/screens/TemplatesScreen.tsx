import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { TemplateEditModal, TemplateEditModalTemplate } from '../components/templates/TemplateEditModal'
import { SearchIcon } from '../components/icons/SearchIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'

type TemplateCategoryKey = 'loopbaancoach' | 'leefstijlcoach' | 'businesscoach' | 'budgetcoach' | 'overige'

type TemplateCategory = {
  key: TemplateCategoryKey
  label: string
  iconLabel: string
}

type Template = TemplateEditModalTemplate & {
  id: string
  categoryKey: TemplateCategoryKey
}

const templateCategories: TemplateCategory[] = [
  { key: 'loopbaancoach', label: 'Loopbaancoach', iconLabel: '1' },
  { key: 'leefstijlcoach', label: 'Leefstijlcoach', iconLabel: '2' },
  { key: 'businesscoach', label: 'Business coach', iconLabel: '3' },
  { key: 'budgetcoach', label: 'Budgetcoach', iconLabel: '4' },
  { key: 'overige', label: 'Overige', iconLabel: '5' },
]

const initialTemplates: Template[] = [
  {
    id: 'template-standaard',
    name: 'Standaard verslag',
    categoryKey: 'loopbaancoach',
    sections: [
      { id: 'section-1', title: 'Samenvatting', description: 'Een korte samenvatting van de sessie met de belangrijkste punten die relevant zijn voor een loopbaan coach.' },
      { id: 'section-2', title: 'Bulletpoints', description: 'Bulletpoints zodat je in 1 oogopslag kan zien wat de belangrijkste punten zijn' },
      { id: 'section-3', title: 'Actiepunten', description: 'De belangrijkste actiepunten op een rij.' },
    ],
  },
  {
    id: 'template-soap',
    name: 'SOAP',
    categoryKey: 'loopbaancoach',
    sections: [{ id: 'section-1', title: 'SOAP', description: 'Subjective, Objective, Assesment and Plan.' }],
  },
  {
    id: 'template-intake',
    name: 'Intake',
    categoryKey: 'loopbaancoach',
    sections: [{ id: 'section-1', title: 'Intake', description: 'Automatische antwoorden op standaard intake vragen zoals hulpvraag, achtergrond en verwachtingen' }],
  },
]

export function TemplatesScreen() {
  const [activeCategoryKey, setActiveCategoryKey] = useState<TemplateCategoryKey>('loopbaancoach')
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [searchText, setSearchText] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const editingTemplate = useMemo(() => {
    if (!editingTemplateId) return null
    return templates.find((template) => template.id === editingTemplateId) ?? null
  }, [editingTemplateId, templates])

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase()
    return templates
      .filter((template) => template.categoryKey === activeCategoryKey)
      .filter((template) => (normalizedQuery.length === 0 ? true : template.name.toLowerCase().includes(normalizedQuery)))
  }, [activeCategoryKey, searchText, templates])

  return (
    <View style={styles.container}>
      {/* Page header */}
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

      {/* Category tabs */}
      <View style={styles.categoryTabsRow}>
        {templateCategories.map((category) => {
          const isSelected = category.key === activeCategoryKey
          return (
            <Pressable
              key={category.key}
              onPress={() => setActiveCategoryKey(category.key)}
              style={({ hovered }) => [
                styles.categoryTab,
                isSelected ? styles.categoryTabSelected : styles.categoryTabUnselected,
                hovered && !isSelected ? styles.categoryTabHovered : undefined,
              ]}
            >
              {/* Category tab */}
              <View style={styles.categoryTabContent}>
                {/* Category icon placeholder */}
                <View style={[styles.categoryIcon, isSelected ? styles.categoryIconSelected : styles.categoryIconUnselected]}>
                  <Text isBold style={[styles.categoryIconText, isSelected ? styles.categoryIconTextSelected : styles.categoryIconTextUnselected]}>
                    {category.iconLabel}
                  </Text>
                </View>
                {/* Category label */}
                <Text isBold style={[styles.categoryLabel, isSelected ? styles.categoryLabelSelected : styles.categoryLabelUnselected]}>
                  {category.label}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {/* Templates grid */}
      <View style={styles.gridArea}>
        <View style={styles.gridRow}>
          {visibleTemplates.map((template) => (
            <View key={template.id} style={styles.gridItem}>
              <TemplateCard
                title={template.name}
                description={template.sections[0]?.description ?? ''}
                onPress={() => setEditingTemplateId(template.id)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Beta message */}
      <View style={styles.betaArea}>
        <Text isBold style={styles.betaText}>
          Templates zit nog in de Beta versie,{'\n'}lijkt het je leuk om input te geven? neem contact op!
        </Text>
        <Pressable style={({ hovered }) => [styles.contactButton, hovered ? styles.contactButtonHovered : undefined]} onPress={() => undefined}>
          {/* Contact button */}
          <Text isBold style={styles.contactButtonText}>
            Contact
          </Text>
        </Pressable>
      </View>

      <TemplateEditModal
        visible={isCreateModalOpen}
        mode="create"
        categoryOptions={templateCategories.map((category) => ({ key: category.key, label: category.label }))}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(template) => {
          const id = `template-${Date.now()}`
          setTemplates((previousTemplates) => [
            ...previousTemplates,
            { ...template, id, categoryKey: template.categoryKey as TemplateCategoryKey },
          ])
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
                categoryKey: editingTemplate.categoryKey,
                sections: editingTemplate.sections,
              }
            : undefined
        }
        categoryOptions={templateCategories.map((category) => ({ key: category.key, label: category.label }))}
        onClose={() => setEditingTemplateId(null)}
        onSave={(template) => {
          if (!editingTemplateId) return
          setTemplates((previousTemplates) =>
            previousTemplates.map((item) =>
              item.id === editingTemplateId
                ? { ...item, name: template.name, categoryKey: template.categoryKey as TemplateCategoryKey, sections: template.sections }
                : item,
            ),
          )
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

function TemplateCard({ title, description, onPress }: TemplateCardProps) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.templateCard, hovered ? styles.templateCardHovered : undefined]}>
      {/* Template card */}
      <View style={styles.templateCardContent}>
        {/* Template title */}
        <Text isBold style={styles.templateCardTitle}>
          {title}
        </Text>
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
  categoryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTab: {
    height: 40,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabSelected: {
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
  },
  categoryTabUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabHovered: {
    backgroundColor: colors.hoverBackground,
  },
  categoryTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconSelected: {
    backgroundColor: '#FFFFFF',
  },
  categoryIconUnselected: {
    backgroundColor: '#FFE5F6',
  },
  categoryIconText: {
    fontSize: 12,
    lineHeight: 14,
  },
  categoryIconTextSelected: {
    color: colors.selected,
  },
  categoryIconTextUnselected: {
    color: colors.selected,
  },
  categoryLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },
  categoryLabelUnselected: {
    color: colors.selected,
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
  betaArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  betaText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.selected,
    textAlign: 'center',
  },
  contactButton: {
    height: 40,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  contactButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  contactButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
})
