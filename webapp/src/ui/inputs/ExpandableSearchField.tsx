import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, Pressable, StyleProp, StyleSheet, TextInput, TextStyle, ViewStyle } from 'react-native'

import { SearchIcon } from '../../icons/SearchIcon'
import { Text } from '../Text'
import { colors } from '../../design/theme/colors'
import { brandColors } from '../../design/tokens/colors'
import { fontSizes } from '../../design/tokens/fontSizes'
import { radius } from '../../design/tokens/radius'
import { spacing } from '../../design/tokens/spacing'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { SearchBar } from './SearchBar'

type Props = {
  isExpanded: boolean
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  onExpand: () => void
  onBlur?: () => void
  inputRef?: React.RefObject<TextInput | null>
  collapsedLabel?: string
  expandedWidth?: number
  collapsedWidth?: number
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
}

// Renders a compact search trigger that expands into a full search input when active.
export function ExpandableSearchField({
  isExpanded,
  value,
  onChangeText,
  placeholder,
  onExpand,
  onBlur,
  inputRef,
  collapsedLabel = 'Zoeken',
  expandedWidth = 315,
  collapsedWidth = 138,
  containerStyle,
  inputStyle,
}: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const targetWidth = isExpanded ? expandedWidth : collapsedWidth
  const animatedWidth = useRef(new Animated.Value(targetWidth)).current

  const animationConfig = useMemo(() => {
    if (isReducedMotionEnabled) return null
    return { durationMs: 180, easing: Easing.out(Easing.cubic) }
  }, [isReducedMotionEnabled])

  useEffect(() => {
    if (!animationConfig) {
      animatedWidth.setValue(targetWidth)
      return
    }

    Animated.timing(animatedWidth, {
      toValue: targetWidth,
      duration: animationConfig.durationMs,
      easing: animationConfig.easing,
      useNativeDriver: false,
    }).start()
  }, [animatedWidth, animationConfig, targetWidth])

  return (
    <Animated.View style={[containerStyle, { width: animatedWidth }]}>
      {/* Search content */}
      {isExpanded ? (
        <SearchBar
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onBlur={onBlur}
          inputRef={inputRef}
          inputStyle={inputStyle}
        />
      ) : (
        <Pressable
          onPress={onExpand}
          style={({ hovered }) => [
            styles.collapsedButton,
            hovered ? styles.collapsedButtonHovered : undefined,
          ]}
        >
          {/* Search trigger */}
          <SearchIcon color={brandColors.neutral700} size={18} />
          <Text style={styles.collapsedButtonText}>
            {collapsedLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  collapsedButton: {
    width: '100%',
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  collapsedButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: brandColors.neutral700,
  },
})


