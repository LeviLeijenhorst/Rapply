import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'

import { Text } from './Text'
import { useReducedMotion } from '../hooks/useReducedMotion'

type Props = {
  visible: boolean
  message: string
  onHoverStart?: () => void
  onHoverEnd?: () => void
}

export function Toast({ visible, message, onHoverStart, onHoverEnd }: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const [isRendered, setIsRendered] = useState(visible)
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current
  const translateY = useRef(new Animated.Value(visible ? 0 : 24)).current

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) return null
    return { durationMs: 220, easing: Easing.out(Easing.cubic) }
  }, [isReducedMotionEnabled])

  useEffect(() => {
    if (visible) setIsRendered(true)
  }, [visible])

  useEffect(() => {
    if (!isRendered) return

    if (!animationConfig) {
      opacity.setValue(visible ? 1 : 0)
      translateY.setValue(visible ? 0 : 24)
      if (!visible) setIsRendered(false)
      return
    }

    if (visible) {
      opacity.setValue(0)
      translateY.setValue(24)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 24, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setIsRendered(false)
    })
  }, [animationConfig, isRendered, opacity, translateY, visible])

  if (!isRendered) return null

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable onHoverIn={onHoverStart} onHoverOut={onHoverEnd} pointerEvents="auto" style={styles.toast}>
          {/* Toast message */}
          <Text isBold style={styles.message}>
            {message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  toast: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  message: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1D0A00',
    textAlign: 'center',
  },
})
