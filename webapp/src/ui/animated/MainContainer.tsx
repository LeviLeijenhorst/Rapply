import React, { ReactNode, useLayoutEffect, useMemo, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'

import { useReducedMotion } from '../../hooks/useReducedMotion'

type Props = {
  contentKey: string
  children: ReactNode
  style?: any
}

export function MainContainer({ contentKey, children, style }: Props) {
  const isReducedMotionEnabled = useReducedMotion()

  const opacity = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) {
      return null
    }

    return {
      durationMs: 180,
      easing: Easing.out(Easing.cubic),
    }
  }, [isReducedMotionEnabled])

  useLayoutEffect(() => {
    animationRef.current?.stop()
    animationRef.current = null

    if (!animationConfig) {
      opacity.setValue(1)
      translateY.setValue(0)
      return
    }

    opacity.setValue(0)
    translateY.setValue(8)

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: animationConfig.durationMs,
        easing: animationConfig.easing,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: animationConfig.durationMs,
        easing: animationConfig.easing,
        useNativeDriver: true,
      }),
    ])

    animationRef.current = animation
    animation.start(({ finished }) => {
      if (!finished) return
      if (animationRef.current === animation) {
        animationRef.current = null
      }
    })

    return () => {
      animation.stop()
      if (animationRef.current === animation) {
        animationRef.current = null
      }
    }
  }, [animationConfig, contentKey, opacity, translateY])

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

