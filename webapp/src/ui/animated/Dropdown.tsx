import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'

import { useReducedMotion } from '../../hooks/useReducedMotion'

type Props = {
  visible: boolean
  children: ReactNode
  style?: any
  id?: string
  animateOpacity?: boolean
}

export function Dropdown({ visible, children, style, id, animateOpacity = true }: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const [isRendered, setIsRendered] = useState(visible)

  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(6)).current

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) return null
    return { durationMs: 160, easing: Easing.out(Easing.cubic) }
  }, [isReducedMotionEnabled])

  useEffect(() => {
    if (visible) setIsRendered(true)
  }, [visible])

  useEffect(() => {
    if (!isRendered) return

    if (!animationConfig) {
      opacity.setValue(visible ? 1 : animateOpacity ? 0 : 1)
      translateY.setValue(visible ? 0 : 6)
      if (!visible) setIsRendered(false)
      return
    }

    if (visible) {
      opacity.setValue(animateOpacity ? 0 : 1)
      translateY.setValue(6)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: animateOpacity ? 0 : 1, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 6, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setIsRendered(false)
    })
  }, [animateOpacity, animationConfig, isRendered, opacity, translateY, visible])

  if (!isRendered) return null

  return (
    <Animated.View id={id} style={[styles.container, style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

