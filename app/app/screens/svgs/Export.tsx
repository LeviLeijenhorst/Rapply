import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Export({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15V3.62" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.3499 5.85L11.9999 2.5L8.6499 5.85" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.73998 21.5C4.26998 21.5 2.47998 19.71 2.47998 15.24V15.11C2.47998 11.09 3.92998 9.24 7.46998 8.91" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.4398 8.9C20.0398 9.21 21.5098 11.06 21.5098 15.11V15.24C21.5098 19.71 19.7198 21.5 15.2498 21.5H13.0098" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
