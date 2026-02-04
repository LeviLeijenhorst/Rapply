import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function ShareTranscriptIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M9 11.25V2.71497" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5125 4.3875L9.00005 1.875L6.48755 4.3875" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M6.55511 16.125C3.20261 16.125 1.86011 14.7825 1.86011 11.43V11.3325C1.86011 8.31749 2.94761 6.93 5.60261 6.6825"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.3301 6.67505C15.0301 6.90755 16.1326 8.29505 16.1326 11.3325V11.43C16.1326 14.7825 14.7901 16.125 11.4376 16.125H9.75757"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

