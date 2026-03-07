import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function PlusIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.00098 12.0004H18.001" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18V5.99997" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

