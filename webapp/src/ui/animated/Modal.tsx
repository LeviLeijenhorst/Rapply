import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'

import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { WebPortal } from '../WebPortal'

type Props = {
  visible: boolean
  onClose: () => void
  children: ReactNode
  contentContainerStyle?: any
}

export function Modal({ visible, onClose, children, contentContainerStyle }: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  useLockBodyScroll(visible)

  const [isRendered, setIsRendered] = useState(visible)

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0.98)).current
  const modalTranslateY = useRef(new Animated.Value(10)).current

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) return null
    return { durationMs: 200, easing: Easing.out(Easing.cubic) }
  }, [isReducedMotionEnabled])

  useEffect(() => {
    if (visible) setIsRendered(true)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    if (typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, visible])


  useEffect(() => {
    if (!isRendered) return

    if (!animationConfig) {
      backdropOpacity.setValue(visible ? 1 : 0)
      modalOpacity.setValue(visible ? 1 : 0)
      modalScale.setValue(1)
      modalTranslateY.setValue(0)
      if (!visible) setIsRendered(false)
      return
    }

    if (visible) {
      backdropOpacity.setValue(0)
      modalOpacity.setValue(0)
      modalScale.setValue(0.98)
      modalTranslateY.setValue(10)

      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(modalOpacity, { toValue: 1, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(modalScale, { toValue: 1, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(modalTranslateY, { toValue: 0, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.98, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(modalTranslateY, { toValue: 10, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setIsRendered(false)
    })
  }, [animationConfig, backdropOpacity, isRendered, modalOpacity, modalScale, modalTranslateY, visible])

  if (!isRendered) return null

  return (
    <WebPortal>
      <View style={styles.overlay} pointerEvents="auto">
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none" />
        <Pressable onPress={onClose} style={styles.backdropPressable} pointerEvents="auto" />
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.contentContainer,
            contentContainerStyle,
            {
              opacity: modalOpacity,
              transform: [{ translateY: modalTranslateY }, { scale: modalScale }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </WebPortal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(16,18,20,0.22)',
    ...( { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any ),
    zIndex: 0,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
  },
  contentContainer: {
    width: 720,
    maxWidth: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
})

