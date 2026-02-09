import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { PlusIcon } from '../icons/PlusIcon'
import { TemplateEditIcon } from '../icons/TemplateEditIcon'

type TemplateEditStep = 'details' | 'content'

export type TemplateEditModalSection = {
  id: string
  title: string
  description: string
}

export type TemplateEditModalTemplate = {
  name: string
  sections: TemplateEditModalSection[]
}

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  template?: TemplateEditModalTemplate
  onClose: () => void
  onSave: (template: TemplateEditModalTemplate) => void
}

function createEmptyTemplate(): TemplateEditModalTemplate {
  return {
    name: 'Custom template #1',
    sections: [{ id: `section-${Date.now()}`, title: '', description: '' }],
  }
}

export function TemplateEditModal({ visible, mode, template, onClose, onSave }: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const initialStep = mode === 'create' ? 'details' : 'content'

  const [step, setStep] = useState<TemplateEditStep>(initialStep)
  const [activeTemplate, setActiveTemplate] = useState<TemplateEditModalTemplate>(() => createEmptyTemplate())

  useEffect(() => {
    if (!visible) return
    setStep(initialStep)
    if (mode === 'edit' && template) {
      setActiveTemplate(template)
      return
    }
    setActiveTemplate(createEmptyTemplate())
  }, [initialStep, mode, template, visible])

  if (!visible) return null

  const title = mode === 'edit' ? activeTemplate.name : 'Template maken'
  const primaryButtonLabel = mode === 'edit' ? 'Opslaan' : step === 'details' ? 'Doorgaan' : 'Toevoegen'

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
        {/* Modal header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Header icon */}
            <View style={styles.headerIcon}>
              <TemplateEditIcon color={colors.selected} size={20} />
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
              </View>
            ) : null}

            {/* Content editor */}
            {step === 'content' ? (
              <View style={styles.contentArea}>
                {/* Template header fields */}
                <View style={styles.compactFieldsRow}>
                  {/* Template name */}
                  <View style={styles.compactField}>
                    <TextInput
                      value={activeTemplate.name}
                      onChangeText={(name) => setActiveTemplate((previousTemplate) => ({ ...previousTemplate, name }))}
                      placeholder="Template naam..."
                      placeholderTextColor="#656565"
                      style={[styles.compactFieldInput, inputWebStyle]}
                    />
                  </View>
                </View>

                {/* Sections */}
                <ScrollView showsVerticalScrollIndicator style={styles.sectionsScroll} contentContainerStyle={styles.sectionsScrollContent}>
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
    backgroundColor: colors.pageBackground,
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
  compactFieldsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  compactField: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'center',
  },
  compactFieldInput: {
    width: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    gap: 16,
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
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
  },
  sectionDescriptionInput: {
    width: '100%',
    flex: 1,
    padding: 16,
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

