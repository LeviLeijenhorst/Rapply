import React from 'react'
import { Svg, Path } from 'react-native-svg'

type Props = {
  color?: string
  size?: number
}

export function ChevronRightIcon({ color = '#171717', size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
