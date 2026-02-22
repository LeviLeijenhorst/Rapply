import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { Text } from './Text'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { WebPortal } from './WebPortal'

export type PopoverMenuItem = {
  key: string
  label: string
  icon?: React.ReactNode
  badgeLabel?: string
  badgeIcon?: React.ReactNode
  isDanger?: boolean
  onPress: () => void
}

type AnchorPoint = {
  x: number
  y: number
}

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  placement: 'above' | 'below'
  width: number
  estimatedHeight: number
  items: PopoverMenuItem[]
  onClose: () => void
}

export function PopoverMenu({ visible, anchorPoint, placement, width, estimatedHeight, items, onClose }: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const [isRendered, setIsRendered] = useState(visible)
  const [menuHeight, setMenuHeight] = useState(estimatedHeight)
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
    if (!visible) return
    setMenuHeight(estimatedHeight)
  }, [estimatedHeight, visible])

  useEffect(() => {
    if (!isRendered) return

    if (!animationConfig) {
      opacity.setValue(visible ? 1 : 0)
      translateY.setValue(visible ? 0 : 6)
      if (!visible) setIsRendered(false)
      return
    }

    if (visible) {
      opacity.setValue(0)
      translateY.setValue(placement === 'above' ? 6 : -6)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: animationConfig.durationMs, easing: animationConfig.easing, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: placement === 'above' ? 6 : -6, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setIsRendered(false)
    })
  }, [animationConfig, isRendered, opacity, placement, translateY, visible])

  if (!isRendered || !anchorPoint) return null

  const padding = 12
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  const left = Math.min(Math.max(padding, anchorPoint.x), Math.max(padding, viewportWidth - width - padding))
  const topFromBelow = anchorPoint.y + 8
  const topFromAbove = anchorPoint.y - menuHeight - 8
  const unclampedTop = placement === 'below' ? topFromBelow : topFromAbove
  const top = Math.min(Math.max(padding, unclampedTop), Math.max(padding, viewportHeight - menuHeight - padding))

  return (
    <WebPortal>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <Animated.View
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height ?? 0)
            if (!nextHeight || nextHeight === menuHeight) return
            setMenuHeight(nextHeight)
          }}
          style={[styles.menu, { width, left, top, opacity, transform: [{ translateY }] } as any]}
        >
          {items.map((item, index) => (
            <View key={item.key} style={[styles.rowContainer, index < items.length - 1 ? styles.rowContainerWithDivider : undefined]}>
              <Pressable
                onPress={() => {
                  item.onPress()
                }}
                style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}
              >
                {/* Menu item */}
                <View style={styles.rowLeft}>
                  {item.icon ? <View style={styles.iconBox}>{item.icon}</View> : null}
                  <Text isSemibold style={[styles.rowText, item.isDanger ? styles.rowTextDanger : undefined]}>
                    {item.label}
                  </Text>
                </View>
                {item.badgeLabel ? (
                  <View style={styles.badge}>
                    {/* Badge label */}
                    <View style={styles.badgeContent}>
                      {item.badgeIcon ? <View style={styles.badgeIcon}>{item.badgeIcon}</View> : null}
                      <Text isSemibold style={styles.badgeText}>
                        {item.badgeLabel}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ))}
        </Animated.View>
      </View>
    </WebPortal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...( { position: 'fixed', inset: 0, zIndex: 9999 } as any ),
  },
  backdrop: {
    ...( { position: 'absolute', inset: 0 } as any ),
  },
  menu: {
    ...( { position: 'absolute', boxShadow: '0 20px 60px rgba(0,0,0,0.16)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 4,
  },
  rowContainer: {
    width: '100%',
  },
  rowContainerWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    height: 44,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.hoverBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    flex: 1,
  },
  rowTextDanger: {
    color: colors.selected,
  },
  badge: {
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.badgeBackground,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.selected,
  },
})

