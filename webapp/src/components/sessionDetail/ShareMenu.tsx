import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'

import { useReducedMotion } from '../../hooks/useReducedMotion'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ShareAudioIcon } from '../icons/ShareAudioIcon'
import { ShareTextIcon } from '../icons/ShareTextIcon'

type ShareMenuItemKey = 'audio' | 'summary'

type Props = {
  visible: boolean
  onClose: () => void
  onSelectItem: (itemKey: ShareMenuItemKey) => void
}

export function ShareMenu({ visible, onClose, onSelectItem }: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const [isRendered, setIsRendered] = useState(visible)
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(6)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) return null
    return { durationMs: 160, easing: Easing.out(Easing.cubic) }
  }, [isReducedMotionEnabled])

  useEffect(() => {
    if (visible) setIsRendered(true)
  }, [visible])

  useEffect(() => {
    if (!isRendered) return

    animationRef.current?.stop()
    animationRef.current = null

    if (!animationConfig) {
      opacity.setValue(visible ? 1 : 0)
      translateY.setValue(visible ? 0 : 6)
      if (!visible) setIsRendered(false)
      return
    }

    if (visible) {
      opacity.setValue(0)
      translateY.setValue(6)
      const animation = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
      ])
      animationRef.current = animation
      animation.start(({ finished }) => {
        if (finished && animationRef.current === animation) animationRef.current = null
      })
      return
    }

    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 6, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ])
    animationRef.current = animation
    animation.start(({ finished }) => {
      if (finished) setIsRendered(false)
      if (animationRef.current === animation) animationRef.current = null
    })
  }, [animationConfig, isRendered, opacity, translateY, visible])

  if (!isRendered) return null

  return (
    <>
      <Pressable onPress={onClose} style={styles.dismissOverlay} />
      <Animated.View style={[styles.menuCard, { opacity, transform: [{ translateY }] }]}>
        <ShareMenuItem label="Deel Audio" icon={<ShareAudioIcon color={colors.textStrong} size={18} />} onPress={() => onSelectItem('audio')} />
        <ShareMenuItem label="Deel Samenvatting" icon={<ShareTextIcon color={colors.textStrong} size={18} />} onPress={() => onSelectItem('summary')} />
      </Animated.View>
    </>
  )
}

type ShareMenuItemProps = {
  label: string
  icon: React.ReactNode
  onPress: () => void
}

function ShareMenuItem({ label, icon, onPress }: ShareMenuItemProps) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.menuItem, hovered ? styles.menuItemHovered : undefined]}>
      {/* Menu item */}
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          {icon}
        </View>
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  dismissOverlay: {
    ...( { position: 'fixed', inset: 0, zIndex: 9998 } as any ),
  },
  menuCard: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 220,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    gap: 4,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 9999 } as any ),
  },
  menuItem: {
    width: '100%',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  menuItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.hoverBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
})

