import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { Text } from '../ui/Text'
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon'

type BreadcrumbItem = {
  label: string
  onPress: () => void
}

type Props = {
  items: BreadcrumbItem[]
}

export function BreadcrumbBar({ items }: Props) {
  if (items.length < 2) return null

  return (
    <View style={styles.container}>
      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isAccent = index % 2 === 1
        const isFirst = index === 0
        return (
          <View key={`${item.label}-${index}`} style={styles.itemRow}>
            {!isFirst ? (
              <View style={styles.chevronWrapper}>
                {/* Breadcrumb separator */}
                <View style={styles.chevronRotate}>
                  <ChevronLeftIcon color={colors.text} size={16} />
                </View>
              </View>
            ) : null}
            <Pressable onPress={item.onPress} style={({ hovered }) => [styles.itemPressable, hovered ? styles.itemPressableHovered : undefined]}>
              {/* Breadcrumb label */}
              <Text isSemibold style={[styles.itemText, isAccent ? styles.itemTextMagenta : styles.itemTextDefault]}>
                {item.label}
              </Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevronWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronRotate: {
    transform: [{ rotate: '180deg' }],
  },
  itemPressable: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressableHovered: {
    opacity: 0.7,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 18,
  },
  itemTextMagenta: {
    color: colors.selected,
  },
  itemTextDefault: {
    color: '#000000',
  },
})

