import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from './Text'

type Props = {
  visible: boolean
  message: string
  onHoverStart?: () => void
  onHoverEnd?: () => void
}

export function BottomToast({ visible, message, onHoverStart, onHoverEnd }: Props) {
  return (
    <View pointerEvents="box-none" style={[styles.container, visible ? styles.containerVisible : styles.containerHidden]}>
      <Pressable onHoverIn={onHoverStart} onHoverOut={onHoverEnd} pointerEvents={visible ? 'auto' : 'none'} style={styles.toast}>
        <Text isBold style={styles.message}>
          {message}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...( { position: 'fixed', left: 0, right: 0, bottom: 24, zIndex: 10000 } as any ),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    ...( { transitionProperty: 'opacity, transform', transitionDuration: '260ms', transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' } as any ),
  },
  containerVisible: {
    opacity: 1,
    ...( { transform: 'translateY(0)' } as any ),
  },
  containerHidden: {
    opacity: 0,
    ...( { transform: 'translateY(calc(100% + 96px))' } as any ),
  },
  toast: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...( { boxShadow: '0 8px 20px rgba(15,23,42,0.2)' } as any ),
  },
  message: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1D0A00',
    textAlign: 'center',
  },
})
