import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  width?: number
  height?: number
}

export function CheckmarkIcon({ color = '#FFFFFF', width = 32, height = 26 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 32 26" fill="none">
      <Path d="M2 15.75L9.63636 24L30 2" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
