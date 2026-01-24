import React from 'react'
import { StyleSheet, Text as ReactNativeText } from 'react-native'

import { typography } from '../theme/typography'

type Props = React.ComponentProps<typeof ReactNativeText> & {
  isBold?: boolean
}

export function Text({ style, isBold, ...rest }: Props) {
  return <ReactNativeText style={[styles.text, isBold ? styles.bold : undefined, style]} {...rest} />
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamilyRegular,
  },
  bold: {
    fontFamily: typography.fontFamilyBold,
  },
})

