import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { colors } from '../../design/theme/colors'
import { Text } from '../../ui/Text'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'
import { PlusIcon } from '../../icons/PlusIcon'
import { TemplateEditIcon } from '../../icons/TemplateEditIcon'
import { TrashIcon } from '../../icons/TrashIcon'
import { ConfirmDeleteDialog } from '../../foundation/ui/modals/ConfirmDeleteDialog'
import { RichTextInlineSegment, parseRichTextMarkdown, richTextSharedFormatting } from '../../utils/richTextFormatting'

export type TemplateEditModalSection = {
  id: string
  title: string
  description: string
}

export type TemplateEditModalTemplate = {
  name: string
  description: string
  sections: TemplateEditModalSection[]
}

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  template?: TemplateEditModalTemplate
  readOnly?: boolean
  onClose: () => void
  onSave: (template: TemplateEditModalTemplate) => void
  onDelete?: () => void
}

function renderInlineSegments(segments: RichTextInlineSegment[], textStyle: any) {
  return (
    <Text style={textStyle}>
      {segments.map((segment, index) => (
        <Text key={`${segment.text}-${index}`} isBold={segment.isBold} style={segment.isItalic ? styles.italicText : undefined}>
          {segment.text}
        </Text>
      ))}
    </Text>
  )
}

// Creates the default template draft used when opening the create flow.
function createEmptyTemplate(): TemplateEditModalTemplate {
  return {
    name: 'Nieuw formulier',
    description: '',
    sections: [{ id: `section-${Date.now()}`, title: '', description: '' }],
  }
}

// Renders the template editor modal for create/edit, including section management.
export function TemplateEditModal({ visible, mode, template, readOnly = false, onClose, onSave, onDelete }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const [activeTemplate, setActiveTemplate] = useState<TemplateEditModalTemplate>(() => createEmptyTemplate())
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null)
  const [hoveredDeleteSectionId, setHoveredDeleteSectionId] = useState<string | null>(null)
  const [pendingDeleteSectionId, setPendingDeleteSectionId] = useState<string | null>(null)
  const isCompactFooter = windowWidth <= 640
  const readOnlyLines = parseRichTextMarkdown(activeTemplate.description || '')

  useEffect(() => {
    if (!visible) return
    setPendingDeleteSectionId(null)
    if (template) {
      setActiveTemplate(template)
      return
    }
    setActiveTemplate(createEmptyTemplate())
  }, [mode, template, visible])

  if (!visible) return null

  const isReadOnly = mode === 'edit' && readOnly
  const title = mode === 'edit' ? activeTemplate.name : 'Formulier maken'
  const primaryButtonLabel = mode === 'edit' ? 'Opslaan' : 'Toevoegen'

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <TemplateEditIcon color={colors.selected} size={20} />
          </View>
          <Text isBold style={styles.headerTitle}>
            {title}
          </Text>
        </View>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator style={styles.sectionsScroll} contentContainerStyle={styles.sectionsScrollContent}>
          {isReadOnly ? (
            <View style={styles.readOnlyContent}>
              {readOnlyLines.length === 0 ? <Text style={styles.readOnlyDescriptionText}>Geen beschrijving beschikbaar voor dit standaardformulier.</Text> : null}
              {readOnlyLines.map((line, index) => {
                if (line.kind === 'empty') return <View key={`empty-${index}`} style={styles.readOnlyEmptyRow} />
                if (line.kind === 'divider') return <View key={`divider-${index}`} style={styles.readOnlyDivider} />
                if (line.kind === 'headingTwo' || line.kind === 'headingThree') return <View key={`heading-${index}`}>{renderInlineSegments(line.segments, styles.readOnlyHeading)}</View>
                if (line.kind === 'bullet') {
                  return (
                    <View key={`bullet-${index}`} style={styles.readOnlyBulletRow}>
                      <View style={styles.readOnlyBulletDot} />
                      <View style={styles.readOnlyBulletTextContainer}>{renderInlineSegments(line.segments, styles.readOnlyBulletText)}</View>
                    </View>
                  )
                }
                if (line.kind === 'numbered') {
                  return (
                    <View key={`numbered-${index}`} style={styles.readOnlyBulletRow}>
                      <Text style={styles.readOnlyBulletNumber}>{`${line.number}.`}</Text>
                      <View style={styles.readOnlyBulletTextContainer}>{renderInlineSegments(line.segments, styles.readOnlyBulletText)}</View>
                    </View>
                  )
                }
                if (line.kind === 'quote') return <View key={`quote-${index}`} style={styles.readOnlyQuoteRow}>{renderInlineSegments(line.segments, styles.readOnlyQuoteText)}</View>
                return <View key={`paragraph-${index}`}>{renderInlineSegments(line.segments, styles.readOnlyDescriptionText)}</View>
              })}
            </View>
          ) : null}
          {isReadOnly ? null : (
            <>
              <View style={styles.formFields}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Naam</Text>
                  <View style={styles.textField}>
                    <TextInput
                      value={activeTemplate.name}
                      onChangeText={(name) => setActiveTemplate((previousTemplate) => ({ ...previousTemplate, name }))}
                      placeholder="Formuliernaam..."
                      placeholderTextColor="#656565"
                      editable={!isReadOnly}
                      style={[styles.textFieldInput, inputWebStyle]}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Beschrijving</Text>
                  <View style={styles.textField}>
                    <TextInput
                      value={activeTemplate.description}
                      onChangeText={(description) => setActiveTemplate((previousTemplate) => ({ ...previousTemplate, description }))}
                      placeholder="Korte beschrijving van dit formulier..."
                      placeholderTextColor="#656565"
                      editable={!isReadOnly}
                      style={[styles.textFieldInput, inputWebStyle]}
                    />
                  </View>
                </View>
              </View>

              {activeTemplate.sections.map((section, index) => (
                <Pressable
                  key={section.id}
                  onHoverIn={() => setHoveredSectionId(section.id)}
                  onHoverOut={() => setHoveredSectionId((current) => (current === section.id ? null : current))}
                  style={styles.sectionCard}
                >
                  <Pressable
                    onHoverIn={() => setHoveredDeleteSectionId(section.id)}
                    onHoverOut={() => setHoveredDeleteSectionId((current) => (current === section.id ? null : current))}
                    onPress={() => setPendingDeleteSectionId(section.id)}
                    style={({ hovered }) => [
                      styles.sectionDeleteButton,
                      hoveredSectionId === section.id || hoveredDeleteSectionId === section.id ? styles.sectionDeleteButtonVisible : styles.sectionDeleteButtonHidden,
                      hovered ? styles.sectionDeleteButtonHovered : undefined,
                    ]}
                  >
                    <TrashIcon color="#000000" size={16} />
                  </Pressable>
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
                    editable={!isReadOnly}
                    style={[styles.sectionTitleInput, inputWebStyle]}
                  />
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
                      editable={!isReadOnly}
                      style={[styles.sectionDescriptionInput, inputWebStyle]}
                    />
                  </View>
                </Pressable>
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
                <PlusIcon color={colors.textStrong} size={18} />
                <Text style={styles.addSectionText}>Nieuw onderdeel</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View
          style={[
            styles.footerLeft,
            isCompactFooter ? styles.footerColumnCompact : undefined,
            isCompactFooter && mode !== 'edit' ? styles.footerLeftHidden : undefined,
          ]}
        >
          {mode === 'edit' && onDelete && !isReadOnly ? (
            <Pressable
              onPress={onDelete}
              style={({ hovered }) => [styles.secondaryButton, isCompactFooter ? styles.footerButtonCompact : undefined, hovered ? styles.secondaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.secondaryButtonText}>
                Verwijderen
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.footerRight, isCompactFooter ? styles.footerColumnCompact : undefined]}>
          <Pressable
            onPress={onClose}
            style={({ hovered }) => [styles.secondaryButton, isCompactFooter ? styles.footerButtonCompact : undefined, hovered ? styles.secondaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.secondaryButtonText}>
              {isReadOnly ? 'Sluiten' : 'Annuleren'}
            </Text>
          </Pressable>
          {isReadOnly ? null : (
            <Pressable
              onPress={() => onSave(activeTemplate)}
              style={({ hovered }) => [styles.primaryButton, isCompactFooter ? styles.footerButtonCompact : undefined, hovered ? styles.primaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.primaryButtonText}>
                {primaryButtonLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      {isReadOnly ? null : (
        <ConfirmDeleteDialog
          visible={Boolean(pendingDeleteSectionId)}
          title="Onderdeel verwijderen"
          description="Weet je zeker dat je dit onderdeel wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
          confirmLabel="Verwijderen"
          cancelLabel="Annuleren"
          onClose={() => setPendingDeleteSectionId(null)}
          onConfirm={() => {
            if (!pendingDeleteSectionId) return
            setActiveTemplate((previousTemplate) => ({
              ...previousTemplate,
              sections: previousTemplate.sections.filter((item) => item.id !== pendingDeleteSectionId),
            }))
            setPendingDeleteSectionId(null)
          }}
        />
      )}
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
    gap: 16,
    ...( { overflow: 'hidden' } as any ),
  },
  formFields: {
    width: '100%',
    gap: 12,
  },
  readOnlyContent: {
    width: '100%',
    gap: 8,
  },
  readOnlyDescriptionText: {
    fontSize: richTextSharedFormatting.editorFontSize,
    lineHeight: richTextSharedFormatting.editorLineHeight,
    color: colors.text,
  },
  readOnlyHeading: {
    fontSize: richTextSharedFormatting.headingTwoFontSize,
    lineHeight: richTextSharedFormatting.headingLineHeight,
    fontWeight: richTextSharedFormatting.headingFontWeight,
    color: colors.textStrong,
  },
  readOnlyBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  readOnlyBulletDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.text,
    marginTop: 10,
  },
  readOnlyBulletTextContainer: {
    flex: 1,
  },
  readOnlyBulletText: {
    fontSize: richTextSharedFormatting.listFontSize,
    lineHeight: richTextSharedFormatting.listLineHeight,
    color: colors.text,
  },
  readOnlyBulletNumber: {
    fontSize: richTextSharedFormatting.listFontSize,
    lineHeight: richTextSharedFormatting.listLineHeight,
    fontWeight: richTextSharedFormatting.listMarkerFontWeight,
    color: colors.text,
    minWidth: 20,
  },
  readOnlyQuoteRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: 10,
  },
  readOnlyQuoteText: {
    fontSize: richTextSharedFormatting.editorFontSize,
    lineHeight: richTextSharedFormatting.editorLineHeight,
    color: colors.textSecondary,
  },
  readOnlyEmptyRow: {
    height: 8,
  },
  readOnlyDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  italicText: {
    fontStyle: 'italic',
  },
  field: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  textField: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'center',
  },
  textFieldInput: {
    width: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  sectionsScroll: {
    flex: 1,
    width: '100%',
  },
  sectionsScrollContent: {
    gap: 16,
    paddingBottom: 8,
  },
  sectionCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    position: 'relative',
  },
  sectionDeleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sectionDeleteButtonVisible: {
    opacity: 1,
  },
  sectionDeleteButtonHidden: {
    opacity: 0,
    ...( { pointerEvents: 'none' } as any ),
  },
  sectionDeleteButtonHovered: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  sectionTitleInput: {
    width: '100%',
    padding: 0,
    paddingRight: 36,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
  },
  footerLeft: {
    minWidth: 160,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerColumnCompact: {
    flex: 1,
    minWidth: 0,
  },
  footerLeftHidden: {
    flex: 0,
    width: 0,
    minWidth: 0,
  },
  footerButtonCompact: {
    minWidth: 0,
    width: '100%',
    paddingHorizontal: 12,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
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

