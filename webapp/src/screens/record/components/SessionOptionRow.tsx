import React from 'react'
import { Animated, Pressable, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { ChevronDownIcon } from '../../../icons/ChevronDownIcon'
import { colors } from '../../../design/theme/colors'
import { webTransitionSmooth } from '../../../design/theme/transitions'
import { styles } from '../styles'

type InputOptionRowProps = {
  id?: string
  label: string
  leftIcon: React.ReactNode
  showChevron?: boolean
  isExpanded?: boolean
  isSelected: boolean
  onPress: () => void
}

export function InputOptionRow({ id, label, leftIcon, showChevron = false, isExpanded = false, isSelected, onPress }: InputOptionRowProps) {
  return (
    <Pressable
      id={id}
      onPress={onPress}
      style={({ hovered }) => [
        styles.optionRow,
        webTransitionSmooth,
        isSelected ? styles.optionRowSelected : styles.optionRowUnselected,
        hovered ? styles.optionRowHovered : undefined,
      ]}
    >
      <View style={styles.optionRowContent}>
        {leftIcon}
        <Text isSemibold style={styles.optionRowText}>
          {label}
        </Text>
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
        ) : null}
      </View>
    </Pressable>
  )
}




