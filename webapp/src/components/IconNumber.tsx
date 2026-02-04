import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { Text } from './Text'

type Props = {
  value: number
}

export function IconNumber({ value }: Props) {
  return (
    <View style={styles.container}>
      {/* Icon number */}
      <Text isBold style={styles.text}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
})

