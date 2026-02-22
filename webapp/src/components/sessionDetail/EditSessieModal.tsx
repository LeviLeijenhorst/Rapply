import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { AnimatedDropdownPanel } from '../AnimatedDropdownPanel'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const { height: windowHeight } = useWindowDimensions()

  const selectedTemplateLabel = useMemo(() => {
    const selected = templateOptions.find((item) => item.key === templateKey)
    return selected?.label ?? templateLabel
  }, [templateKey, templateLabel, templateOptions])

  const closeModal = () => {
    setIsCoacheeMenuOpen(false)
    setIsTemplateMenuOpen(false)
    setShowCloseConfirm(false)
    onClose()
  }

  const hasUnsavedChanges =
    sessionTitle.trim() !== initialSessionTitle.trim() ||
    coacheeName !== initialCoacheeName ||
    templateKey !== initialTemplateKey ||
    selectedTemplateLabel !== initialTemplateLabel

  const requestClose = () => {
    if (!hasUnsavedChanges) {
      closeModal()
      return
    }
    setShowCloseConfirm(true)
  }

  useEffect(() => {
    if (!visible) return
    setSessionTitle(initialSessionTitle)
    setCoacheeName(initialCoacheeName)
    setTemplateKey(initialTemplateKey)
    setTemplateLabel(initialTemplateLabel)
    setIsCoacheeMenuOpen(false)
    setIsTemplateMenuOpen(false)
    setShowCloseConfirm(false)
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
    if (typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeModal, visible])

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
    <>
    <AnimatedOverlayModal
      visible={visible}
      onClose={() => {
        if (isAnyMenuOpen) {
          setIsCoacheeMenuOpen(false)
          setIsTemplateMenuOpen(false)
          return
        }
        requestClose()
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
              Verslaggegevens
            </Text>
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
          {/* Report title */}
          <Pressable onPress={() => sessionTitleInputRef.current?.focus()} style={({ hovered }) => [styles.fieldRow, hovered ? styles.fieldRowHovered : undefined]}>
            <TextInput
              ref={(value) => {
                sessionTitleInputRef.current = value
              }}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder="Verslagnaam..."
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

          {/* Client */}
          <View ref={coacheeMenuAreaRef} style={[styles.menuArea, isCoacheeMenuOpen ? styles.menuAreaRaised : undefined]}>
            <Pressable
              onPress={() => {
                setIsCoacheeMenuOpen((value) => !value)
                setIsTemplateMenuOpen(false)
              }}
              style={({ hovered }) => [styles.fieldRow, hovered ? styles.fieldRowHovered : undefined]}
            >
              {/* Client dropdown */}
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
                      {/* Client list item */}
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
                  style={({ hovered }) => [
                    styles.menuItem,
                    styles.menuItemAdd,
                    coacheeOptions.length === 0 ? styles.menuItemTop : undefined,
                    styles.menuItemBottom,
                    hovered ? styles.menuItemAddHovered : undefined,
                  ]}
                >
                  {/* Add client */}
                  <Text style={styles.menuItemAddText}>+ Nieuwe cliënt</Text>
                </Pressable>
              </ScrollView>
            </AnimatedDropdownPanel>
          </View>
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
            onPress={requestClose}
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
    <AnimatedOverlayModal visible={showCloseConfirm} onClose={() => setShowCloseConfirm(false)} contentContainerStyle={styles.closeWarningContainer}>
      <View style={styles.closeWarningBody}>
        <Text isBold style={styles.closeWarningTitle}>
          Niet-opgeslagen wijzigingen
        </Text>
        <Text style={styles.closeWarningText}>
          Je hebt wijzigingen gemaakt. Weet je zeker dat je wilt sluiten zonder op te slaan?
        </Text>
      </View>
      <View style={styles.closeWarningFooter}>
        <Pressable onPress={() => setShowCloseConfirm(false)} style={({ hovered }) => [styles.closeWarningSecondaryButton, hovered ? styles.closeWarningSecondaryButtonHovered : undefined]}>
          <Text isBold style={styles.closeWarningSecondaryButtonText}>
            Terug
          </Text>
        </Pressable>
        <Pressable
          onPress={closeModal}
          style={({ hovered }) => [styles.closeWarningPrimaryButton, hovered ? styles.closeWarningPrimaryButtonHovered : undefined]}
        >
          <Text isBold style={styles.closeWarningPrimaryButtonText}>
            Sluiten
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
    </>
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
    borderWidth: 0,
    borderColor: 'transparent',
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
  closeWarningContainer: {
    width: 560,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  closeWarningBody: {
    padding: 24,
    gap: 12,
  },
  closeWarningTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  closeWarningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  closeWarningFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeWarningSecondaryButton: {
    height: 48,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  closeWarningSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  closeWarningSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  closeWarningPrimaryButton: {
    height: 48,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.selected,
  },
  closeWarningPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  closeWarningPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

