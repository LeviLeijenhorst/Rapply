import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { AnimatedDropdownPanel } from '../AnimatedDropdownPanel'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { AanpassenIcon } from '../icons/AanpassenIcon'
import { EditActionIcon } from '../icons/EditActionIcon'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { focusAndSelectAll } from '../../utils/textInput'

type TemplateOption = {
  key: string
  label: string
}

type Props = {
  visible: boolean
  initialSessionTitle: string
  initialCoacheeName: string
  initialTemplateKey: string
  initialTemplateLabel: string
  coacheeOptions: string[]
  templateOptions: TemplateOption[]
  isTemplateChangeAllowed: boolean
  onClose: () => void
  onApply: (values: { sessionTitle: string; coacheeName: string; templateKey: string; templateLabel: string }) => void
  onDelete: () => void
  onOpenNewCoachee: () => void
  newlyCreatedCoacheeName?: string | null
  onNewlyCreatedCoacheeHandled?: () => void
}

export function EditSessieModal({
  visible,
  initialSessionTitle,
  initialCoacheeName,
  initialTemplateKey,
  initialTemplateLabel,
  coacheeOptions,
  templateOptions,
  isTemplateChangeAllowed,
  onClose,
  onApply,
  onDelete,
  onOpenNewCoachee,
  newlyCreatedCoacheeName,
  onNewlyCreatedCoacheeHandled,
}: Props) {
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle)
  const [coacheeName, setCoacheeName] = useState(initialCoacheeName)
  const [templateKey, setTemplateKey] = useState(initialTemplateKey)
  const [templateLabel, setTemplateLabel] = useState(initialTemplateLabel)
  const [isCoacheeMenuOpen, setIsCoacheeMenuOpen] = useState(false)
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const sessionTitleInputRef = useRef<TextInput | null>(null)
  const coacheeMenuAreaRef = useRef<View | null>(null)
  const templateMenuAreaRef = useRef<View | null>(null)
  const [coacheeMenuMaxHeight, setCoacheeMenuMaxHeight] = useState(0)
  const [templateMenuMaxHeight, setTemplateMenuMaxHeight] = useState(0)
  const { height: windowHeight } = useWindowDimensions()

  const selectedTemplateLabel = useMemo(() => {
    const selected = templateOptions.find((item) => item.key === templateKey)
    return selected?.label ?? templateLabel
  }, [templateKey, templateLabel, templateOptions])

  useEffect(() => {
    if (!visible) return
    setSessionTitle(initialSessionTitle)
    setCoacheeName(initialCoacheeName)
    setTemplateKey(initialTemplateKey)
    setTemplateLabel(initialTemplateLabel)
    setIsCoacheeMenuOpen(false)
    setIsTemplateMenuOpen(false)
  }, [visible, initialSessionTitle, initialCoacheeName, initialTemplateKey, initialTemplateLabel])

  useEffect(() => {
    if (newlyCreatedCoacheeName && visible && coacheeOptions.includes(newlyCreatedCoacheeName)) {
      setCoacheeName(newlyCreatedCoacheeName)
      setIsCoacheeMenuOpen(false)
      onNewlyCreatedCoacheeHandled?.()
    }
  }, [newlyCreatedCoacheeName, visible, coacheeOptions, onNewlyCreatedCoacheeHandled])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => sessionTitleInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const nextMaxHeight = Math.min(240, Math.max(0, windowHeight - 200))
    setCoacheeMenuMaxHeight(nextMaxHeight)
    setTemplateMenuMaxHeight(nextMaxHeight)
  }, [visible, windowHeight])

  useEffect(() => {
    if (!visible || !isCoacheeMenuOpen) return
    coacheeMenuAreaRef.current?.measureInWindow?.((left, top, width, height) => {
      const availableSpace = windowHeight - (top + height + 16)
      setCoacheeMenuMaxHeight(Math.min(240, Math.max(0, availableSpace)))
      void left
      void width
    })
  }, [visible, isCoacheeMenuOpen, windowHeight])

  useEffect(() => {
    if (!visible || !isTemplateMenuOpen) return
    templateMenuAreaRef.current?.measureInWindow?.((left, top, width, height) => {
      const availableSpace = windowHeight - (top + height + 16)
      setTemplateMenuMaxHeight(Math.min(240, Math.max(0, availableSpace)))
      void left
      void width
    })
  }, [visible, isTemplateMenuOpen, windowHeight])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const isAnyMenuOpen = isCoacheeMenuOpen || isTemplateMenuOpen
  const coacheeMenuPanelStyle = [styles.menuPanel, { maxHeight: coacheeMenuMaxHeight }]
  const templateMenuPanelStyle = [styles.menuPanel, { maxHeight: templateMenuMaxHeight }]

  return (
    <AnimatedOverlayModal
      visible={visible}
      onClose={() => {
        if (isAnyMenuOpen) {
          setIsCoacheeMenuOpen(false)
          setIsTemplateMenuOpen(false)
          return
        }
        onClose()
      }}
      contentContainerStyle={styles.container}
    >
        {/* Modal header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (!isAnyMenuOpen) return
              setIsCoacheeMenuOpen(false)
              setIsTemplateMenuOpen(false)
            }}
            style={styles.headerLeft}
          >
            {/* Header icon */}
            <View style={styles.headerIconCircle}>
              <AanpassenIcon color={colors.selected} size={18} />
            </View>
            {/* Header title */}
            <Text isBold style={styles.headerTitle}>
              Gesprek gegevens
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setIsCoacheeMenuOpen(false)
              setIsTemplateMenuOpen(false)
              onClose()
            }}
            style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}
          >
            {/* Close */}
            <ModalCloseDarkIcon />
          </Pressable>
        </View>

        {/* Modal body */}
        <View style={styles.body}>
          {isAnyMenuOpen ? (
            <Pressable
              onPress={() => {
                setIsCoacheeMenuOpen(false)
                setIsTemplateMenuOpen(false)
              }}
              style={styles.dropdownDismissOverlay}
            />
          ) : null}
          {/* Session title */}
          <Pressable onPress={() => sessionTitleInputRef.current?.focus()} style={({ hovered }) => [styles.fieldRow, hovered ? styles.fieldRowHovered : undefined]}>
            <TextInput
              ref={(value) => {
                sessionTitleInputRef.current = value
              }}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder="Sessie naam..."
              placeholderTextColor="#656565"
              style={[styles.singleLineInput, inputWebStyle]}
            />
            <Pressable
              onPress={() => focusAndSelectAll(sessionTitleInputRef, sessionTitle)}
              style={({ hovered }) => [styles.trailingIconButton, hovered ? styles.trailingIconButtonHovered : undefined]}
            >
              {/* Edit icon */}
              <EditActionIcon color="#656565" size={18} />
            </Pressable>
          </Pressable>

          {/* Coachee */}
          <View ref={coacheeMenuAreaRef} style={[styles.menuArea, isCoacheeMenuOpen ? styles.menuAreaRaised : undefined]}>
            <Pressable
              onPress={() => {
                setIsCoacheeMenuOpen((value) => !value)
                setIsTemplateMenuOpen(false)
              }}
              style={({ hovered }) => [styles.fieldRow, styles.dropdownRow, hovered ? styles.fieldRowHovered : undefined]}
            >
              {/* Coachee dropdown */}
              <Text style={styles.dropdownText}>{coacheeName}</Text>
              <View style={styles.spacer} />
              <ChevronDownIcon color="#656565" size={18} />
            </Pressable>

            <AnimatedDropdownPanel visible={isCoacheeMenuOpen} style={coacheeMenuPanelStyle}>
              <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
                {coacheeOptions.map((name, index) => {
                  const isFirst = index === 0
                  return (
                    <Pressable
                      key={name}
                      onPress={() => {
                        setCoacheeName(name)
                        setIsCoacheeMenuOpen(false)
                      }}
                      style={({ hovered }) => [
                        styles.menuItem,
                        isFirst ? styles.menuItemTop : undefined,
                        hovered ? styles.menuItemHovered : undefined,
                      ]}
                    >
                      {/* Coachee list item */}
                      <Text style={styles.menuItemText}>{name}</Text>
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation()
                    setIsCoacheeMenuOpen(false)
                    onOpenNewCoachee()
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation()
                  }}
                  onMouseEnter={() => {
                    setIsCoacheeMenuOpen(true)
                  }}
                  style={({ hovered }) => [
                    styles.menuItem,
                    styles.menuItemAdd,
                    coacheeOptions.length === 0 ? styles.menuItemTop : undefined,
                    styles.menuItemBottom,
                    hovered ? styles.menuItemAddHovered : undefined,
                  ]}
                >
                  {/* Add coachee */}
                  <Text style={styles.menuItemAddText}>+ Nieuwe coachee</Text>
                </Pressable>
              </ScrollView>
            </AnimatedDropdownPanel>
          </View>

          {/* Template */}
          {isTemplateChangeAllowed ? (
            <View ref={templateMenuAreaRef} style={[styles.menuArea, isTemplateMenuOpen ? styles.menuAreaRaised : undefined]}>
              <Pressable
                onPress={() => {
                  setIsTemplateMenuOpen((value) => !value)
                  setIsCoacheeMenuOpen(false)
                }}
                style={({ hovered }) => [styles.fieldRow, styles.dropdownRow, hovered ? styles.fieldRowHovered : undefined]}
              >
                {/* Template dropdown */}
                <Text style={styles.dropdownText}>{selectedTemplateLabel}</Text>
                <View style={styles.spacer} />
                <ChevronDownIcon color="#656565" size={18} />
              </Pressable>

              <AnimatedDropdownPanel visible={isTemplateMenuOpen} style={templateMenuPanelStyle}>
                <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
                  {templateOptions.map((template, index) => {
                    const isFirst = index === 0
                    const isLast = index === templateOptions.length - 1
                    return (
                      <Pressable
                        key={template.key}
                        onPress={() => {
                          setTemplateKey(template.key)
                          setTemplateLabel(template.label)
                          setIsTemplateMenuOpen(false)
                        }}
                        style={({ hovered }) => [
                          styles.menuItem,
                          isFirst ? styles.menuItemTop : undefined,
                          isLast ? styles.menuItemBottom : undefined,
                          hovered ? styles.menuItemHovered : undefined,
                        ]}
                      >
                        {/* Template list item */}
                        <Text style={styles.menuItemText}>{template.label}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </AnimatedDropdownPanel>
            </View>
          ) : null}
        </View>

        {/* Modal footer */}
        <View style={styles.footer}>
          <Pressable onPress={onDelete} style={({ hovered }) => [styles.footerDangerButton, hovered ? styles.footerDangerButtonHovered : undefined]}>
            {/* Delete */}
            <Text isBold style={styles.footerDangerButtonText}>
              Verwijderen
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setIsCoacheeMenuOpen(false)
              setIsTemplateMenuOpen(false)
              onClose()
            }}
            style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}
          >
            {/* Cancel */}
            <Text isBold style={styles.footerSecondaryButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onApply({ sessionTitle, coacheeName, templateKey, templateLabel: selectedTemplateLabel })
            }}
            style={({ hovered }) => [styles.footerPrimaryButton, hovered ? styles.footerPrimaryButtonHovered : undefined]}
          >
            {/* Apply */}
            <Text isBold style={styles.footerPrimaryButtonText}>
              Toepassen
            </Text>
          </Pressable>
        </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 720,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'visible',
    position: 'relative',
  },
  header: {
    width: '100%',
    height: 72,
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
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 24,
    gap: 16,
    ...( { overflow: 'visible' } as any ),
    position: 'relative',
    zIndex: 2,
  },
  dropdownDismissOverlay: {
    ...( { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 10 } as any ),
  },
  menuArea: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  menuAreaRaised: {
    zIndex: 20,
  },
  fieldRow: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...( { cursor: 'pointer' } as any ),
  },
  dropdownRow: {
    borderWidth: 0,
    borderColor: 'transparent',
    ...( { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any ),
  },
  fieldRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  singleLineInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    ...( { cursor: 'pointer' } as any ),
  },
  dropdownText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#656565',
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  trailingIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingIconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  menuPanel: {
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
    gap: 0,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' } as any ),
    zIndex: 30,
    overflow: 'hidden',
  },
  menuScroll: {
    width: '100%',
  },
  menuScrollContent: {
    gap: 0,
    paddingVertical: 0,
  },
  menuItem: {
    width: '100%',
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  menuItemTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuItemBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  menuItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  menuItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  menuItemAdd: {
    backgroundColor: colors.selected,
  },
  menuItemAddHovered: {
    backgroundColor: '#A50058',
  },
  menuItemAddText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'relative',
    zIndex: 1,
  },
  footerDangerButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 'auto',
  },
  footerDangerButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  footerDangerButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  footerSecondaryButton: {
    height: 48,
    borderRadius: 0,
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

