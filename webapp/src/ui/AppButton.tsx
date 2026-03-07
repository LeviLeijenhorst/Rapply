import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { Text } from './Text'

export type AppButtonVariant = 'filled' | 'outlined' | 'neutral'

type Props = {
  label: string
  onPress: () => void
  variant: AppButtonVariant
  isDisabled?: boolean
  leading?: React.ReactNode
  trailing?: React.ReactNode
  style?: any
}

export function AppButton({ label, onPress, variant, isDisabled, leading, trailing, style }: Props) {
  const labelStyle =
    variant === 'filled' ? styles.labelFilled : variant === 'neutral' ? styles.labelNeutral : styles.labelOutlined

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ hovered, pressed }) => [
        styles.base,
        variant === 'filled' ? styles.filled : undefined,
        variant === 'outlined' ? styles.outlined : undefined,
        variant === 'neutral' ? styles.neutral : undefined,
        hovered ? styles.baseHovered : undefined,
        hovered && variant === 'filled' ? styles.filledHovered : undefined,
        hovered && variant === 'outlined' ? styles.outlinedHovered : undefined,
        hovered && variant === 'neutral' ? styles.neutralHovered : undefined,
        pressed ? styles.basePressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style,
      ]}
    >
      {/* Button */}
      <View style={styles.content}>
        {leading ? <View style={styles.iconSlot}>{leading}</View> : null}
        <Text isBold style={[styles.label, labelStyle]}>
          {label}
        </Text>
        {trailing ? <View style={styles.iconSlot}>{trailing}</View> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...( { cursor: 'pointer' } as any ),
  },
  baseHovered: {
    ...( { boxShadow: '0 6px 18px rgba(0,0,0,0.06)' } as any ),
  },
  basePressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconSlot: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  labelOutlined: {
    color: colors.selected,
  },
  labelFilled: {
    color: '#FFFFFF',
  },
  labelNeutral: {
    color: colors.textStrong,
  },
  filled: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  filledHovered: {
    ...( { boxShadow: 'inset 0 0 0 2px rgba(255,255,255,1), 0 6px 18px rgba(0,0,0,0.08)' } as any ),
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.selected,
  },
  outlinedHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
    ...( { boxShadow: `inset 0 0 0 1px ${colors.selected}, 0 6px 18px rgba(0,0,0,0.06)` } as any ),
  },
  neutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  neutralHovered: {
    backgroundColor: colors.hoverBackground,
    ...( { boxShadow: `inset 0 0 0 1px ${colors.border}, 0 6px 18px rgba(0,0,0,0.06)` } as any ),
  },
})


