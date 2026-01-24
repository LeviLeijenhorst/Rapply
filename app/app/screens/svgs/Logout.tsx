import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Logout({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17.44 14.5599L20 11.9999L17.44 9.43994" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M14.7597 12H19.9297" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9.75973 12H11.7197" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5.99 6.47998C4.75 7.83998 4 9.70998 4 12C4 17 7.58 20 12 20" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 4C10.95 4 9.95 4.17 9.03 4.49" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
