import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function ShareAudio({ color = colors.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M4.5 7.39502V10.6125" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.75 6.32251V11.6775" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 11.2424V12.7499" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 5.25V8.96251" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.25 6.32251V11.6775" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.5 7.39502V10.6125" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1.5 9.74249V11.25C1.5 15 3 16.5 6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
