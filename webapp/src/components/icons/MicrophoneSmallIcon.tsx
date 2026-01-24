import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function MicrophoneSmallIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 12V13C6 16.31 8.69 19 12 19C15.31 19 18 16.31 18 13V7.99999C18 4.68999 15.31 1.99999 12 1.99999C8.69 1.99999 6 4.68999 6 7.99999"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 11V13C3 17.97 7.03 22 12 22C16.97 22 21 17.97 21 13V11" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.11035 7.47997C10.8904 6.82997 12.8304 6.82997 14.6104 7.47997" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.0298 10.48C11.2298 10.15 12.4998 10.15 13.6998 10.48" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

