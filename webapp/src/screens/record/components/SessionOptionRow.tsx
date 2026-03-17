import React from 'react'
import { Animated, Pressable, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { ChevronDownIcon } from '../../../icons/ChevronDownIcon'
import { ChevronRightIcon } from '../../../icons/ChevronRightIcon'
import { colors } from '../../../design/theme/colors'
import { webTransitionSmooth } from '../../../design/theme/transitions'
import { styles } from '../styles'

type InputOptionRowProps = {
  id?: string
  label: string
  subtitle?: string
  leftIcon: React.ReactNode
  iconAccentFrom?: string
  iconAccentTo?: string
  showChevron?: boolean
  isExpanded?: boolean
  isSelected: boolean
  isDisabled?: boolean
  onPress?: () => void
}

export function InputOptionRow({
  id,
  label,
  subtitle,
  leftIcon,
  iconAccentFrom = '#F3F4F6',
  iconAccentTo = '#E9EBEE',
  showChevron = false,
  isExpanded = false,
  isSelected,
  isDisabled = false,
  onPress,
}: InputOptionRowProps) {
  const disabled = isDisabled || !onPress

  return (
    <Pressable
      id={id}
      onPress={onPress}
      disabled={disabled}
      style={({ hovered }) => [
        styles.optionRow,
        webTransitionSmooth,
        isSelected ? styles.optionRowSelected : styles.optionRowUnselected,
        hovered && !disabled ? styles.optionRowHovered : undefined,
        disabled ? styles.optionRowDisabled : undefined,
      ]}
    >
      <View style={styles.optionRowContent}>
        <View
          style={[
            styles.optionRowIconWrap,
            {
              backgroundColor: iconAccentFrom,
              ...( { backgroundImage: `linear-gradient(to top right, ${iconAccentFrom} 0%, ${iconAccentTo} 100%)` } as any ),
            },
          ]}
        >
          {leftIcon}
        </View>
        <View style={styles.optionRowTextWrap}>
          <Text isSemibold style={styles.optionRowText}>
            {label}
          </Text>
          {subtitle ? <Text style={styles.optionRowSubtitle}>{subtitle}</Text> : null}
        </View>
        {showChevron ? (
          <Animated.View
            style={[
              styles.optionRowRightIcon,
              webTransitionSmooth,
              { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] } as any,
            ]}
          >
            <ChevronDownIcon color={colors.textStrong} size={20} />
          </Animated.View>
        ) : (
          <ChevronRightIcon color="#93858D" size={18} />
        )}
      </View>
    </Pressable>
  )
}




