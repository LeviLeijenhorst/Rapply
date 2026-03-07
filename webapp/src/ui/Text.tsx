import React from 'react'
import { StyleSheet, Text as ReactNativeText } from 'react-native'

import { typography } from '../design/theme/typography'

type Props = React.ComponentProps<typeof ReactNativeText> & {
  isBold?: boolean
  isSemibold?: boolean
}

export function Text({ style, isBold, isSemibold, ...rest }: Props) {
  return <ReactNativeText style={[styles.text, isSemibold ? styles.semibold : undefined, isBold ? styles.bold : undefined, style]} {...rest} />
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamilyRegular,
  },
  semibold: {
    fontFamily: typography.fontFamilySemibold,
  },
  bold: {
    fontFamily: typography.fontFamilyBold,
  },
})


