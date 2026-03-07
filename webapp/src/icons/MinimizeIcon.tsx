import React from 'react'
import Svg, { Line } from 'react-native-svg'

type Props = {
  size?: number
}

export function MinimizeIcon({ size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 31 32" fill="none">
      <Line x1="8.75" y1="16.25" x2="23.25" y2="16.25" stroke="#1D0A00" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

