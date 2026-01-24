import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function ProfileCircle({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.9405 8.04C15.1605 8.48 15.2905 8.98 15.2905 9.51C15.2805 11.28 13.8905 12.73 12.1305 12.78C12.0605 12.77 11.9705 12.77 11.8905 12.78C10.1305 12.72 8.73047 11.28 8.73047 9.51C8.73047 7.7 10.1905 6.23 12.0105 6.23" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18.7398 19.38C16.9598 21.01 14.5998 22 11.9998 22C9.39977 22 7.03977 21.01 5.25977 19.38C5.35977 18.44 5.95977 17.52 7.02977 16.8C9.76977 14.98 14.2498 14.98 16.9698 16.8C18.0398 17.52 18.6398 18.44 18.7398 19.38Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M4 6C2.75 7.67 2 9.75 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C10.57 2 9.2 2.3 7.97 2.85" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
