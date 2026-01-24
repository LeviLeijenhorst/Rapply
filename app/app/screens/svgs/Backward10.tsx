import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Backward10({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9.54004 15.92V10.58L8.04004 12.25" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.02 4.46997L12 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.90988 7.79999C3.79988 9.27999 3.10986 11.11 3.10986 13.11C3.10986 18.02 7.08988 22 11.9999 22C16.9099 22 20.8899 18.02 20.8899 13.11C20.8899 8.19999 16.9099 4.21997 11.9999 4.21997C11.3199 4.21997 10.6599 4.31002 10.0199 4.46002" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 10.58C15.1 10.58 16 11.48 16 12.58V13.93C16 15.03 15.1 15.93 14 15.93C12.9 15.93 12 15.03 12 13.93V12.58C12 11.47 12.9 10.58 14 10.58Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
