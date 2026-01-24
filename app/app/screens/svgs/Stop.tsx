import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Stop({ color = colors.textPrimary, size = 48 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M18.6 42H29.4C38.4 42 42 38.4 42 29.4V18.6C42 9.6 38.4 6 29.4 6H18.6C9.6 6 6 9.6 6 18.6V29.4C6 38.4 9.6 42 18.6 42Z" fill={color} />
    </Svg>
  )
}
