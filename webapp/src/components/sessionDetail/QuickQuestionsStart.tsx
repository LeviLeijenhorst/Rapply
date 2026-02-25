import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { RotateLeftIcon } from '../icons/RotateLeftIcon'
import { AnimatedOverlayModal } from '../AnimatedOverlayModal'

type QuickQuestionOption = {
  id: string
  text: string
  promptText: string
  templateId?: string
}

type Props = {
  templates: { id: string; name: string; promptText?: string; templateId?: string }[]
  onSelectOption: (option: { text: string; promptText: string; templateId?: string }) => void
}

function buildOptions(templates: { id: string; name: string; promptText?: string; templateId?: string }[]): QuickQuestionOption[] {
  return templates
    .map((template) => {
      const text = String(template.name || '').trim()
      const promptText = String(template.promptText || '').trim() || text
      const templateId = String(template.templateId || template.id || '').trim() || undefined
      return { id: String(template.id || '').trim(), text, promptText, templateId }
    })
    .filter((template) => template.id.length > 0 && template.text.length > 0 && template.promptText.length > 0)
}

function shuffleOptions(options: QuickQuestionOption[]) {
  const nextOptions = [...options]
  for (let index = nextOptions.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1))
    const temp = nextOptions[index]
    nextOptions[index] = nextOptions[nextIndex]
    nextOptions[nextIndex] = temp
  }
  return nextOptions
}

export function QuickQuestionsStart({ templates, onSelectOption }: Props) {
  const opacity = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current
  const [isAnimating, setIsAnimating] = useState(false)
  const baseOptions = useMemo(() => buildOptions(templates), [templates])
  const [optionsOrder, setOptionsOrder] = useState<QuickQuestionOption[]>(() => shuffleOptions(baseOptions))
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const optionsOrderRef = useRef<QuickQuestionOption[]>(optionsOrder)
  const activeIndexRef = useRef(activeIndex)
  const visibleOptions = optionsOrder.length > 0 ? [optionsOrder[activeIndex % optionsOrder.length]] : []
  const selectedOption = optionsOrder.find((option) => option.id === selectedOptionId) ?? null

  function animateOptions(onNext: () => void) {
    if (isAnimating) return
    setIsAnimating(true)
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 8, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      onNext()
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => setIsAnimating(false))
    })
  }

  function refreshOptions() {
    const order = optionsOrderRef.current
    if (order.length === 0) return
    const nextIndex = (activeIndexRef.current + 1) % order.length
    animateOptions(() => setActiveIndex(nextIndex))
  }

  useEffect(() => {
    const nextOrder = shuffleOptions(baseOptions)
    setOptionsOrder(nextOrder)
    setActiveIndex(0)
  }, [baseOptions])

  useEffect(() => {
    optionsOrderRef.current = optionsOrder
  }, [optionsOrder])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (optionsOrderRef.current.length === 0) return
    const intervalId = setInterval(() => {
      if (isAnimating) return
      refreshOptions()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [optionsOrder.length, isAnimating])

  useEffect(() => {
    if (optionsOrder.length === 0) {
      setSelectedOptionId(null)
      return
    }
    setSelectedOptionId((previous) => {
      if (previous && optionsOrder.some((option) => option.id === previous)) return previous
      return optionsOrder[0].id
    })
  }, [optionsOrder])

  return (
    <View style={styles.container}>
      {/* Intro line */}
      <Text isSemibold style={styles.titleText}>
        Templates
      </Text>

      <Animated.View style={[styles.optionsContainer, { opacity, transform: [{ translateY }] }]}>
        {/* Quick question options */}
        {visibleOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onSelectOption({ text: option.text, promptText: option.promptText, templateId: option.templateId })}
            style={({ hovered }) => [styles.optionTextButton, hovered ? styles.optionTextButtonHovered : undefined]}
          >
            {/* Quick option text */}
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={refreshOptions}
          style={({ hovered }) => [styles.circleButton, hovered ? styles.circleButtonHovered : undefined]}
        >
          {/* Refresh options */}
          <RotateLeftIcon size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setIsOptionsModalVisible(true)}
          style={({ hovered }) => [styles.circleButton, hovered ? styles.circleButtonHovered : undefined]}
        >
          {/* Open all options modal */}
          <View style={styles.listIcon}>
            <View style={styles.listIconLine} />
            <View style={styles.listIconLine} />
            <View style={styles.listIconLine} />
          </View>
        </Pressable>
      </View>

      <AnimatedOverlayModal visible={isOptionsModalVisible} onClose={() => setIsOptionsModalVisible(false)} contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalBody}>
            <View style={styles.modalHeader}>
              <Text isSemibold style={styles.modalTitle}>
                Templates
              </Text>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {optionsOrder.map((option) => {
                const isSelected = selectedOptionId === option.id
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedOptionId(option.id)}
                    style={({ hovered }) => [
                      styles.modalOptionRow,
                      isSelected ? styles.modalOptionRowSelected : undefined,
                      hovered ? styles.modalOptionRowHovered : undefined,
                    ]}
                  >
                    <Text style={styles.modalOptionText}>{option.text}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
          <View style={styles.modalFooter}>
            <Pressable
              onPress={() => setIsOptionsModalVisible(false)}
              style={({ hovered }) => [styles.modalFooterSecondaryButton, hovered ? styles.modalFooterSecondaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.modalFooterSecondaryButtonText}>
                Annuleren
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!selectedOption) return
                onSelectOption({ text: selectedOption.text, promptText: selectedOption.promptText, templateId: selectedOption.templateId })
                setIsOptionsModalVisible(false)
              }}
              disabled={!selectedOption}
              style={({ hovered }) => [
                styles.modalFooterPrimaryButton,
                hovered ? styles.modalFooterPrimaryButtonHovered : undefined,
                !selectedOption ? styles.modalFooterPrimaryButtonDisabled : undefined,
              ]}
            >
              <Text isBold style={styles.modalFooterPrimaryButtonText}>
                Selecteren
              </Text>
            </Pressable>
          </View>
        </View>
      </AnimatedOverlayModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  optionTextButton: {
    padding: 8,
  },
  optionTextButtonHovered: {
    backgroundColor: colors.hoverBackground,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  listIcon: {
    width: 14,
    gap: 3,
  },
  listIconLine: {
    width: '100%',
    height: 1.5,
    borderRadius: 999,
    backgroundColor: colors.textSecondary,
  },
  modalContainer: {
    width: 560,
    maxWidth: '100%',
  },
  modalContent: {
    width: '100%',
    maxHeight: 640,
    overflow: 'hidden',
  },
  modalBody: {
    width: '100%',
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalScrollContent: {
    gap: 8,
  },
  modalOptionRow: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalOptionRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  modalOptionRowSelected: {
    borderColor: 'transparent',
    backgroundColor: '#FFF2F8',
  },
  modalOptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  modalFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalFooterSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooterSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  modalFooterSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  modalFooterPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooterPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  modalFooterPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  modalFooterPrimaryButtonDisabled: {
    opacity: 0.5,
  },
})
