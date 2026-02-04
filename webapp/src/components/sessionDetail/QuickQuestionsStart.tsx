import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { RotateLeftIcon } from '../icons/RotateLeftIcon'

type QuickQuestionOption = {
  id: string
  text: string
}

type Props = {
  coacheeName: string
  onSelectOption: (fullSentence: string) => void
}

function buildOptions(coacheeName: string): QuickQuestionOption[] {
  void coacheeName
  return [
    { id: 'plan', text: 'inspiratie voor een gespreksplan.' },
    { id: 'todos-pdf', text: "een PDF met alle to-do's voor de volgende keer." },
    { id: 'goals-pdf', text: 'een PDF met alle doelen die we hebben gesteld.' },
    { id: 'last-reminder', text: 'een snelle reminder waar het vorige gesprek over ging.' },
    { id: 'goals-list', text: 'alle doelen op een rijtje.' },
    { id: 'help-request', text: 'de hulpvraag.' },
    { id: 'feedback', text: 'feedback: hoe vind je dat ik het in het vorige gesprek heb gedaan?' },
  ]
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

export function QuickQuestionsStart({ coacheeName, onSelectOption }: Props) {
  const opacity = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current
  const [isAnimating, setIsAnimating] = useState(false)
  const baseOptions = useMemo(() => buildOptions(coacheeName), [coacheeName])
  const [optionsOrder, setOptionsOrder] = useState<QuickQuestionOption[]>(() => shuffleOptions(baseOptions))
  const [activeIndex, setActiveIndex] = useState(0)
  const optionsOrderRef = useRef<QuickQuestionOption[]>(optionsOrder)
  const activeIndexRef = useRef(activeIndex)
  const visibleOptions = optionsOrder.length > 0 ? [optionsOrder[activeIndex % optionsOrder.length]] : []

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

  return (
    <View style={styles.container}>
      {/* Intro line */}
      <Text isSemibold style={styles.titleText}>
        Ik wil...
      </Text>

      <Animated.View style={[styles.optionsContainer, { opacity, transform: [{ translateY }] }]}>
        {/* Quick question options */}
        {visibleOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onSelectOption(`Ik wil ${option.text}`)}
            style={({ hovered }) => [styles.optionTextButton, hovered ? styles.optionTextButtonHovered : undefined]}
          >
            {/* Quick option text */}
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <Pressable
        onPress={refreshOptions}
        style={({ hovered }) => [styles.refreshButton, hovered ? styles.refreshButtonHovered : undefined]}
      >
        {/* Refresh options */}
        <RotateLeftIcon size={18} color={colors.textSecondary} />
      </Pressable>
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
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
})
