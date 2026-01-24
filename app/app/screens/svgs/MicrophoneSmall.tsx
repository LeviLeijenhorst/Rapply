import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function MicrophoneSmall({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7.99951 10.02V11.5C7.99951 13.71 9.78951 15.5 11.9995 15.5C14.2095 15.5 15.9995 13.71 15.9995 11.5V6C15.9995 3.79 14.2095 2 11.9995 2C9.78951 2 7.99951 3.79 7.99951 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.34961 9.64999V11.35C4.34961 15.57 7.77961 19 11.9996 19C16.2196 19 19.6496 15.57 19.6496 11.35V9.64999" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.6094 6.43C11.5094 6.1 12.4894 6.1 13.3894 6.43" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.1997 8.55001C11.7297 8.41001 12.2797 8.41001 12.8097 8.55001" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.9995 19V22" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
