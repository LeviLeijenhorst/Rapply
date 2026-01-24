import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Forward10({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13.98 4.46997L12 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19.0899 7.79999C20.1999 9.27999 20.8899 11.11 20.8899 13.11C20.8899 18.02 16.9099 22 11.9999 22C7.08988 22 3.10986 18.02 3.10986 13.11C3.10986 8.19999 7.08988 4.21997 11.9999 4.21997C12.6799 4.21997 13.3399 4.31002 13.9799 4.46002" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.54004 15.92V10.58L8.04004 12.25" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 10.58C15.1 10.58 16 11.48 16 12.58V13.93C16 15.03 15.1 15.93 14 15.93C12.9 15.93 12 15.03 12 13.93V12.58C12 11.47 12.9 10.58 14 10.58Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
