import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function LoginArrow({ color = colors.orange, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11.6799 14.62L14.2399 12.06L11.6799 9.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 12.06H14.17" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 4C16.42 4 20 7 20 12C20 17 16.42 20 12 20" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
