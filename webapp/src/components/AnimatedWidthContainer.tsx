import React, { ReactNode, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing } from 'react-native'

import { useReducedMotion } from '../hooks/useReducedMotion'

type Props = {
  width: number
  children: ReactNode
  style?: any
}

export function AnimatedWidthContainer({ width, children, style }: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const animatedWidth = useRef(new Animated.Value(width)).current

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) return null
    return { durationMs: 180, easing: Easing.out(Easing.cubic) }
  }, [isReducedMotionEnabled])

  useEffect(() => {
    if (!animationConfig) {
      animatedWidth.setValue(width)
      return
    }

    Animated.timing(animatedWidth, {
      toValue: width,
      duration: animationConfig.durationMs,
      easing: animationConfig.easing,
      useNativeDriver: false,
    }).start()
  }, [animatedWidth, animationConfig, width])

  return <Animated.View style={[style, { width: animatedWidth }]}>{children}</Animated.View>
}

