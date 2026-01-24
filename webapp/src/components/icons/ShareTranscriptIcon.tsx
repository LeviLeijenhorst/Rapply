import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function ShareTranscriptIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M2.25 3.375H15.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.25 7.125H9.3525" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.25 10.875H15.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.25 14.625H9.3525" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

