import { forwardRef } from "react"
import { Text as RNText, TextProps as RNTextProps } from "react-native"

import { typography } from "./constants"

export const Text = forwardRef<RNText, RNTextProps>(function Text(props, ref) {
  const { style, ...rest } = props
  return <RNText ref={ref} {...rest} style={[{ fontFamily: typography.fontFamily }, style]} />
})
