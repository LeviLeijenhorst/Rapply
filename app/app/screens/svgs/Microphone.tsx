import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Microphone({ color = colors.textPrimary, size = 30 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path d="M7.5 15V16.25C7.5 20.3875 10.8625 23.75 15 23.75C19.1375 23.75 22.5 20.3875 22.5 16.25V10C22.5 5.8625 19.1375 2.5 15 2.5C10.8625 2.5 7.5 5.8625 7.5 10" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3.75 13.75V16.25C3.75 22.4625 8.7875 27.5 15 27.5C21.2125 27.5 26.25 22.4625 26.25 16.25V13.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M11.3877 9.34998C13.6127 8.53748 16.0377 8.53748 18.2627 9.34998" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12.5376 13.1C14.0376 12.6875 15.6251 12.6875 17.1251 13.1" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
