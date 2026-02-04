import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { AnimatedDropdownPanel } from '../AnimatedDropdownPanel'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { PlusIcon } from '../icons/PlusIcon'

type TemplateEditStep = 'details' | 'content'

export type TemplateEditModalCategoryOption = {
  key: string
  label: string
}

export type TemplateEditModalSection = {
  id: string
  title: string
  description: string
}

export type TemplateEditModalTemplate = {
  name: string
  categoryKey: string
  sections: TemplateEditModalSection[]
}

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  template?: TemplateEditModalTemplate
  categoryOptions: TemplateEditModalCategoryOption[]
  onClose: () => void
  onSave: (template: TemplateEditModalTemplate) => void
}

function createEmptyTemplate(categoryOptions: TemplateEditModalCategoryOption[]): TemplateEditModalTemplate {
  const firstCategoryKey = categoryOptions[0]?.key ?? 'overige'
  return {
    name: 'Custom template #1',
    categoryKey: firstCategoryKey,
    sections: [{ id: `section-${Date.now()}`, title: '', description: '' }],
  }
}

function getCategoryLabel(categoryOptions: TemplateEditModalCategoryOption[], categoryKey: string) {
  return categoryOptions.find((option) => option.key === categoryKey)?.label ?? ''
}

export function TemplateEditModal({ visible, mode, template, categoryOptions, onClose, onSave }: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const initialStep = mode === 'create' ? 'details' : 'content'

  const [step, setStep] = useState<TemplateEditStep>(initialStep)
  const [activeTemplate, setActiveTemplate] = useState<TemplateEditModalTemplate>(() => createEmptyTemplate(categoryOptions))
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)

  useEffect(() => {
    if (!visible) return
    setStep(initialStep)
    setIsCategoryPickerOpen(false)
    if (mode === 'edit' && template) {
      setActiveTemplate(template)
      return
    }
    setActiveTemplate(createEmptyTemplate(categoryOptions))
  }, [categoryOptions, initialStep, mode, template, visible])

  const isAnyDropdownOpen = isCategoryPickerOpen

  const categoryLabel = useMemo(() => getCategoryLabel(categoryOptions, activeTemplate.categoryKey), [activeTemplate.categoryKey, categoryOptions])

  if (!visible) return null

  const title = mode === 'edit' ? activeTemplate.name : 'Template maken'
  const primaryButtonLabel = mode === 'edit' ? 'Opslaan' : step === 'details' ? 'Doorgaan' : 'Toevoegen'

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
        {/* Modal header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Header icon placeholder */}
            <View style={styles.headerIcon}>
              <Text isBold style={styles.headerIconText}>
                1
              </Text>
            </View>
            {/* Header title */}
            <Text isBold style={styles.headerTitle}>
              {title}
            </Text>
          </View>
          <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
            {/* Close */}
            <ModalCloseDarkIcon />
          </Pressable>
        </View>

        {/* Modal body */}
        <View style={styles.body}>
          {isAnyDropdownOpen ? (
            <Pressable
              onPress={() => setIsCategoryPickerOpen(false)}
              style={styles.dropdownDismissOverlay}
            />
          ) : null}

          {/* Details form */}
          <View style={styles.formArea}>
            {mode === 'create' && step === 'details' ? (
              <View style={styles.formFields}>
                {/* Name field */}
                <View style={styles.field}>
                  {/* Field label */}
                  <Text style={styles.fieldLabel}>Naam</Text>
                  {/* Field input */}
                  <View style={styles.textField}>
                    <TextInput
                      value={activeTemplate.name}
                      onChangeText={(name) => setActiveTemplate((previousTemplate) => ({ ...previousTemplate, name }))}
                      placeholder="Custom template #1"
                      placeholderTextColor="#656565"
                      style={[styles.textFieldInput, inputWebStyle]}
                    />
                  </View>
                </View>

                {/* Category field */}
                <View style={styles.field}>
                  {/* Field label */}
                  <Text style={styles.fieldLabel}>Categorie</Text>
                  {/* Field input */}
                  <View style={[styles.dropdownArea, isCategoryPickerOpen ? styles.dropdownAreaRaised : undefined]}>
                    <Pressable
                      onPress={() => setIsCategoryPickerOpen((value) => !value)}
                      style={({ hovered }) => [styles.dropdownField, hovered ? styles.dropdownFieldHovered : undefined]}
                    >
                      {/* Dropdown field */}
                      <Text isSemibold style={styles.dropdownValueText}>
                        {categoryLabel}
                      </Text>
                      <View style={styles.dropdownSpacer} />
                      <ChevronDownIcon color={colors.textStrong} size={20} />
                    </Pressable>

                    <AnimatedDropdownPanel visible={isCategoryPickerOpen} style={styles.dropdownPanel}>
                      <ScrollView showsVerticalScrollIndicator={false} style={styles.dropdownScroll} contentContainerStyle={styles.dropdownScrollContent}>
                        {categoryOptions.map((option, index) => {
                          const isFirst = index === 0
                          const isLast = index === categoryOptions.length - 1
                          return (
                            <Pressable
                              key={option.key}
                              onPress={() => {
                                setActiveTemplate((previousTemplate) => ({ ...previousTemplate, categoryKey: option.key }))
                                setIsCategoryPickerOpen(false)
                              }}
                              style={({ hovered }) => [
                                styles.dropdownItem,
                                isFirst ? styles.dropdownItemTop : undefined,
                                isLast ? styles.dropdownItemBottom : undefined,
                                hovered ? styles.dropdownItemHovered : undefined,
                              ]}
                            >
                              {/* Dropdown item */}
                              <Text style={styles.dropdownItemText}>{option.label}</Text>
                            </Pressable>
                          )
                        })}
                      </ScrollView>
                    </AnimatedDropdownPanel>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Content editor */}
            {step === 'content' ? (
              <View style={styles.contentArea}>
                {/* Template name and category */}
                <View style={styles.contentHeaderFields}>
                  {/* Name field */}
                  <View style={styles.textField}>
                    <TextInput
                      value={activeTemplate.name}
                      onChangeText={(name) => setActiveTemplate((previousTemplate) => ({ ...previousTemplate, name }))}
                      placeholder="Template naam..."
                      placeholderTextColor="#656565"
                      style={[styles.textFieldInput, inputWebStyle]}
                    />
                  </View>

                  {/* Category field */}
                  <View style={[styles.dropdownArea, isCategoryPickerOpen ? styles.dropdownAreaRaised : undefined]}>
                    <Pressable
                      onPress={() => setIsCategoryPickerOpen((value) => !value)}
                      style={({ hovered }) => [styles.dropdownFieldSmall, hovered ? styles.dropdownFieldHovered : undefined]}
                    >
                      {/* Dropdown field */}
                      <Text isSemibold style={styles.dropdownValueText}>
                        {categoryLabel}
                      </Text>
                      <View style={styles.dropdownSpacer} />
                      <ChevronDownIcon color={colors.textStrong} size={20} />
                    </Pressable>

                    <AnimatedDropdownPanel visible={isCategoryPickerOpen} style={styles.dropdownPanelSmall}>
                      <ScrollView showsVerticalScrollIndicator={false} style={styles.dropdownScroll} contentContainerStyle={styles.dropdownScrollContent}>
                        {categoryOptions.map((option, index) => {
                          const isFirst = index === 0
                          const isLast = index === categoryOptions.length - 1
                          return (
                            <Pressable
                              key={option.key}
                              onPress={() => {
                                setActiveTemplate((previousTemplate) => ({ ...previousTemplate, categoryKey: option.key }))
                                setIsCategoryPickerOpen(false)
                              }}
                              style={({ hovered }) => [
                                styles.dropdownItem,
                                isFirst ? styles.dropdownItemTop : undefined,
                                isLast ? styles.dropdownItemBottom : undefined,
                                hovered ? styles.dropdownItemHovered : undefined,
                              ]}
                            >
                              {/* Dropdown item */}
                              <Text style={styles.dropdownItemText}>{option.label}</Text>
                            </Pressable>
                          )
                        })}
                      </ScrollView>
                    </AnimatedDropdownPanel>
                  </View>
                </View>

                {/* Sections */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.sectionsScroll} contentContainerStyle={styles.sectionsScrollContent}>
                  {activeTemplate.sections.map((section, index) => (
                    <View key={section.id} style={styles.sectionCard}>
                      {/* Section title */}
                      <TextInput
                        value={section.title}
                        onChangeText={(title) =>
                          setActiveTemplate((previousTemplate) => ({
                            ...previousTemplate,
                            sections: previousTemplate.sections.map((item) => (item.id === section.id ? { ...item, title } : item)),
                          }))
                        }
                        placeholder={`Onderdeel ${index + 1}...`}
                        placeholderTextColor="#656565"
                        style={[styles.sectionTitleInput, inputWebStyle]}
                      />
                      {/* Section description */}
                      <View style={styles.sectionTextArea}>
                        <TextInput
                          value={section.description}
                          onChangeText={(description) =>
                            setActiveTemplate((previousTemplate) => ({
                              ...previousTemplate,
                              sections: previousTemplate.sections.map((item) => (item.id === section.id ? { ...item, description } : item)),
                            }))
                          }
                          placeholder="Typ hier een duidelijke beschrijving..."
                          placeholderTextColor="#656565"
                          multiline
                          style={[styles.sectionDescriptionInput, inputWebStyle]}
                        />
                      </View>
                    </View>
                  ))}

                  <Pressable
                    onPress={() =>
                      setActiveTemplate((previousTemplate) => ({
                        ...previousTemplate,
                        sections: [...previousTemplate.sections, { id: `section-${Date.now()}`, title: '', description: '' }],
                      }))
                    }
                    style={({ hovered }) => [styles.addSectionRow, hovered ? styles.addSectionRowHovered : undefined]}
                  >
                    {/* Add section */}
                    <PlusIcon color={colors.textStrong} size={18} />
                    <Text style={styles.addSectionText}>Nieuw</Text>
                  </Pressable>
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>

        {/* Modal footer */}
        <View style={styles.footer}>
          <Pressable onPress={onClose} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
            {/* Cancel */}
            <Text isBold style={styles.secondaryButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (mode === 'create' && step === 'details') {
                setStep('content')
                return
              }
              onSave(activeTemplate)
            }}
            style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
          >
            {/* Primary */}
            <Text isBold style={styles.primaryButtonText}>
              {primaryButtonLabel}
            </Text>
          </Pressable>
        </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 1088,
    maxWidth: '90vw',
    ...( { height: 'min(720px, 90vh)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 88,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: '100%',
    flex: 1,
    padding: 24,
    ...( { overflow: 'hidden' } as any ),
  },
  dropdownDismissOverlay: {
    ...( { position: 'absolute', inset: 0, zIndex: 10 } as any ),
  },
  formArea: {
    flex: 1,
    width: '100%',
  },
  formFields: {
    width: '100%',
    gap: 24,
  },
  field: {
    width: '100%',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  textField: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    justifyContent: 'center',
  },
  textFieldInput: {
    width: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  dropdownArea: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  dropdownAreaRaised: {
    zIndex: 20,
  },
  dropdownField: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownFieldSmall: {
    width: 220,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownFieldHovered: {
    backgroundColor: colors.hoverBackground,
  },
  dropdownValueText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  dropdownSpacer: {
    flex: 1,
  },
  dropdownPanel: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 64,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' } as any ),
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownPanelSmall: {
    width: 220,
    position: 'absolute',
    left: 0,
    top: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' } as any ),
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownScroll: {
    width: '100%',
  },
  dropdownScrollContent: {
    gap: 0,
    padding: 0,
  },
  dropdownItem: {
    width: '100%',
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  dropdownItemTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dropdownItemBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  dropdownItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  dropdownItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    gap: 16,
  },
  contentHeaderFields: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionsScroll: {
    flex: 1,
    width: '100%',
  },
  sectionsScrollContent: {
    gap: 16,
    padding: 0,
  },
  sectionCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  sectionTitleInput: {
    width: '100%',
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  sectionTextArea: {
    width: '100%',
    minHeight: 92,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionDescriptionInput: {
    width: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    ...( { textAlignVertical: 'top' } as any ),
  },
  addSectionRow: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addSectionRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  addSectionText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  primaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

