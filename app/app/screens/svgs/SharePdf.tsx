import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function SharePdf({ color = colors.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M2.25 5.25C2.25 3 3.375 1.5 6 1.5H12C14.625 1.5 15.75 3 15.75 5.25V12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V8.26501" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.875 3.375V4.875C10.875 5.7 11.55 6.375 12.375 6.375H13.875" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 9.75H9" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12.75H12" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
