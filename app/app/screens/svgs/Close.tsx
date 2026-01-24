import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Close({ color = colors.textPrimary, size = 55 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 55 55" fill="none">
      <Path d="M20.5859 34.3098L34.3099 20.5859" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M34.3099 34.3098L20.5859 20.5859" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
