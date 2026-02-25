import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { SearchIcon } from '../icons/SearchIcon'

type Props = {
  visible: boolean
  templates: { id: string; name: string }[]
  selectedTemplateId: string | null
  onClose: () => void
  onContinue: (templateId: string) => void
  confirmLabel?: string
  emptyOption?: { id: string; name: string } | null
}

export function TemplatePickerModal({
  visible,
  templates,
  selectedTemplateId,
  onClose,
  onContinue,
  confirmLabel = 'Genereren',
  emptyOption = null,
}: Props) {
  const [searchText, setSearchText] = useState('')
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(selectedTemplateId)

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const templateOptions = useMemo(() => {
    if (!emptyOption) return templates
    return [emptyOption, ...templates]
  }, [emptyOption, templates])

  const filteredTemplates = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (query.length === 0) return templateOptions
    return templateOptions.filter((template) => template.name.toLowerCase().includes(query))
  }, [searchText, templateOptions])

  useEffect(() => {
    if (!visible) return
    if (selectedTemplateId) {
      setActiveTemplateId(selectedTemplateId)
      return
    }
    setActiveTemplateId(templateOptions[0]?.id ?? null)
  }, [selectedTemplateId, templateOptions, visible])

  if (!visible) return null

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
        {/* Modal header */}
        <View style={styles.header}>
          <Text isBold style={styles.headerTitle}>
            Kies een template
          </Text>
          <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
            {/* Close */}
            <ModalCloseDarkIcon />
          </Pressable>
        </View>

        {/* Modal body */}
        <View style={styles.body}>
          {/* Search */}
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

          {/* Template list */}
          <View style={styles.listCard}>
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
              {filteredTemplates.map((template) => {
                const isSelected = template.id === activeTemplateId
                return (
                  <Pressable
                    key={template.id}
                    onPress={() => setActiveTemplateId(template.id)}
                    style={({ hovered }) => [
                      styles.templateRow,
                      isSelected ? styles.templateRowSelected : styles.templateRowUnselected,
                      hovered ? styles.templateRowHovered : undefined,
                    ]}
                  >
                    {/* Template row */}
                    <Text isSemibold={isSelected} style={styles.templateRowText}>
                      {template.name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>

        {/* Modal footer */}
        <View style={styles.footer}>
          <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
            {/* Cancel */}
            <Text isBold style={styles.footerSecondaryButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={() => (activeTemplateId ? onContinue(activeTemplateId) : null)}
            style={({ hovered }) => [styles.footerPrimaryButton, hovered ? styles.footerPrimaryButtonHovered : undefined]}
          >
            {/* Continue */}
            <Text isBold style={styles.footerPrimaryButtonText}>
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 920,
    maxWidth: '90vw',
    ...( { height: 'min(640px, 90vh)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
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
    gap: 12,
  },
  searchInputContainer: {
    width: '100%',
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
  listCard: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  listScroll: {
    width: '100%',
    flex: 1,
  },
  listScrollContent: {
    gap: 8,
    paddingBottom: 8,
  },
  templateRow: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  templateRowSelected: {
    backgroundColor: colors.hoverBackground,
  },
  templateRowUnselected: {
    backgroundColor: 'transparent',
  },
  templateRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  templateRowText: {
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
  footerSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  footerPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

